import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

interface SearchResult {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link: string;
  type: string;
  year?: number;
  author?: string;
  duration?: string;
  language?: string;
  documentType?: string;
  program?: string;
  channel?: string;
  subject?: string[];
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface SearchInfo {
  query: string;
  appliedFilters: SearchFilters;
  sortBy: string;
}

interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  pagination: Pagination;
  searchInfo: SearchInfo;
  error?: string;
}

interface ApiResult {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link: string;
  year?: number;
  author?: string;
  duration?: string;
  language?: string;
  documentType?: string;
  program?: string;
  channel?: string;
  subject?: string[];
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') as string

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false
  }
})

const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1'

async function fetchApiData(type: string, page: number = 1, limit: number = 9): Promise<ApiResult[]> {
  const url = `${API_BASE_URL}/conteudo-lbs/${type}?page=${page}&limit=${limit}`
  console.log(`Fetching data from: ${url}`)
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'LSB-Content-Search/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.conteudo || [];
}

function transformPodcastData(item: ApiResult): SearchResult {
  return {
    id: item.id,
    type: 'podcast',
    title: item.title,
    description: item.description,
    image_url: item.image_url,
    link: item.link,
    subject: item.subject
  };
}

function transformVideoData(item: ApiResult): SearchResult {
  return {
    id: item.id,
    type: 'video',
    title: item.title,
    description: item.description,
    image_url: item.image_url,
    link: item.link,
    duration: item.duration,
    subject: item.subject
  };
}

function transformBookData(item: ApiResult): SearchResult {
  return {
    id: item.id,
    type: 'titulo',
    title: item.title,
    description: item.description,
    image_url: item.image_url,
    link: item.link,
    author: item.author,
    year: item.year,
    subject: item.subject
  };
}

function transformArticleData(item: ApiResult): SearchResult {
    return {
        id: item.id,
        type: 'artigos',
        title: item.title,
        description: item.description,
        image_url: item.image_url,
        link: item.link,
        author: item.author,
        year: item.year,
        subject: item.subject
    };
}

function matchesQuery(item: SearchResult, query: string): boolean {
  const lowerCaseQuery = query.toLowerCase();
  return (
    item.title.toLowerCase().includes(lowerCaseQuery) ||
    item.description.toLowerCase().includes(lowerCaseQuery) ||
    (item.author && item.author.toLowerCase().includes(lowerCaseQuery)) ||
    (item.subject && item.subject.some(s => s.toLowerCase().includes(lowerCaseQuery)))
  );
}

async function performFilteredSearch(
  query: string,
  filters: SearchFilters,
  sortBy: string,
  page: number,
  resultsPerPage: number
): Promise<SearchResponse> {
  const requestId = `filtered_search_${Date.now()}`;
  console.group(`🎯 ${requestId} - Busca Filtrada`);

  try {
    console.log(`📋 ${requestId} - Parameters:`, { query, filters, sortBy, page, resultsPerPage });

    // Step 1: Determine the content type based on filters
    const resourceTypes = filters.resourceType || [];
    let apiType = '';

    if (resourceTypes.length === 1) {
      const resourceType = resourceTypes[0];
      switch (resourceType) {
        case 'titulo':
          apiType = 'livro';
          break;
        case 'video':
          apiType = 'aula';
          break;
        case 'podcast':
          apiType = 'podcast';
          break;
        default:
          throw new Error(`Unsupported resource type: ${resourceType}`);
      }
    } else {
      throw new Error("Multiple resource types are not supported in filtered search.");
    }

    // Step 2: Fetch data from the API
    console.log(`📡 ${requestId} - Fetching data for type: ${apiType}, page: ${page}, limit: ${resultsPerPage}`);
    const apiResults = await fetchApiData(apiType, page, resultsPerPage);

    // Step 3: Transform the data
    let transformedResults: SearchResult[] = [];
    switch (apiType) {
      case 'podcast':
        transformedResults = apiResults.map(transformPodcastData);
        break;
      case 'aula':
        transformedResults = apiResults.map(transformVideoData);
        break;
      case 'livro':
        transformedResults = apiResults.map(transformBookData);
        break;
    }

    // Step 4: Apply query filter
    if (query) {
      transformedResults = transformedResults.filter(item => matchesQuery(item, query));
    }

    // Step 5: Apply additional filters (subject, author, etc.)
    // This part is simplified; you may need to adjust based on your data structure
    if (filters.subject && filters.subject.length > 0) {
      transformedResults = transformedResults.filter(item =>
        item.subject && item.subject.some(s => filters.subject.includes(s))
      );
    }

    // Step 6: Sort the results
    if (sortBy === 'recent') {
      transformedResults.sort((a, b) => (b.year || 0) - (a.year || 0));
    }

    // Step 7: Calculate pagination
    const totalResults = transformedResults.length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    console.log(`📊 ${requestId} - Pagination:`, { totalResults, totalPages, currentPage: page });

    // Step 8: Prepare the response
    const response: SearchResponse = {
      success: true,
      results: transformedResults,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults,
        hasNextPage,
        hasPreviousPage
      },
      searchInfo: {
        query: query || '',
        appliedFilters: filters,
        sortBy: sortBy
      }
    };

    console.log(`✅ ${requestId} - Filtered search completed:`, {
      results: response.results.length,
      totalResults: response.pagination.totalResults
    });
    console.groupEnd();
    return response;

  } catch (error) {
    console.error(`❌ ${requestId} - Error in filtered search:`, error);
    console.groupEnd();
    throw error;
  }
}

