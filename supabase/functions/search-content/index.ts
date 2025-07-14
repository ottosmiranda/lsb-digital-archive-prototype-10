
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchResult {
  id: string;
  title: string;
  author: string;
  year: number;
  description: string;
  subject: string;
  type: string;
  thumbnail?: string;
  duration?: string;
  pages?: number;
  documentType?: string;
  program?: string;
  channel?: string;
  language?: string;
}

interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  searchInfo: {
    query: string;
    appliedFilters: any;
    sortBy: string;
  };
  error?: string;
}

// Cache em memória simplificado
const resultCache = new Map<string, { data: SearchResponse; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutos

// Totais conhecidos
const CONTENT_TOTALS = {
  books: 71,
  videos: 276, 
  podcasts: 633,
  articles: 79
};

const COMBINED_TOTAL = CONTENT_TOTALS.books + CONTENT_TOTALS.videos + CONTENT_TOTALS.podcasts + CONTENT_TOTALS.articles;

serve(async (req) => {
  const requestId = `search_${Date.now()}`;
  console.log(`🚀 ${requestId} - SEARCH GET SIMPLIFICADO`);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ✅ MIGRAÇÃO PARA GET: Extrair parâmetros da URL
  if (req.method !== 'GET') {
    console.warn(`❌ ${requestId} - Método ${req.method} não suportado`);
    return new Response(JSON.stringify({
      success: false,
      error: 'Método não suportado. Use GET.'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    
    // Extrair parâmetros com valores padrão
    const query = params.get('q') || '';
    const page = parseInt(params.get('page') || '1', 10);
    const resultsPerPage = parseInt(params.get('limit') || '9', 10);
    const sortBy = params.get('sort') || 'relevance';
    
    // Filtros simplificados
    const resourceTypes = params.getAll('type') || [];
    
    console.log(`📋 ${requestId} - GET Params:`, { 
      query: query || '(empty)', 
      page, 
      resultsPerPage,
      sortBy,
      resourceTypes 
    });

    // Cache key baseado em parâmetros GET
    const cacheKey = `${query}_${page}_${resultsPerPage}_${sortBy}_${resourceTypes.join(',')}`;
    
    // Verificar cache válido
    const cached = resultCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`📦 ${requestId} - Cache HIT (${cached.data.results.length} resultados)`);
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔍 ${requestId} - Cache MISS - Executando busca GET`);

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ✅ LÓGICA SIMPLIFICADA: Distribuição fixa por página
    const getSimpleDistribution = (currentPage: number) => {
      // Padrão simples: 2 livros, 3 vídeos, 3 podcasts, 1 artigo = 9 total
      const booksPerPage = 2;
      const videosPerPage = 3;
      const podcastsPerPage = 3;
      const articlesPerPage = 1;
      
      // Offset linear simples
      const baseOffset = (currentPage - 1);
      
      return {
        books: { limit: booksPerPage, offset: baseOffset * booksPerPage },
        videos: { limit: videosPerPage, offset: baseOffset * videosPerPage },
        podcasts: { limit: podcastsPerPage, offset: baseOffset * podcastsPerPage },
        articles: { limit: articlesPerPage, offset: baseOffset * articlesPerPage }
      };
    };

    const distribution = getSimpleDistribution(page);
    console.log(`📊 ${requestId} - Distribuição simplificada página ${page}:`, distribution);

    // ✅ BUSCA SIMPLIFICADA COM TIMEOUT INDIVIDUAL DE 8S
    const fetchWithSimpleTimeout = async (
      functionName: string, 
      params: any, 
      label: string
    ): Promise<SearchResult[]> => {
      try {
        console.log(`📡 ${requestId} - Buscando ${label}...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const { data, error } = await supabase.functions.invoke(functionName, { 
          body: params,
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.warn(`⚠️ ${requestId} - Erro ${label}:`, error.message);
          return [];
        }
        
        if (!data || !data.success) {
          console.warn(`⚠️ ${requestId} - ${label} não retornou dados válidos`);
          return [];
        }
        
        const items = data[functionName.replace('fetch-', '')] || [];
        console.log(`✅ ${requestId} - ${label}: ${items.length} itens`);
        return items;
        
      } catch (error) {
        console.warn(`⚠️ ${requestId} - Falha ${label}:`, error.message);
        return [];
      }
    };

    // ✅ BUSCA PARALELA SIMPLIFICADA
    console.log(`🌐 ${requestId} - Iniciando busca paralela simplificada...`);
    
    const startTime = Date.now();
    
    const [booksResult, videosResult, podcastsResult, articlesResult] = await Promise.allSettled([
      fetchWithSimpleTimeout('fetch-books', distribution.books, 'Livros'),
      fetchWithSimpleTimeout('fetch-videos', distribution.videos, 'Vídeos'), 
      fetchWithSimpleTimeout('fetch-podcasts', distribution.podcasts, 'Podcasts'),
      fetchWithSimpleTimeout('fetch-articles', distribution.articles, 'Artigos')
    ]);

    const elapsedTime = Date.now() - startTime;
    console.log(`⏱️ ${requestId} - Busca concluída em ${elapsedTime}ms`);

    // Extrair resultados
    const books = booksResult.status === 'fulfilled' ? booksResult.value : [];
    const videos = videosResult.status === 'fulfilled' ? videosResult.value : [];
    const podcasts = podcastsResult.status === 'fulfilled' ? podcastsResult.value : [];
    const articles = articlesResult.status === 'fulfilled' ? articlesResult.value : [];

    // Combinar resultados
    const allResults: SearchResult[] = [...books, ...videos, ...podcasts, ...articles];
    
    console.log(`📊 ${requestId} - Resultados obtidos:`, {
      books: books.length,
      videos: videos.length, 
      podcasts: podcasts.length,
      articles: articles.length,
      total: allResults.length
    });

    // ✅ FILTROS SIMPLIFICADOS
    let filteredResults = allResults;
    
    // Filtro por tipo se especificado
    if (resourceTypes.length > 0) {
      console.log(`🔍 ${requestId} - Aplicando filtro de tipo:`, resourceTypes);
      filteredResults = allResults.filter(item => {
        return resourceTypes.includes(item.type);
      });
    }

    // Filtro por query se especificado
    if (query && query.trim()) {
      console.log(`🔍 ${requestId} - Aplicando busca por texto: "${query}"`);
      const searchTerm = query.toLowerCase();
      filteredResults = filteredResults.filter(item =>
        item.title.toLowerCase().includes(searchTerm) ||
        item.author.toLowerCase().includes(searchTerm) ||
        (item.description && item.description.toLowerCase().includes(searchTerm)) ||
        (item.subject && item.subject.toLowerCase().includes(searchTerm))
      );
    }

    // ✅ ORDENAÇÃO SIMPLIFICADA
    if (sortBy === 'title') {
      filteredResults.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'recent') {
      filteredResults.sort((a, b) => (b.year || 0) - (a.year || 0));
    }

    // ✅ PAGINAÇÃO BASEADA NOS TOTAIS REAIS
    const totalResults = query.trim() || resourceTypes.length > 0 ? 
      filteredResults.length : COMBINED_TOTAL;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    
    console.log(`📄 ${requestId} - Paginação:`, {
      currentPage: page,
      totalResults,
      totalPages,
      resultsInPage: filteredResults.length
    });

    // ✅ RESPOSTA SEMPRE VÁLIDA
    const response: SearchResponse = {
      success: true,
      results: filteredResults,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      searchInfo: {
        query,
        appliedFilters: {
          resourceType: resourceTypes,
          subject: [],
          author: [],
          year: '',
          duration: '',
          language: [],
          documentType: [],
          program: [],
          channel: []
        },
        sortBy
      }
    };

    // Cachear resultado
    resultCache.set(cacheKey, { data: response, timestamp: Date.now() });
    
    // Limpar cache antigo
    if (resultCache.size > 50) {
      const oldestKey = Array.from(resultCache.keys())[0];
      resultCache.delete(oldestKey);
    }

    console.log(`✅ ${requestId} - GET Response:`, {
      success: response.success,
      resultsCount: response.results.length,
      totalResults: response.pagination.totalResults,
      elapsedTime: `${elapsedTime}ms`,
      method: 'GET'
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`❌ ${requestId} - Erro crítico GET:`, error);
    
    // ✅ FALLBACK FINAL SEMPRE VÁLIDO
    const fallbackResponse: SearchResponse = {
      success: true,
      results: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalResults: 0,
        hasNextPage: false,
        hasPreviousPage: false
      },
      searchInfo: {
        query: '',
        appliedFilters: {
          resourceType: [],
          subject: [],
          author: [],
          year: '',
          duration: '',
          language: [],
          documentType: [],
          program: [],
          channel: []
        },
        sortBy: 'relevance'
      },
      error: 'Erro temporário na busca. Tente novamente.'
    };

    console.log(`🆘 ${requestId} - Retornando fallback GET`);
    
    return new Response(JSON.stringify(fallbackResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
