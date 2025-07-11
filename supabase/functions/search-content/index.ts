import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// CONSTANTS - Totais conhecidos da API
const API_TOTALS = {
  livros: 47,
  artigos: 35, 
  videos: 276,
  podcasts: 2513
};

const TOTAL_ALL_CONTENT = API_TOTALS.livros + API_TOTALS.artigos + API_TOTALS.videos + API_TOTALS.podcasts; // 2871

interface SearchFilters {
  resourceType: string[];
  subject: string[];
  author: string[];
  year: string;
  duration: string;
  language: string[];
  documentType: string[];
  program: string[];
  channel: string[];
}

interface SearchRequest {
  query: string;
  filters: SearchFilters;
  sortBy: string;
  page: number;
  resultsPerPage: number;
}

// ✅ NOVA FUNÇÃO: Detecta o tipo de busca (query, global, paginada)
function detectSearchType(query: string, filters: SearchFilters): string {
  const hasQuery = query && query.trim() !== '';
  const hasResourceType = filters.resourceType && filters.resourceType.length > 0;

  if (hasQuery) {
    return 'queryBased';
  } else if (!hasResourceType || filters.resourceType.includes('all')) {
    return 'global';
  } else {
    return 'paginated';
  }
}

// ✅ NOVA FUNÇÃO: Busca baseada em query (usa novo endpoint)
async function performQueryBasedSearch(
  query: string,
  page: number,
  resultsPerPage: number
): Promise<any> {
  const requestId = `query_${Date.now()}`;
  console.log(`🔍 ${requestId} - Query-Based Search: ${query}`);
  
  try {
    const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';
    const url = `${API_BASE_URL}/conteudo-lbs/search?q=${encodeURIComponent(query)}&page=${page}&limit=${resultsPerPage}`;
    
    console.log(`🌐 Query API URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LSB-Query-Search/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} para query search: ${query}`);
    }

    const data = await response.json();
    
    if (!data.conteudo || !Array.isArray(data.conteudo)) {
      console.warn('⚠️ Query search returned no content:', data);
      return {
        success: false,
        results: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalResults: 0,
          hasNextPage: false,
          hasPreviousPage: false
        },
        searchInfo: {
          query: query,
          appliedFilters: {},
          sortBy: ''
        },
        error: 'No content found'
      };
    }
    
    console.log(`✅ Query search success: ${data.conteudo.length} items found`);
    
    return {
      success: true,
      results: data.conteudo,
      pagination: {
        currentPage: data.page || page,
        totalPages: data.totalPages || 0,
        totalResults: data.total || 0,
        hasNextPage: (data.page || page) < (data.totalPages || 0),
        hasPreviousPage: (data.page || page) > 1
      },
      searchInfo: {
        query: query,
        appliedFilters: {},
        sortBy: ''
      }
    };
    
  } catch (error) {
    console.error(`❌ Query search failed for "${query}":`, error);
    return {
      success: false,
      results: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalResults: 0,
        hasNextPage: false,
        hasPreviousPage: false
      },
      searchInfo: {
        query: query,
        appliedFilters: {},
        sortBy: ''
      },
      error: error.message
    };
  }
}

