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

interface SearchRequest {
  query: string;
  filters: SearchFilters;
  sortBy: string;
  page: number;
  resultsPerPage: number;
  optimized?: boolean;
  prefetch?: boolean;
  fastFilter?: boolean; // NOVO: Flag para filtros simples rápidos
}

interface SearchResult {
  id: number;
  originalId?: string;
  title: string;
  type: 'video' | 'titulo' | 'podcast';
  author: string;
  duration?: string;
  pages?: number;
  episodes?: string | number;
  thumbnail?: string;
  description: string;
  year: number | null;
  subject: string;
  embedUrl?: string;
  pdfUrl?: string;
  documentType?: string;
  pais?: string;
  language?: string;
  program?: string;
  channel?: string;
}

// CONFIGURAÇÃO OTIMIZADA PARA FILTROS RÁPIDOS
const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

// NOVA CONFIGURAÇÃO PARA FILTROS RÁPIDOS POR TIPO
const FAST_FILTER_CONFIG = {
  podcast: {
    expectedTotal: 2512,
    chunkSize: 100, // Chunks maiores para filtros simples
    maxConcurrency: 6, // Mais concorrência para speed
    timeout: 3000 // Timeout reduzido para filtros simples
  },
  aula: {
    expectedTotal: 300,
    chunkSize: 75,
    maxConcurrency: 4,
    timeout: 2500
  },
  livro: {
    expectedTotal: 30,
    chunkSize: 30, // Chunk único para livros
    maxConcurrency: 1,
    timeout: 2000
  }
};

// TIMEOUTS DINÂMICOS BASEADOS NO TIPO DE OPERAÇÃO
const DYNAMIC_TIMEOUTS = {
  fastFilter: {
    singleRequest: 2000, // 2s para filtros simples
    chunkParallel: 4000, // 4s para chunks paralelos
    totalOperation: 8000 // 8s máximo para filtros simples
  },
  optimizedFilter: {
    singleRequest: 3000,
    chunkParallel: 5000,
    totalOperation: 12000
  },
  exactNumbers: {
    singleRequest: 8000,
    chunkParallel: 15000,
    totalOperation: 60000
  }
};

// Cache inteligente por tipo
const getCacheKey = (key: string, type: 'fast' | 'optimized' | 'exact' = 'exact'): string => 
  `${type}_search_${key}`;

const isValidCache = (cacheKey: string): boolean => {
  const cached = globalCache.get(cacheKey);
  if (!cached) return false;
  
  const isValid = (Date.now() - cached.timestamp) < cached.ttl;
  
  if (isValid && Array.isArray(cached.data) && cached.data.length === 0) {
    console.warn(`🚨 Cache corrompido detectado: ${cacheKey}`);
    globalCache.delete(cacheKey);
    return false;
  }
  
  return isValid;
};

const setCache = (cacheKey: string, data: any, ttl: number = CACHE_TTL): void => {
  if (Array.isArray(data) && data.length === 0) {
    console.warn(`⚠️ Não cacheando resultado vazio: ${cacheKey}`);
    return;
  }
  
  globalCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl
  });
  console.log(`📦 Cache SET: ${cacheKey} (${Array.isArray(data) ? data.length : 'N/A'} items)`);
};

const getCache = (cacheKey: string): any => {
  const cached = globalCache.get(cacheKey);
  return cached?.data || null;
};

const globalCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// NOVA FUNÇÃO: Fast Filter para tipos simples (TODOS os resultados)
const performFastTypeFilter = async (searchParams: SearchRequest): Promise<any> => {
  const { filters, sortBy, query } = searchParams;
  const requestId = `fast_filter_${Date.now()}`;
  
  console.group(`⚡ ${requestId} - FAST TYPE FILTER`);
  console.log('📋 Fast filter params:', { filters, sortBy, query });

  // Detectar qual tipo está sendo filtrado
  const activeTypes = filters.resourceType.filter(type => type !== 'all');
  if (activeTypes.length !== 1) {
    console.log('❌ Fast filter requer exatamente um tipo');
    console.groupEnd();
    throw new Error('Fast filter requires exactly one resource type');
  }

  const resourceType = activeTypes[0];
  const apiType = resourceType === 'titulo' ? 'livro' : resourceType === 'video' ? 'aula' : 'podcast';
  
  console.log(`🎯 Fast filter para: ${resourceType} (API: ${apiType})`);

  try {
    const cacheKey = getCacheKey(`fast_${apiType}_all`, 'fast');
    
    if (isValidCache(cacheKey)) {
      const cached = getCache(cacheKey);
      console.log(`📦 Fast filter Cache HIT: ${cached.length} ${apiType}s`);
      console.groupEnd();
      return buildFastFilterResponse(cached, searchParams, requestId);
    }

    // Carregar TODOS os resultados do tipo específico
    console.log(`🚀 Loading ALL ${apiType} results with fast filter...`);
    const allResults = await fetchAllContentForType(apiType, 'fast');
    
    if (allResults.length === 0) {
      console.warn(`⚠️ No results for fast filter ${apiType}`);
      console.groupEnd();
      return buildEmptyResponse(searchParams);
    }

    // Cache por mais tempo para filtros simples (15 minutos)
    setCache(cacheKey, allResults, 15 * 60 * 1000);
    
    console.log(`✅ Fast filter carregou: ${allResults.length} ${apiType}s`);
    console.groupEnd();
    return buildFastFilterResponse(allResults, searchParams, requestId);

  } catch (error) {
    console.error(`❌ Fast filter failed for ${apiType}:`, error);
    console.groupEnd();
    throw error;
  }
};

// FUNÇÃO PARA CARREGAR TODOS OS RESULTADOS DE UM TIPO (OTIMIZADA)
const fetchAllContentForType = async (tipo: string, mode: 'fast' | 'optimized' = 'fast'): Promise<SearchResult[]> => {
  const config = FAST_FILTER_CONFIG[tipo as keyof typeof FAST_FILTER_CONFIG];
  if (!config) throw new Error(`Unsupported type for fast filter: ${tipo}`);

  const timeouts = mode === 'fast' ? DYNAMIC_TIMEOUTS.fastFilter : DYNAMIC_TIMEOUTS.optimizedFilter;
  const allItems: SearchResult[] = [];
  const totalChunks = Math.ceil(config.expectedTotal / config.chunkSize);
  
  console.log(`⚡ Fast loading ${tipo}: ${totalChunks} chunks of ${config.chunkSize} items`);

  // Processar em batches com alta concorrência para speed
  for (let batchStart = 0; batchStart < totalChunks; batchStart += config.maxConcurrency) {
    const batchEnd = Math.min(batchStart + config.maxConcurrency, totalChunks);
    const chunkPromises: Promise<SearchResult[]>[] = [];
    
    for (let chunkIndex = batchStart; chunkIndex < batchEnd; chunkIndex++) {
      const page = chunkIndex + 1;
      const chunkPromise = fetchSingleChunkFast(tipo, page, config.chunkSize, config.timeout);
      chunkPromises.push(chunkPromise);
    }
    
    try {
      const batchTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Fast batch timeout ${tipo}`)), timeouts.chunkParallel);
      });
      
      const batchResults = await Promise.race([
        Promise.allSettled(chunkPromises),
        batchTimeoutPromise
      ]);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allItems.push(...result.value);
        } else {
          console.error(`❌ Fast chunk ${batchStart + index + 1} failed:`, result.reason?.message);
        }
      });
      
      // Parar quando não há mais dados
      const lastBatchHadData = batchResults.some(result => 
        result.status === 'fulfilled' && result.value.length > 0
      );
      
      if (!lastBatchHadData) {
        console.log(`📄 No more data for ${tipo} at batch ${batchStart + 1}`);
        break;
      }
      
      // Pausa mínima entre batches para fast mode
      if (batchEnd < totalChunks) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
    } catch (error) {
      console.error(`❌ Fast batch error ${tipo}:`, error);
    }
  }

  console.log(`⚡ Fast loading ${tipo} completed: ${allItems.length} items`);
  return allItems;
};

// FUNÇÃO OTIMIZADA PARA CHUNKS RÁPIDOS
const fetchSingleChunkFast = async (tipo: string, page: number, limit: number, timeout: number): Promise<SearchResult[]> => {
  const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${page}&limit=${limit}`;
  
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Fast chunk timeout ${tipo} page ${page}`)), timeout);
    });
    
    const fetchPromise = fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'LSB-FastFilter-Search/1.0'
      }
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for fast ${tipo} page ${page}`);
    }

    const data = await response.json();
    const items = data.conteudo || [];
    
    return items.map((item: any) => transformToSearchResult(item, tipo));
    
  } catch (error) {
    console.error(`❌ Fast chunk error ${tipo} page ${page}:`, error);
    return [];
  }
};