async function performGlobalSearch(
  query: string,
  page: number,
  resultsPerPage: number = 9
): Promise<SearchResponse> {
  const requestId = `global_search_${Date.now()}`;
  console.group(`🌍 ${requestId} - Busca Global CORRIGIDA (Página ${page})`);
  
  try {
    // ✅ CORREÇÃO: Calcular quantos dados realmente precisamos buscar baseado na página
    const calculateRequiredDataForPage = (currentPage: number, itemsPerPage: number) => {
      // Para páginas iniciais, buscar dados suficientes para cobrir várias páginas
      if (currentPage <= 10) {
        return Math.max(200, currentPage * itemsPerPage * 2); // Buffer generoso para páginas iniciais
      }
      
      // Para páginas intermediárias, buscar baseado na página atual
      if (currentPage <= 50) {
        return Math.max(500, currentPage * itemsPerPage * 1.5);
      }
      
      // Para páginas finais, buscar todos os dados disponíveis
      return Math.max(1000, currentPage * itemsPerPage * 2);
    };

    const requiredTotalItems = calculateRequiredDataForPage(page, resultsPerPage);
    
    // ✅ CORREÇÃO: Distribuir proporcionalmente baseado nos totais reais conhecidos
    const REAL_TOTALS = {
      podcasts: 633,
      videos: 276, 
      books: 71,
      articles: 79
    };
    
    const totalKnownItems = REAL_TOTALS.podcasts + REAL_TOTALS.videos + REAL_TOTALS.books + REAL_TOTALS.articles; // 1059
    
    // Calcular proporções reais
    const podcastRatio = REAL_TOTALS.podcasts / totalKnownItems; // ~0.598
    const videoRatio = REAL_TOTALS.videos / totalKnownItems; // ~0.261
    const bookRatio = REAL_TOTALS.books / totalKnownItems; // ~0.067
    const articleRatio = REAL_TOTALS.articles / totalKnownItems; // ~0.075
    
    // ✅ CORREÇÃO: Calcular limites proporcionais baseados na necessidade real
    const podcastLimit = Math.min(REAL_TOTALS.podcasts, Math.ceil(requiredTotalItems * podcastRatio));
    const videoLimit = Math.min(REAL_TOTALS.videos, Math.ceil(requiredTotalItems * videoRatio));
    const bookLimit = Math.min(REAL_TOTALS.books, Math.ceil(requiredTotalItems * bookRatio));
    const articleLimit = Math.min(REAL_TOTALS.articles, Math.ceil(requiredTotalItems * articleRatio));
    
    console.log(`📊 ${requestId} - Busca inteligente para página ${page}:`, {
      requiredTotalItems,
      limites: {
        podcasts: podcastLimit,
        videos: videoLimit,
        books: bookLimit,
        articles: articleLimit
      },
      proporcoes: {
        podcasts: `${(podcastRatio * 100).toFixed(1)}%`,
        videos: `${(videoRatio * 100).toFixed(1)}%`,
        books: `${(bookRatio * 100).toFixed(1)}%`,
        articles: `${(articleRatio * 100).toFixed(1)}%`
      }
    });

    // Buscar dados com os novos limites calculados
    const [podcastsResult, videosResult, booksResult, articlesResult] = await Promise.allSettled([
      fetchApiData('podcast', 1, podcastLimit),
      fetchApiData('aula', 1, videoLimit), 
      fetchApiData('livro', 1, bookLimit),
      fetchApiData('artigos', 1, articleLimit)
    ]);

    // Processar resultados
    const allItems: SearchResult[] = [];
    
    if (podcastsResult.status === 'fulfilled' && podcastsResult.value.length > 0) {
      const podcastData = podcastsResult.value.map(transformPodcastData);
      allItems.push(...podcastData);
      console.log(`🎧 ${requestId} - Podcasts: ${podcastData.length} itens carregados`);
    }
    
    if (videosResult.status === 'fulfilled' && videosResult.value.length > 0) {
      const videoData = videosResult.value.map(transformVideoData);
      allItems.push(...videoData);
      console.log(`🎬 ${requestId} - Vídeos: ${videoData.length} itens carregados`);
    }
    
    if (booksResult.status === 'fulfilled' && booksResult.value.length > 0) {
      const bookData = booksResult.value.map(transformBookData);
      allItems.push(...bookData);
      console.log(`📚 ${requestId} - Livros: ${bookData.length} itens carregados`);
    }
    
    if (articlesResult.status === 'fulfilled' && articlesResult.value.length > 0) {
      const articleData = articlesResult.value.map(transformArticleData);
      allItems.push(...articleData);
      console.log(`📄 ${requestId} - Artigos: ${articleData.length} itens carregados`);
    }

    // ✅ CORREÇÃO: Aplicar paginação correta nos dados combinados
    const startIndex = (page - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    
    // Intercalar tipos para diversidade nos resultados
    const interlacedItems = interlaceContentTypes(allItems);
    
    // Aplicar filtro de query se presente
    let filteredItems = interlacedItems;
    if (query && query.trim()) {
      filteredItems = interlacedItems.filter(item => 
        matchesQuery(item, query.trim())
      );
    }
    
    // ✅ CORREÇÃO: Paginação real baseada em todos os dados filtrados
    const paginatedResults = filteredItems.slice(startIndex, endIndex);
    const totalResults = filteredItems.length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    
    console.log(`📋 ${requestId} - Paginação CORRIGIDA:`, {
      allItemsLoaded: allItems.length,
      filteredTotal: totalResults,
      paginatedResults: paginatedResults.length,
      page,
      totalPages,
      startIndex,
      endIndex,
      hasCorrectData: paginatedResults.length > 0 || page > totalPages
    });
    
    // ✅ VALIDAÇÃO: Verificar se os dados estão corretos
    if (page <= totalPages && paginatedResults.length === 0) {
      console.warn(`⚠️ ${requestId} - PROBLEMA: Página ${page} deveria ter dados mas está vazia`);
    }

    const response: SearchResponse = {
      success: true,
      results: paginatedResults,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      searchInfo: {
        query: query || '',
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
      }
    };

    console.log(`✅ ${requestId} - Busca global CORRIGIDA finalizada:`, {
      results: response.results.length,
      totalResults: response.pagination.totalResults,
      currentPage: response.pagination.currentPage,
      totalPages: response.pagination.totalPages,
      correcaoAplicada: '🎯 SIM'
    });
    
    console.groupEnd();
    return response;

  } catch (error) {
    console.error(`❌ ${requestId} - Erro na busca global:`, error);
    console.groupEnd();
    throw error;
  }
}

// ✅ NOVA FUNÇÃO: Intercalar tipos de conteúdo para diversidade
function interlaceContentTypes(items: SearchResult[]): SearchResult[] {
  const podcasts = items.filter(item => item.type === 'podcast');
  const videos = items.filter(item => item.type === 'video');
  const books = items.filter(item => item.type === 'titulo');
  
  const interlaced: SearchResult[] = [];
  const maxLength = Math.max(podcasts.length, videos.length, books.length);
  
  for (let i = 0; i < maxLength; i++) {
    if (podcasts[i]) interlaced.push(podcasts[i]);
    if (videos[i]) interlaced.push(videos[i]);
    if (books[i]) interlaced.push(books[i]);
  }
  
  return interlaced;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, filters, sortBy, page, resultsPerPage } = await req.json();
    
    console.log('🔍 Search request received:', { 
      query, 
      filters, 
      sortBy, 
      page, 
      resultsPerPage,
      timestamp: new Date().toISOString()
    });

    let response: SearchResponse;

    // ✅ CORREÇÃO: Detectar busca global (filtro "Todos")
    const isGlobalSearch = !filters?.resourceType || 
                          filters.resourceType.length === 0 || 
                          (Array.isArray(filters.resourceType) && filters.resourceType.includes('all'));

    if (isGlobalSearch) {
      console.log('🌍 Executando busca global CORRIGIDA...');
      response = await performGlobalSearch(query || '', page || 1, resultsPerPage || 9);
    } else {
      console.log('🎯 Executando busca filtrada...');
      response = await performFilteredSearch(query || '', filters, sortBy || 'relevance', page || 1, resultsPerPage || 9);
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    
    const errorResponse: SearchResponse = {
      success: false,
      results: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
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
      error: error instanceof Error ? error.message : 'Search failed'
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