// ✅ CORRIGIDO: performGlobalSearch para mostrar totais reais
async function performGlobalSearch(
  filters: SearchFilters,
  sortBy: string,
  page: number,
  resultsPerPage: number
): Promise<any> {
  const requestId = `global_${Date.now()}`;
  console.log(`🌍 ${requestId} - Busca Global (TOTAIS REAIS)`);
  
  try {
    const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';
    
    // ✅ CORREÇÃO CRÍTICA: Buscar mais dados para permitir paginação real
    const itemsPerType = Math.max(100, resultsPerPage * 3); // Buscar pelo menos 100 de cada tipo
    
    const fetchPromises = await Promise.allSettled([
      fetch(`${API_BASE_URL}/conteudo-lbs?tipo=livro&page=1&limit=${itemsPerType}`),
      fetch(`${API_BASE_URL}/conteudo-lbs?tipo=artigos&page=1&limit=${itemsPerType}`),
      fetch(`${API_BASE_URL}/conteudo-lbs?tipo=aula&page=1&limit=${itemsPerType}`),
      fetch(`${API_BASE_URL}/conteudo-lbs?tipo=podcast&page=1&limit=${itemsPerType}`)
    ]);

    const allItems: any[] = [];
    let actualTotals = { livros: 0, artigos: 0, videos: 0, podcasts: 0 };

    // Processar resultados de cada tipo
    for (let i = 0; i < fetchPromises.length; i++) {
      const result = fetchPromises[i];
      const types = ['livros', 'artigos', 'videos', 'podcasts'];
      const typeName = types[i];
      
      if (result.status === 'fulfilled' && result.value.ok) {
        const data = await result.value.json();
        const items = data.conteudo || [];
        
        // ✅ USAR TOTAIS REAIS DA API
        actualTotals[typeName as keyof typeof actualTotals] = data.total || API_TOTALS[typeName as keyof typeof API_TOTALS];
        
        allItems.push(...items.map((item: any) => ({
          ...item,
          type: typeName === 'livros' || typeName === 'artigos' ? 'titulo' : 
                typeName === 'videos' ? 'video' : 'podcast'
        })));
        
        console.log(`✅ ${typeName}: ${items.length} itens carregados, total: ${actualTotals[typeName as keyof typeof actualTotals]}`);
      } else {
        console.warn(`⚠️ ${typeName}: Falha ao carregar`);
        // Usar totais conhecidos como fallback
        actualTotals[typeName as keyof typeof actualTotals] = API_TOTALS[typeName as keyof typeof API_TOTALS];
      }
    }

    // ✅ TOTAL REAL CALCULADO
    const realTotalResults = actualTotals.livros + actualTotals.artigos + actualTotals.videos + actualTotals.podcasts;
    
    // Ordenar todos os itens
    const sortedItems = sortAllItems(allItems, sortBy);
    
    // ✅ PAGINAÇÃO REAL baseada no total verdadeiro
    const startIndex = (page - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const paginatedItems = sortedItems.slice(startIndex, endIndex);
    
    const totalPages = Math.ceil(realTotalResults / resultsPerPage);
    
    console.log(`🌍 ${requestId} - TOTAIS REAIS: ${realTotalResults} (L:${actualTotals.livros} + A:${actualTotals.artigos} + V:${actualTotals.videos} + P:${actualTotals.podcasts})`);
    
    return {
      success: true,
      results: paginatedItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: realTotalResults, // ✅ TOTAL REAL
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      searchInfo: {
        query: '',
        appliedFilters: filters,
        sortBy
      }
    };

  } catch (error) {
    console.error(`❌ Global search failed:`, error);
    return {
      success: false,
      results: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalResults: 0,
        hasNextPage: false,
        hasPreviousPage: false
      },
      searchInfo: {
        query: '',
        appliedFilters: filters,
        sortBy
      },
      error: error.message
    };
  }
}