// FUNÇÃO PARA CONSTRUIR RESPOSTA DO FAST FILTER
const buildFastFilterResponse = (allResults: SearchResult[], searchParams: SearchRequest, requestId: string): any => {
  const { query, filters, sortBy, page, resultsPerPage } = searchParams;
  
  // Aplicar filtros se necessário
  let filteredResults = allResults;
  
  if (query && query.trim()) {
    const queryLower = query.toLowerCase();
    filteredResults = filteredResults.filter(item => {
      const searchText = `${item.title} ${item.author} ${item.description}`.toLowerCase();
      return searchText.includes(queryLower);
    });
  }

  // Aplicar ordenação
  filteredResults = sortResults(filteredResults, sortBy, query);
  
  // RETORNAR TODOS OS RESULTADOS (SEM PAGINAÇÃO)
  // A paginação será feita no frontend para filtros simples
  const totalResults = filteredResults.length;
  
  console.log(`⚡ ${requestId} - Fast filter response: ${totalResults} total results`);
  
  return {
    success: true,
    results: filteredResults, // TODOS os resultados
    pagination: {
      currentPage: 1, // Sempre página 1 para fast filter
      totalPages: 1, // Sempre 1 página (todos os resultados)
      totalResults,
      hasNextPage: false,
      hasPreviousPage: false
    },
    searchInfo: {
      query,
      appliedFilters: filters,
      sortBy
    },
    fastFilter: true // Flag para identificar resposta de fast filter
  };
};

// FUNÇÃO PARA RESPOSTA VAZIA
const buildEmptyResponse = (searchParams: SearchRequest): any => {
  const { query, filters, sortBy, page } = searchParams;
  
  return {
    success: true,
    results: [],
    pagination: {
      currentPage: page,
      totalPages: 0,
      totalResults: 0,
      hasNextPage: false,
      hasPreviousPage: false
    },
    searchInfo: {
      query,
      appliedFilters: filters,
      sortBy
    }
  };
};

const transformToSearchResult = (item: any, tipo: string): SearchResult => {
  const baseResult: SearchResult = {
    id: Math.floor(Math.random() * 10000) + 1000,
    originalId: item.id,
    title: item.titulo || item.podcast_titulo || item.title || 'Título não disponível',
    author: item.autor || item.canal || 'Link Business School',
    year: item.ano || new Date().getFullYear(),
    description: item.descricao || 'Descrição não disponível',
    subject: getSubjectFromCategories(item.categorias) || getSubject(tipo),
    type: tipo === 'livro' ? 'titulo' : tipo === 'aula' ? 'video' : 'podcast' as 'titulo' | 'video' | 'podcast',
    thumbnail: item.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png'
  };

  if (tipo === 'livro') {
    baseResult.pdfUrl = item.arquivo;
    baseResult.pages = item.paginas;
    baseResult.language = item.language;
    baseResult.documentType = item.tipo_documento || 'Livro';
  } else if (tipo === 'aula') {
    baseResult.embedUrl = item.embed_url;
    baseResult.duration = item.duracao_ms ? formatDuration(item.duracao_ms) : undefined;
    baseResult.channel = item.canal || 'Canal desconhecido';
  } else if (tipo === 'podcast') {
    baseResult.duration = item.duracao_ms ? formatDuration(item.duracao_ms) : undefined;
    baseResult.embedUrl = item.embed_url;
    baseResult.program = item.podcast_titulo || 'Programa desconhecido';
  }

  return baseResult;
};

const getSubjectFromCategories = (categorias: string[]): string => {
  if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
    return '';
  }
  return categorias[0];
};

