
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

    // Determinar quais tipos de conteúdo buscar
    const contentTypes = filters?.resourceType?.length 
      ? filters.resourceType.map(type => type === 'titulo' ? 'livro' : type === 'video' ? 'aula' : type)
      : ['livro', 'aula', 'podcast'];

    console.log('📋 Content types to search:', contentTypes);

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

    // Função para buscar dados paginados de um tipo específico com paginação real
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

    // Buscar dados para os tipos solicitados
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
    let allItems: any[] = [];
    let totalFromAllTypes = 0;

    for (const result of results) {
      allItems = allItems.concat(result.items);
      totalFromAllTypes += result.total;
    }
    
    console.log(`📊 Total items before filtering: ${allItems.length}, Total available: ${totalFromAllTypes}`);

    // Se estamos buscando tipos específicos, usar o total desse tipo
    // Se estamos buscando todos os tipos, somar os totais
    let actualTotal = totalFromAllTypes;
    
    if (filters?.resourceType?.length === 1) {
      // Busca por tipo específico - usar o total desse tipo
      const typeTotal = results.find(r => {
        const mappedType = filters.resourceType![0] === 'titulo' ? 'livro' : 
                          filters.resourceType![0] === 'video' ? 'aula' : 
                          filters.resourceType![0];
        return r.tipo === mappedType;
      })?.total || 0;
      actualTotal = typeTotal;
    }

    // Aplicar filtros localmente se necessário
    let filteredItems = allItems;

    // Filtro por query (busca no título, autor e descrição)
    if (query?.trim()) {
      const searchTerms = query.toLowerCase().trim().split(' ');
      filteredItems = filteredItems.filter(item => {
        const searchText = `${item.title} ${item.author} ${item.description}`.toLowerCase();
        return searchTerms.every(term => searchText.includes(term));
      });
      
      // Se há busca por texto, o total deve ser recalculado
      // Isso requer buscar todos os itens para filtrar - implementação simplificada por ora
      actualTotal = filteredItems.length;
    }

    // Aplicar outros filtros
    if (filters?.author?.trim()) {
      const authorFilter = filters.author.toLowerCase().trim();
      filteredItems = filteredItems.filter(item => 
        item.author.toLowerCase().includes(authorFilter)
      );
      actualTotal = filteredItems.length;
    }

    if (filters?.subject?.length) {
      filteredItems = filteredItems.filter(item =>
        filters.subject!.some(subject => 
          item.subject.toLowerCase().includes(subject.toLowerCase())
        )
      );
      actualTotal = filteredItems.length;
    }

    if (filters?.year?.trim()) {
      const yearFilter = parseInt(filters.year);
      if (!isNaN(yearFilter)) {
        filteredItems = filteredItems.filter(item => item.year === yearFilter);
        actualTotal = filteredItems.length;
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
      actualTotal = filteredItems.length;
    }

    if (filters?.language?.length) {
      filteredItems = filteredItems.filter(item =>
        filters.language!.some(lang => 
          item.language?.toLowerCase().includes(lang.toLowerCase()) ||
          item.pais?.toLowerCase().includes(lang.toLowerCase())
        )
      );
      actualTotal = filteredItems.length;
    }

    if (filters?.documentType?.length) {
      filteredItems = filteredItems.filter(item =>
        filters.documentType!.some(docType => 
          item.documentType?.toLowerCase().includes(docType.toLowerCase())
        )
      );
      actualTotal = filteredItems.length;
    }

    console.log(`📊 Total items after filtering: ${filteredItems.length}, Actual total: ${actualTotal}`);

    // Aplicar ordenação
    if (sortBy) {
      filteredItems.sort((a, b) => {
        switch (sortBy) {
          case 'recent':
            return b.year - a.year;
          case 'accessed':
            const typeOrder = { 'podcast': 3, 'video': 2, 'titulo': 1 };
            return (typeOrder[b.type] || 0) - (typeOrder[a.type] || 0);
          case 'title':
            return a.title.localeCompare(b.title);
          default: // relevance
            if (query?.trim()) {
              const searchTerms = query.toLowerCase().trim().split(' ');
              const getRelevance = (item: any) => {
                const title = item.title.toLowerCase();
                const author = item.author.toLowerCase();
                let score = 0;
                
                searchTerms.forEach(term => {
                  if (title.includes(term)) score += 10;
                  if (author.includes(term)) score += 5;
                  if (item.description.toLowerCase().includes(term)) score += 1;
                });
                
                return score;
              };
              
              return getRelevance(b) - getRelevance(a);
            }
            return 0;
        }
      });
    }

    // Para paginação final, se não há filtros que afetam o total, usar os itens já paginados
    // Se há filtros, os itens já foram filtrados, então usar eles diretamente
    const hasFiltersAffectingTotal = query?.trim() || filters?.author?.trim() || 
      filters?.subject?.length || filters?.year?.trim() || filters?.duration?.trim() ||
      filters?.language?.length || filters?.documentType?.length;

    let finalItems = filteredItems;
    
    // Se há filtros que afetam o total, precisamos paginar localmente
    if (hasFiltersAffectingTotal) {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      finalItems = filteredItems.slice(startIndex, endIndex);
    }
    
    const totalPages = Math.ceil(actualTotal / limit);

    console.log(`📄 Final pagination: page ${page}/${totalPages}, showing ${finalItems.length}/${actualTotal} items`);

    const response = {
      success: true,
      results: finalItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: actualTotal,
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