// ✅ CORRIGIDO: performPaginatedSearch para tratar 'titulo' como livro + artigos
async function performPaginatedSearch(
  resourceType: string,
  filters: SearchFilters,
  sortBy: string,
  page: number,
  resultsPerPage: number
): Promise<any> {
  const requestId = `paginated_${resourceType}_${Date.now()}`;
  console.log(`📄 ${requestId} - Busca Paginada: ${resourceType}`);
  
  try {
    const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';
    
    // ✅ CORREÇÃO CRÍTICA: Tratar 'titulo' como livro + artigos
    if (resourceType === 'titulo') {
      console.log(`📚 ${requestId} - Combinando livros + artigos`);
      
      // Buscar livros e artigos separadamente
      const [livrosResponse, artigosResponse] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/conteudo-lbs?tipo=livro&page=1&limit=100`),
        fetch(`${API_BASE_URL}/conteudo-lbs?tipo=artigos&page=1&limit=100`)
      ]);
      
      const allTituloItems: any[] = [];
      let totalLivros = 0;
      let totalArtigos = 0;
      
      // Processar livros
      if (livrosResponse.status === 'fulfilled' && livrosResponse.value.ok) {
        const livrosData = await livrosResponse.value.json();
        const livros = livrosData.conteudo || [];
        totalLivros = livrosData.total || API_TOTALS.livros;
        allTituloItems.push(...livros.map((item: any) => ({ ...item, type: 'titulo' })));
        console.log(`📖 Livros: ${livros.length} carregados, total: ${totalLivros}`);
      } else {
        totalLivros = API_TOTALS.livros;
        console.warn(`⚠️ Livros: Falha ao carregar, usando total conhecido: ${totalLivros}`);
      }
      
      // Processar artigos
      if (artigosResponse.status === 'fulfilled' && artigosResponse.value.ok) {
        const artigosData = await artigosResponse.value.json();
        const artigos = artigosData.conteudo || [];
        totalArtigos = artigosData.total || API_TOTALS.artigos;
        allTituloItems.push(...artigos.map((item: any) => ({ ...item, type: 'titulo' })));
        console.log(`📄 Artigos: ${artigos.length} carregados, total: ${totalArtigos}`);
      } else {
        totalArtigos = API_TOTALS.artigos;
        console.warn(`⚠️ Artigos: Falha ao carregar, usando total conhecido: ${totalArtigos}`);
      }
      
      // ✅ TOTAL COMBINADO: livros + artigos
      const totalTituloResults = totalLivros + totalArtigos;
      
      // Ordenar items combinados
      const sortedItems = sortAllItems(allTituloItems, sortBy);
      
      // Paginação sobre o conjunto combinado
      const startIndex = (page - 1) * resultsPerPage;
      const endIndex = startIndex + resultsPerPage;
      const paginatedItems = sortedItems.slice(startIndex, endIndex);
      
      const totalPages = Math.ceil(totalTituloResults / resultsPerPage);
      
      console.log(`📚 ${requestId} - TÍTULOS COMBINADOS: ${totalTituloResults} (${totalLivros} livros + ${totalArtigos} artigos)`);
      
      return {
        success: true,
        results: paginatedItems,
        pagination: {
          currentPage: page,
          totalPages,
          totalResults: totalTituloResults, // ✅ TOTAL COMBINADO
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        searchInfo: {
          query: '',
          appliedFilters: filters,
          sortBy
        }
      };
    }
    
    // ✅ Para outros tipos (video, podcast): busca normal
    const typeMapping = {
      'video': 'aula',
      'podcast': 'podcast'
    };
    
    const apiType = typeMapping[resourceType as keyof typeof typeMapping] || resourceType;
    const url = `${API_BASE_URL}/conteudo-lbs?tipo=${apiType}&page=${page}&limit=${resultsPerPage}`;
    
    console.log(`🔍 ${requestId} - API URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} para tipo ${resourceType}`);
    }
    
    const data = await response.json();
    const items = data.conteudo || [];
    const totalResults = data.total || 0;
    const totalPages = data.totalPages || Math.ceil(totalResults / resultsPerPage);
    
    // Mapear tipo para o padrão da aplicação
    const mappedItems = items.map((item: any) => ({
      ...item,
      type: resourceType
    }));
    
    console.log(`✅ ${requestId} - Tipo ${resourceType}: ${items.length} itens, total: ${totalResults}`);
    
    return {
      success: true,
      results: mappedItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      searchInfo: {
        query: '',
        appliedFilters: filters,
        sortBy
      }
    };
    
  } catch (error) {
    console.error(`❌ Paginated search failed for ${resourceType}:`, error);
    return {
      success: false,
      results: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalResults: 0,
        hasNextPage: false,
        hasPreviousPage: false
      },
      searchInfo: {
        query: '',
        appliedFilters: filters,
        sortBy
      },
      error: error.message
    };
  }
}

// ✅ NOVA FUNÇÃO: Ordena todos os itens combinados
function sortAllItems(items: any[], sortBy: string): any[] {
  if (sortBy === 'recent') {
    return items.sort((a, b) => (b.year || 0) - (a.year || 0));
  } else if (sortBy === 'title') {
    return items.sort((a, b) => a.title.localeCompare(b.title));
  }
  // Mantém a ordem padrão se sortBy for 'relevance' ou desconhecido
  return items;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody: SearchRequest = await req.json();
    const { query, filters, sortBy, page, resultsPerPage } = requestBody;
    
    const requestId = `search_${Date.now()}`;
    console.group(`🔍 ${requestId} - NOVA ARQUITETURA COM CORREÇÕES`);
    console.log('📋 Request:', { query, filters, sortBy, page, resultsPerPage });
    
    // Detectar tipo de busca com lógica refinada
    const searchType = detectSearchType(query, filters);
    console.log(`🎯 Tipo de busca detectado: ${searchType}`);
    
    let searchResponse;
    
    switch (searchType) {
      case 'queryBased':
        searchResponse = await performQueryBasedSearch(query, page, resultsPerPage);
        break;
        
      case 'global':
        searchResponse = await performGlobalSearch(filters, sortBy, page, resultsPerPage);
        break;
        
      case 'paginated':
        const resourceType = filters.resourceType[0];
        searchResponse = await performPaginatedSearch(resourceType, filters, sortBy, page, resultsPerPage);
        break;
        
      default:
        throw new Error(`Tipo de busca não reconhecido: ${searchType}`);
    }
    
    console.log(`✅ ${requestId} - Resposta:`, {
      results: searchResponse.results?.length || 0,
      totalResults: searchResponse.pagination?.totalResults || 0,
      currentPage: searchResponse.pagination?.currentPage || 0,
      totalPages: searchResponse.pagination?.totalPages || 0
    });
    
    console.groupEnd();
    
    return new Response(JSON.stringify(searchResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('❌ Search function error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      results: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalResults: 0,
        hasNextPage: false,
        hasPreviousPage: false
      },
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
