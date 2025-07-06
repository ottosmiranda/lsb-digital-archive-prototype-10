import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const API_BASE_URL = 'https://link-business-school.onrender.com/api/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  query?: string;
  filters?: {
    resourceType?: string[];
    subject?: string[];
    author?: string;
    year?: string;
    duration?: string;
    language?: string[];
    documentType?: string[];
  };
  sortBy?: string;
  page?: number;
  limit?: number;
}

// Cache para totais da API externa (30 minutos)
const totalsCache = new Map<string, { total: number; timestamp: number }>();
const TOTALS_CACHE_TTL = 30 * 60 * 1000; // 30 minutos

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, filters, sortBy, page = 1, limit = 9 }: SearchParams = await req.json();
    
    console.log('🔍 Search request:', { query, filters, sortBy, page, limit });

    // Determinar quais tipos de conteúdo buscar - FIXED: Handle 'all' correctly
    let contentTypes: string[];
    let isMultiTypeSearch = false;
    
    if (filters?.resourceType?.length) {
      // Se contém 'all', buscar todos os tipos
      if (filters.resourceType.includes('all')) {
        contentTypes = ['livro', 'aula', 'podcast'];
        isMultiTypeSearch = true;
      } else {
        // Mapear tipos específicos
        contentTypes = filters.resourceType.map(type => 
          type === 'titulo' ? 'livro' : type === 'video' ? 'aula' : type
        );
        isMultiTypeSearch = contentTypes.length > 1;
      }
    } else {
      // Padrão: buscar todos os tipos
      contentTypes = ['livro', 'aula', 'podcast'];
      isMultiTypeSearch = true;
    }

    console.log('📋 Content types to search:', contentTypes, '| Multi-type:', isMultiTypeSearch);

    // Função para obter total real da API externa
    const getRealTotal = async (tipo: string): Promise<number> => {
      const cacheKey = `total_${tipo}`;
      const cached = totalsCache.get(cacheKey);
      
      // Verificar cache
      if (cached && (Date.now() - cached.timestamp) < TOTALS_CACHE_TTL) {
        console.log(`📊 Cache HIT for ${tipo} total: ${cached.total}`);
        return cached.total;
      }

      try {
        console.log(`📊 Fetching real total for ${tipo} from API`);
        const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=1&limit=1`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'LSB-Search/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const rawData = await response.json();
        const total = rawData.total || 0;
        
        // Cachear o total
        totalsCache.set(cacheKey, { total, timestamp: Date.now() });
        
        console.log(`✅ Real total for ${tipo}: ${total}`);
        return total;
        
      } catch (error) {
        console.error(`❌ Error fetching total for ${tipo}:`, error);
        return 0;
      }
    };

    // Nova função para paginação real e inteligente
    const fetchContentWithRealPagination = async (): Promise<{ items: any[], totalResults: number }> => {
      console.log('🎯 Starting REAL intelligent pagination');
      
      // Primeiro, obter totais de cada tipo
      const totals = await Promise.all(
        contentTypes.map(async (tipo) => ({
          tipo,
          total: await getRealTotal(tipo)
        }))
      );
      
      const totalResults = totals.reduce((sum, t) => sum + t.total, 0);
      console.log('📊 Content totals:', totals, 'Total combined:', totalResults);
      
      if (totalResults === 0) {
        return { items: [], totalResults: 0 };
      }
      
      // Calcular quais itens precisamos para esta página específica
      const startIndex = (page - 1) * limit; // Índice global inicial
      const endIndex = startIndex + limit; // Índice global final
      
      console.log(`📄 Page ${page}: need items ${startIndex} to ${endIndex-1} from total ${totalResults}`);
      
      // Se a página solicitada está além do total disponível
      if (startIndex >= totalResults) {
        console.log(`⚠️ Page ${page} is beyond available content (${totalResults} total)`);
        return { items: [], totalResults };
      }
      
      // Estratégia: buscar sequencialmente por tipo para manter ordem alfabética
      let allItems: any[] = [];
      let currentGlobalIndex = 0;
      
      for (const { tipo, total } of totals) {
        if (total === 0) continue;
        
        const typeStartIndex = currentGlobalIndex;
        const typeEndIndex = currentGlobalIndex + total;
        
        console.log(`📚 ${tipo}: global range ${typeStartIndex}-${typeEndIndex-1}`);
        
        // Verificar se precisamos de itens deste tipo para a página atual
        if (endIndex <= typeStartIndex) {
          // A página atual termina antes deste tipo começar
          console.log(`⏭️ Skipping ${tipo} - page ends before this type`);
          break;
        }
        
        if (startIndex >= typeEndIndex) {
          // A página atual começa depois deste tipo terminar
          console.log(`⏭️ Skipping ${tipo} - page starts after this type`);
          currentGlobalIndex = typeEndIndex;
          continue;
        }
        
        // Calcular quantos itens deste tipo precisamos
        const neededStart = Math.max(0, startIndex - typeStartIndex);
        const neededEnd = Math.min(total, endIndex - typeStartIndex);
        const neededCount = neededEnd - neededStart;
        
        console.log(`🎯 ${tipo}: need ${neededCount} items (local range ${neededStart}-${neededEnd-1})`);
        
        if (neededCount > 0) {
          // Buscar os itens específicos deste tipo
          const typeItems = await fetchSpecificItemsFromType(tipo, neededStart, neededCount);
          allItems = allItems.concat(typeItems);
          
          console.log(`✅ ${tipo}: fetched ${typeItems.length} items`);
        }
        
        currentGlobalIndex = typeEndIndex;
      }
      
      console.log(`🎯 Final result: ${allItems.length} items for page ${page}`);
      return { items: allItems, totalResults };
    };

    // Função para buscar itens específicos de um tipo
    const fetchSpecificItemsFromType = async (tipo: string, skip: number, take: number): Promise<any[]> => {
      console.log(`🔍 Fetching ${take} items from ${tipo}, skipping ${skip}`);
      
      try {
        // Para tipos com poucos itens, buscar tudo e paginar localmente
        const total = await getRealTotal(tipo);
        
        if (total <= 100) {
          // Buscar tudo de uma vez e paginar localmente
          const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=1&limit=100`;
          console.log(`🌐 Fetching all ${tipo} items for local pagination`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'User-Agent': 'LSB-Search/1.0'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const rawData = await response.json();
          const allItems = rawData.conteudo || [];
          
          // Ordenar alfabeticamente e aplicar skip/take
          const sortedItems = allItems.sort((a, b) => {
            const titleA = (a.titulo || a.podcast_titulo || a.title || '').toLowerCase();
            const titleB = (b.titulo || b.podcast_titulo || b.title || '').toLowerCase();
            return titleA.localeCompare(titleB);
          });
          
          const pagedItems = sortedItems.slice(skip, skip + take);
          const transformedItems = pagedItems.map((item: any) => transformToSearchResult(item, tipo));
          
          console.log(`✅ ${tipo} local pagination: ${transformedItems.length} items`);
          return transformedItems;
          
        } else {
          // Para tipos com muitos itens (podcasts), usar paginação da API
          const itemsPerPage = 100;
          const startPage = Math.floor(skip / itemsPerPage) + 1;
          const endPage = Math.floor((skip + take - 1) / itemsPerPage) + 1;
          
          console.log(`📄 ${tipo} API pagination: pages ${startPage}-${endPage}`);
          
          let allFetchedItems: any[] = [];
          
          for (let apiPage = startPage; apiPage <= endPage; apiPage++) {
            const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${apiPage}&limit=${itemsPerPage}`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(url, {
              signal: controller.signal,
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'LSB-Search/1.0'
              }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const rawData = await response.json();
              const items = rawData.conteudo || [];
              allFetchedItems = allFetchedItems.concat(items);
              
              console.log(`📄 ${tipo} page ${apiPage}: ${items.length} items`);
              
              if (items.length < itemsPerPage) break;
            }
          }
          
          // Ordenar e extrair exatamente os itens necessários
          const sortedItems = allFetchedItems.sort((a, b) => {
            const titleA = (a.titulo || a.podcast_titulo || a.title || '').toLowerCase();
            const titleB = (b.titulo || b.podcast_titulo || b.title || '').toLowerCase();
            return titleA.localeCompare(titleB);
          });
          
          const localSkip = skip % (itemsPerPage * (endPage - startPage + 1));
          const pagedItems = sortedItems.slice(localSkip, localSkip + take);
          const transformedItems = pagedItems.map((item: any) => transformToSearchResult(item, tipo));
          
          console.log(`✅ ${tipo} API pagination: ${transformedItems.length} items`);
          return transformedItems;
        }
        
      } catch (error) {
        console.error(`❌ Error fetching ${tipo} items:`, error);
        return [];
      }
    };

    // Função para buscar dados paginados de um tipo específico (busca single-type)
    const fetchContentType = async (tipo: string, requestedPage: number, requestedLimit: number) => {
      try {
        // Primeiro, obter o total real
        const realTotal = await getRealTotal(tipo);
        
        if (realTotal === 0) {
          console.log(`⚠️ No content available for ${tipo}`);
          return { items: [], total: 0 };
        }

        // Calcular quais itens buscar baseado na página solicitada
        const startItem = (requestedPage - 1) * requestedLimit;
        const endItem = startItem + requestedLimit;
        
        // Verificar se a página solicitada existe
        if (startItem >= realTotal) {
          console.log(`📄 Page ${requestedPage} is beyond available content for ${tipo} (total: ${realTotal})`);
          return { items: [], total: realTotal };
        }

        let allItems: any[] = [];
        
        if (tipo === 'podcast') {
          // Para podcasts, implementar paginação real da API externa
          const apiPageSize = 100; // Buscar em chunks de 100
          const startApiPage = Math.floor(startItem / apiPageSize) + 1;
          const endApiPage = Math.floor((endItem - 1) / apiPageSize) + 1;
          
          console.log(`📄 ${tipo} pagination: requesting items ${startItem}-${endItem}, API pages ${startApiPage}-${endApiPage}`);
          
          // Buscar as páginas necessárias da API externa
          for (let apiPage = startApiPage; apiPage <= endApiPage; apiPage++) {
            const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${apiPage}&limit=${apiPageSize}`;
            console.log(`🌐 Fetching ${tipo} page ${apiPage} from:`, url);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(url, {
              signal: controller.signal,
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'LSB-Search/1.0'
              }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              console.warn(`⚠️ API page ${apiPage} failed: ${response.status}`);
              continue;
            }
            
            const rawData = await response.json();
            const items = rawData.conteudo || [];
            allItems = allItems.concat(items);
            
            console.log(`✅ ${tipo} page ${apiPage}: ${items.length} items fetched, total so far: ${allItems.length}`);
            
            // Se não há mais itens, parar
            if (items.length < apiPageSize) {
              console.log(`📄 Reached end of ${tipo} data at page ${apiPage}`);
              break;
            }
          }
          
          // Extrair apenas os itens necessários para a página solicitada
          const itemsInAllPages = allItems.length;
          const localStartIndex = startItem % (apiPageSize * (endApiPage - startApiPage + 1));
          const localEndIndex = localStartIndex + requestedLimit;
          
          allItems = allItems.slice(localStartIndex, localEndIndex);
          console.log(`📊 Final ${tipo} items for page ${requestedPage}: ${allItems.length} of ${itemsInAllPages} loaded, total available: ${realTotal}`);
          
        } else {
          // Para tipos com poucos itens (livro, aula), buscar tudo de uma vez se necessário
          if (realTotal <= 100) {
            const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=1&limit=100`;
            console.log(`🌐 Fetching all ${tipo} from:`, url);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(url, {
              signal: controller.signal,
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'LSB-Search/1.0'
              }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const rawData = await response.json();
            const allContentItems = rawData.conteudo || [];
            
            // Paginar localmente
            allItems = allContentItems.slice(startItem, endItem);
            console.log(`📊 ${tipo} local pagination: ${allItems.length} items for page ${requestedPage}`);
            
          } else {
            // Se há muitos itens, usar paginação da API
            const apiPage = Math.ceil(endItem / 100);
            const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${apiPage}&limit=100`;
            
            const response = await fetch(url, {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'LSB-Search/1.0'
              }
            });
            
            if (response.ok) {
              const rawData = await response.json();
              const items = rawData.conteudo || [];
              const localStart = startItem % 100;
              allItems = items.slice(localStart, localStart + requestedLimit);
            }
          }
        }
        
        return { items: allItems, total: realTotal };
        
      } catch (error) {
        console.error(`❌ Error fetching ${tipo}:`, error);
        return { items: [], total: 0 };
      }
    };

    let allItems: any[] = [];
    let totalFromAllTypes = 0;

    // Implementar paginação inteligente real para busca multi-tipo
    if (isMultiTypeSearch) {
      console.log('🎯 Using REAL intelligent pagination for multi-type search');
      
      const { items: fetchedItems, totalResults } = await fetchContentWithRealPagination();
      totalFromAllTypes = totalResults;
      
      // Aplicar filtros localmente se necessário
      let filteredItems = fetchedItems;

      // Filtro por query (busca no título, autor e descrição)
      if (query?.trim()) {
        const searchTerms = query.toLowerCase().trim().split(' ');
        filteredItems = filteredItems.filter(item => {
          const searchText = `${item.title} ${item.author} ${item.description}`.toLowerCase();
          return searchTerms.every(term => searchText.includes(term));
        });
        
        totalFromAllTypes = filteredItems.length;
      }

      // Aplicar outros filtros
      if (filters?.author?.trim()) {
        const authorFilter = filters.author.toLowerCase().trim();
        filteredItems = filteredItems.filter(item => 
          item.author.toLowerCase().includes(authorFilter)
        );
        totalFromAllTypes = filteredItems.length;
      }

      if (filters?.subject?.length) {
        filteredItems = filteredItems.filter(item =>
          filters.subject!.some(subject => 
            item.subject.toLowerCase().includes(subject.toLowerCase())
          )
        );
        totalFromAllTypes = filteredItems.length;
      }

      if (filters?.year?.trim()) {
        const yearFilter = parseInt(filters.year);
        if (!isNaN(yearFilter)) {
          filteredItems = filteredItems.filter(item => item.year === yearFilter);
          totalFromAllTypes = filteredItems.length;
        }
      }

      if (filters?.duration?.trim()) {
        filteredItems = filteredItems.filter(item => {
          if (!item.duration) return false;
          const duration = item.duration.toLowerCase();
          const filter = filters.duration!.toLowerCase();
          
          if (filter === 'curta') return duration.includes('m') && !duration.includes('h');
          if (filter === 'media') return duration.includes('h') && parseInt(duration) <= 2;
          if (filter === 'longa') return duration.includes('h') && parseInt(duration) > 2;
          
          return duration.includes(filter);
        });
        totalFromAllTypes = filteredItems.length;
      }

      if (filters?.language?.length) {
        filteredItems = filteredItems.filter(item =>
          filters.language!.some(lang => 
            item.language?.toLowerCase().includes(lang.toLowerCase()) ||
            item.pais?.toLowerCase().includes(lang.toLowerCase())
          )
        );
        totalFromAllTypes = filteredItems.length;
      }

      if (filters?.documentType?.length) {
        filteredItems = filteredItems.filter(item =>
          filters.documentType!.some(docType => 
            item.documentType?.toLowerCase().includes(docType.toLowerCase())
          )
        );
        totalFromAllTypes = filteredItems.length;
      }

      // Aplicar ordenação (já vem ordenado da paginação real, mas aplicar outros tipos)
      if (sortBy && sortBy !== 'relevance') {
        filteredItems.sort((a, b) => {
          switch (sortBy) {
            case 'recent':
              return b.year - a.year;
            case 'accessed':
              const typeOrder = { 'podcast': 3, 'video': 2, 'titulo': 1 };
              return (typeOrder[b.type] || 0) - (typeOrder[a.type] || 0);
            case 'title':
              return a.title.localeCompare(b.title);
            default:
              return 0;
          }
        });
      }

      // Para paginação real, já vem com os itens corretos
      allItems = filteredItems;
      
      console.log(`🎯 Real pagination result: ${allItems.length} items for page ${page}, total: ${totalFromAllTypes}`);
      
    } else {
      // Busca single-type (comportamento original)
      console.log('📄 Using single-type search pagination');
      
      const results = await Promise.all(
        contentTypes.map(async (tipo) => {
          const result = await fetchContentType(tipo, page, limit);
          return {
            tipo,
            items: result.items.map((item: any) => transformToSearchResult(item, tipo)),
            total: result.total
          };
        })
      );

      // Combinar resultados
      for (const result of results) {
        allItems = allItems.concat(result.items);
        totalFromAllTypes += result.total;
      }
    }
    
    console.log(`📊 Final results: ${allItems.length} items, total available: ${totalFromAllTypes}`);
    
    const totalPages = Math.ceil(totalFromAllTypes / limit);

    console.log(`📄 Final pagination: page ${page}/${totalPages}, showing ${allItems.length}/${totalFromAllTypes} items`);

    const response = {
      success: true,
      results: allItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: totalFromAllTypes,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      searchInfo: {
        query: query || '',
        appliedFilters: filters || {},
        sortBy: sortBy || 'relevance'
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Search function error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
      results: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalResults: 0,
        hasNextPage: false,
        hasPreviousPage: false
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function transformToSearchResult(item: any, tipo: string): any {
  const baseResult = {
    id: Math.floor(Math.random() * 10000) + 1000,
    originalId: item.id,
    title: item.titulo || item.podcast_titulo || item.title || 'Título não disponível',
    author: item.autor || item.canal || 'Link Business School',
    year: item.ano || new Date().getFullYear(),
    description: item.descricao || 'Descrição não disponível',
    subject: getSubjectFromCategories(item.categorias) || getDefaultSubject(tipo),
    type: tipo === 'livro' ? 'titulo' : tipo === 'aula' ? 'video' : 'podcast',
    thumbnail: item.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png'
  };

  if (tipo === 'livro') {
    return {
      ...baseResult,
      pdfUrl: item.arquivo,
      pages: item.paginas,
      language: item.language,
      documentType: item.tipo_documento || 'Livro'
    };
  } else if (tipo === 'aula') {
    return {
      ...baseResult,
      embedUrl: item.embed_url,
      duration: item.duracao_ms ? formatDuration(item.duracao_ms) : undefined
    };
  } else if (tipo === 'podcast') {
    return {
      ...baseResult,
      duration: item.duracao_ms ? formatDuration(item.duracao_ms) : undefined,
      embedUrl: item.embed_url
    };
  }

  return baseResult;
}

function getSubjectFromCategories(categorias: string[]): string {
  if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
    return '';
  }
  return categorias[0];
}

function getDefaultSubject(tipo: string): string {
  switch (tipo) {
    case 'livro': return 'Administração';
    case 'aula': return 'Empreendedorismo';
    case 'podcast': return 'Negócios';
    default: return 'Geral';
  }
}

function formatDuration(durationMs: number): string {
  const minutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}
