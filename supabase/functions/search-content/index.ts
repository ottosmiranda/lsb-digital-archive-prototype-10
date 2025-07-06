
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

    // Buscar em cada tipo de conteúdo em paralelo
    const searchPromises = contentTypes.map(async (tipo) => {
      try {
        // Para API externa, vamos buscar mais itens para ter dados suficientes para filtrar
        const searchLimit = Math.max(limit * 3, 30); // Buscar mais para poder filtrar
        const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=1&limit=${searchLimit}`;
        
        console.log(`🌐 Fetching ${tipo} from:`, url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
        
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
        const items = rawData.conteudo || [];
        
        console.log(`✅ ${tipo}: ${items.length} items fetched`);
        
        // Transformar dados para o formato SearchResult
        return items.map((item: any) => transformToSearchResult(item, tipo));
        
      } catch (error) {
        console.error(`❌ Error fetching ${tipo}:`, error);
        return [];
      }
    });

    // Aguardar todos os resultados
    const results = await Promise.all(searchPromises);
    const allItems = results.flat();
    
    console.log(`📊 Total items before filtering: ${allItems.length}`);

    // Aplicar filtros localmente
    let filteredItems = allItems;

    // Filtro por query (busca no título, autor e descrição)
    if (query?.trim()) {
      const searchTerms = query.toLowerCase().trim().split(' ');
      filteredItems = filteredItems.filter(item => {
        const searchText = `${item.title} ${item.author} ${item.description}`.toLowerCase();
        return searchTerms.every(term => searchText.includes(term));
      });
    }

    // Filtro por autor
    if (filters?.author?.trim()) {
      const authorFilter = filters.author.toLowerCase().trim();
      filteredItems = filteredItems.filter(item => 
        item.author.toLowerCase().includes(authorFilter)
      );
    }

    // Filtro por assunto
    if (filters?.subject?.length) {
      filteredItems = filteredItems.filter(item =>
        filters.subject!.some(subject => 
          item.subject.toLowerCase().includes(subject.toLowerCase())
        )
      );
    }

    // Filtro por ano
    if (filters?.year?.trim()) {
      const yearFilter = parseInt(filters.year);
      if (!isNaN(yearFilter)) {
        filteredItems = filteredItems.filter(item => item.year === yearFilter);
      }
    }

    // Filtro por duração (apenas para vídeos e podcasts)
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
    }

    // Filtro por linguagem
    if (filters?.language?.length) {
      filteredItems = filteredItems.filter(item =>
        filters.language!.some(lang => 
          item.language?.toLowerCase().includes(lang.toLowerCase()) ||
          item.pais?.toLowerCase().includes(lang.toLowerCase())
        )
      );
    }

    // Filtro por tipo de documento
    if (filters?.documentType?.length) {
      filteredItems = filteredItems.filter(item =>
        filters.documentType!.some(docType => 
          item.documentType?.toLowerCase().includes(docType.toLowerCase())
        )
      );
    }

    console.log(`📊 Total items after filtering: ${filteredItems.length}`);

    // Aplicar ordenação
    if (sortBy) {
      filteredItems.sort((a, b) => {
        switch (sortBy) {
          case 'recent':
            return b.year - a.year;
          case 'accessed':
            // Simulação de "mais acessados" - ordenar por tipo e depois por título
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

    // Aplicar paginação
    const totalResults = filteredItems.length;
    const totalPages = Math.ceil(totalResults / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    console.log(`📄 Pagination: page ${page}/${totalPages}, showing ${paginatedItems.length}/${totalResults} items`);

    const response = {
      success: true,
      results: paginatedItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults,
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