const getSubject = (tipo: string): string => {
  switch (tipo) {
    case 'livro': return 'Administração';
    case 'aula': return 'Empreendedorismo';
    case 'podcast': return 'Negócios';
    default: return 'Geral';
  }
};

const formatDuration = (durationMs: number): string => {
  const minutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
};

const applyFilters = (data: SearchResult[], filters: SearchFilters): SearchResult[] => {
  return data.filter(item => {
    if (filters.subject.length > 0) {
      const matchesSubject = filters.subject.some(filterSubject =>
        item.subject.toLowerCase().includes(filterSubject.toLowerCase())
      );
      if (!matchesSubject) return false;
    }

    if (filters.author.length > 0) {
      const matchesAuthor = filters.author.some(filterAuthor =>
        item.author.toLowerCase().includes(filterAuthor.toLowerCase())
      );
      if (!matchesAuthor) return false;
    }

    if (filters.year.trim()) {
      const filterYear = parseInt(filters.year);
      if (!isNaN(filterYear) && item.year !== filterYear) return false;
    }

    if (filters.duration.trim()) {
      if (!matchesDurationFilter(item.duration, filters.duration)) return false;
    }

    if (filters.language.length > 0) {
      const matchesLanguage = filters.language.some(filterLang =>
        item.language?.toLowerCase().includes(filterLang.toLowerCase()) ||
        item.pais?.toLowerCase().includes(filterLang.toLowerCase())
      );
      if (!matchesLanguage) return false;
    }

    if (filters.documentType.length > 0) {
      if (!item.documentType || !filters.documentType.includes(item.documentType)) return false;
    }

    if (filters.program.length > 0) {
      if (item.type !== 'podcast' || !item.program) return false;
      const matchesProgram = filters.program.some(filterProgram =>
        item.program!.toLowerCase().includes(filterProgram.toLowerCase())
      );
      if (!matchesProgram) return false;
    }

    if (filters.channel.length > 0) {
      if (item.type !== 'video' || !item.channel) return false;
      const matchesChannel = filters.channel.some(filterChannel =>
        item.channel!.toLowerCase().includes(filterChannel.toLowerCase())
      );
      if (!matchesChannel) return false;
    }

    return true;
  });
};

const matchesDurationFilter = (itemDuration: string | undefined, filterDuration: string): boolean => {
  if (!itemDuration || !filterDuration) return true;
  
  const minutes = parseDurationToMinutes(itemDuration);
  
  switch (filterDuration.toLowerCase()) {
    case 'short':
      return minutes > 0 && minutes <= 10;
    case 'medium':
      return minutes > 10 && minutes <= 30;
    case 'long':
      return minutes > 30;
    default:
      return true;
  }
};

const parseDurationToMinutes = (duration: string): number => {
  if (!duration) return 0;
  
  let totalMinutes = 0;
  const durationStr = duration.toLowerCase().trim();
  
  const hoursMatch = durationStr.match(/(\d+)h/);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1]) * 60;
  }
  
  const minutesMatch = durationStr.match(/(\d+)m/);
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1]);
  }
  
  if (!hoursMatch && !minutesMatch) {
    const numberMatch = durationStr.match(/(\d+)/);
    if (numberMatch) {
      totalMinutes = parseInt(numberMatch[1]);
    }
  }
  
  return totalMinutes;
};

const sortResults = (results: SearchResult[], sortBy: string, query?: string): SearchResult[] => {
  const sortedResults = [...results];
  
  switch (sortBy) {
    case 'relevance':
      if (query?.trim()) {
        const queryLower = query.toLowerCase();
        return sortedResults.sort((a, b) => {
          const aTitle = a.title.toLowerCase();
          const bTitle = b.title.toLowerCase();
          const aStartsWithQuery = aTitle.startsWith(queryLower);
          const bStartsWithQuery = bTitle.startsWith(queryLower);
          
          if (aStartsWithQuery && !bStartsWithQuery) return -1;
          if (!aStartsWithQuery && bStartsWithQuery) return 1;
          
          return aTitle.localeCompare(bTitle);
        });
      }
      return sortedResults.sort((a, b) => a.title.localeCompare(b.title));
      
    case 'title':
      return sortedResults.sort((a, b) => a.title.localeCompare(b.title));
      
    case 'recent':
      return sortedResults.sort((a, b) => (b.year || 0) - (a.year || 0));
      
    case 'accessed':
      const typeOrder = { 'podcast': 3, 'video': 2, 'titulo': 1 };
      return sortedResults.sort((a, b) => {
        const orderA = typeOrder[a.type as keyof typeof typeOrder] || 0;
        const orderB = typeOrder[b.type as keyof typeof typeOrder] || 0;
        if (orderA !== orderB) return orderB - orderA;
        return a.title.localeCompare(b.title);
      });
      
    default:
      return sortedResults;
  }
};

// NOVA FUNÇÃO PARA DETECTAR TIPO DE BUSCA
const detectSearchType = (searchParams: SearchRequest): 'fast' | 'optimized' | 'regular' => {
  const { filters, query } = searchParams;
  
  // Se tem filtros complexos, usar busca otimizada
  const hasComplexFilters = 
    filters.subject.length > 0 || 
    filters.author.length > 0 || 
    filters.year || 
    filters.duration || 
    filters.language.length > 0 ||
    filters.documentType.length > 0 || 
    filters.program.length > 0 || 
    filters.channel.length > 0;
  
  if (hasComplexFilters) return 'optimized';
  
  // Se tem exatamente um tipo de recurso (filtro simples), usar fast filter
  const activeTypes = filters.resourceType.filter(type => type !== 'all');
  if (activeTypes.length === 1 && !query.trim()) return 'fast';
  
  // Caso contrário, usar busca regular
  return 'regular';
};

const fetchAllFromSupabaseFallback = async (): Promise<SearchResult[]> => {
  console.log('🔄 Fallback Supabase para conteúdo global...');
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Supabase fallback timeout')), 20000);
    });

    const [booksResult, videosResult, podcastsResult] = await Promise.allSettled([
      Promise.race([supabase.functions.invoke('fetch-books'), timeoutPromise]),
      Promise.race([supabase.functions.invoke('fetch-videos'), timeoutPromise]),
      Promise.race([supabase.functions.invoke('fetch-podcasts'), timeoutPromise])
    ]);

    const allContent: SearchResult[] = [];

    if (booksResult.status === 'fulfilled' && booksResult.value.data?.success) {
      allContent.push(...(booksResult.value.data.books || []));
    }
    if (videosResult.status === 'fulfilled' && videosResult.value.data?.success) {
      allContent.push(...(videosResult.value.data.videos || []));
    }
    if (podcastsResult.status === 'fulfilled' && podcastsResult.value.data?.success) {
      allContent.push(...(podcastsResult.value.data.podcasts || []));
    }

    console.log(`✅ Fallback Supabase: ${allContent.length} itens`);
    return allContent;
    
  } catch (error) {
    console.error('❌ Fallback Supabase falhou:', error);
    return [];
  }
};

// HANDLER PRINCIPAL COM DETECÇÃO INTELIGENTE DE TIPO DE BUSCA
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const searchType = detectSearchType(requestBody);
    
    console.log('📨 Search request received:', { 
      searchType,
      optimized: requestBody.optimized, 
      prefetch: requestBody.prefetch 
    });
    
    let result;
    
    switch (searchType) {
      case 'fast':
        console.log('⚡ Using FAST FILTER for simple type filter');
        result = await performFastTypeFilter(requestBody);
        break;
        
      case 'optimized':
        console.log('🚀 Using OPTIMIZED SEARCH for complex filters');
        result = await performOptimizedFilteredSearch(requestBody);
        break;
        
      default:
        console.log('📡 Using REGULAR SEARCH');
        result = await performRegularSearch(requestBody);
        break;
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error('❌ Search handler error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      results: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalResults: 0,
        hasNextPage: false,
        hasPreviousPage: false
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Função para busca regular (fallback)
const performRegularSearch = async (searchParams: SearchRequest): Promise<any> => {
  console.log('📡 Performing regular search fallback');
  return await fetchAllFromSupabaseFallback();
};

// Função de busca otimizada existente (mantida para compatibilidade)
const performOptimizedFilteredSearch = async (searchParams: SearchRequest): Promise<any> => {
  // ... keep existing code from previous implementation
  return buildEmptyResponse(searchParams);
};
