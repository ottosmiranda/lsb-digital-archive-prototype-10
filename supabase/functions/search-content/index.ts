
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
}

interface SearchResult {
  id: string;
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

// CONFIGURAÇÕES DA API
const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';

const TIMEOUTS = {
  singleRequest: 8000,
  paginatedBatch: 12000,
  globalOperation: 25000,
  healthCheck: 3000,
  querySearch: 15000
};

const CACHE_STRATEGIES = {
  paginated: { ttl: 10 * 60 * 1000, prefix: 'paginated' },
  global: { ttl: 15 * 60 * 1000, prefix: 'global' },
  filtered: { ttl: 2 * 60 * 1000, prefix: 'filtered' },
  queryBased: { ttl: 5 * 60 * 1000, prefix: 'query' }
};

type SearchType = 'paginated' | 'global' | 'filtered' | 'queryBased';

const globalCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// MAPEAMENTO DE IDIOMAS
const languageMapping: Record<string, string> = {
  'en': 'Inglês',
  'en-US': 'Inglês',
  'en-GB': 'Inglês',
  'pt': 'Português',
  'pt-BR': 'Português',
  'pt-PT': 'Português',
  'es': 'Espanhol',
  'es-ES': 'Espanhol',
  'es-MX': 'Espanhol',
  'fr': 'Francês',
  'fr-FR': 'Francês',
  'de': 'Alemão',
  'de-DE': 'Alemão',
  'it': 'Italiano',
  'it-IT': 'Italiano',
  'ja': 'Japonês',
  'ja-JP': 'Japonês',
  'ko': 'Coreano',
  'ko-KR': 'Coreano',
  'zh': 'Chinês',
  'zh-CN': 'Chinês',
  'ru': 'Russo',
  'ru-RU': 'Russo',
  'Und': 'Indefinido',
  'desconhecido': 'Não especificado'
};

const mapLanguageCode = (idioma: string): string => {
  if (!idioma) return 'Não especificado';
  
  if (languageMapping[idioma]) {
    return languageMapping[idioma];
  }
  
  const prefix = idioma.split('-')[0];
  if (languageMapping[prefix]) {
    return languageMapping[prefix];
  }
  
  return idioma.charAt(0).toUpperCase() + idioma.slice(1);
};

// DETECTOR DE TIPO DE BUSCA
const detectSearchType = (query: string, filters: SearchFilters): SearchType => {
  const hasQuery = query && query.trim() !== '';
  const hasResourceTypeFilters = filters.resourceType.length > 0 && !filters.resourceType.includes('all');
  
  const hasOtherFilters = filters.subject.length > 0 || filters.author.length > 0 || 
                          filters.year || filters.duration || filters.language.length > 0 ||
                          filters.program.length > 0 || 
                          filters.channel.length > 0;

  console.log('🔍 DETECTOR:', { 
    hasQuery, 
    hasResourceTypeFilters, 
    hasOtherFilters, 
    documentType: filters.documentType,
    resultado: hasQuery ? 'queryBased' : hasOtherFilters ? 'filtered' : hasResourceTypeFilters ? 'paginated' : 'global'
  });

  if (hasQuery) {
    return 'queryBased';
  }

  if (filters.resourceType.includes('all') || (!hasResourceTypeFilters && !hasOtherFilters)) {
    return 'global';
  }
  
  if (hasOtherFilters) {
    return 'filtered';
  }
  
  return 'paginated';
};

// FUNÇÕES DE CACHE
const getCacheKey = (strategy: SearchType, identifier: string): string => {
  const config = CACHE_STRATEGIES[strategy];
  return `${config.prefix}_${identifier}`;
};

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

const setCache = (cacheKey: string, data: any, strategy: SearchType): void => {
  const config = CACHE_STRATEGIES[strategy];
  
  if (Array.isArray(data) && data.length === 0 && strategy !== 'filtered' && strategy !== 'queryBased') {
    console.warn(`⚠️ Não cacheando resultado vazio: ${cacheKey}`);
    return;
  }
  
  globalCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl: config.ttl
  });
  
  console.log(`📦 Cache SET [${strategy}]: ${cacheKey} (${Array.isArray(data) ? data.length : 'N/A'} items)`);
};

const getCache = (cacheKey: string): any => {
  const cached = globalCache.get(cacheKey);
  return cached?.data || null;
};

// FUNÇÃO PARA BUSCAR DADOS DA API
const fetchFromAPI = async (endpoint: string, timeout: number = TIMEOUTS.singleRequest): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`🌐 Fetching: ${url}`);
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
  });
  
  const fetchPromise = fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'LSB-Search/1.0'
    }
  });

  const response = await Promise.race([fetchPromise, timeoutPromise]);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return await response.json();
};

// TRANSFORMAR DADOS DA API
const transformApiItem = (item: any): SearchResult => {
  const realId = String(item.id || item.episodio_id || item.podcast_id || Math.floor(Math.random() * 10000) + 1000);
  
  let subjectForBadge: string;
  
  if (item.tipo === 'podcast') {
    subjectForBadge = getSubjectFromCategories(item.categorias) || 'Podcast';
  } else {
    subjectForBadge = getSubjectFromCategories(item.categorias) || 
                     (item.categoria ? item.categoria : '') || 
                     getSubject(item.tipo);
  }
  
  const extractedYear = extractYearFromDate(item.data_publicacao || item.data_lancamento || item.ano);
  
  const baseResult: SearchResult = {
    id: realId,
    originalId: String(item.id || item.episodio_id || item.podcast_id),
    title: item.titulo || item.episodio_titulo || item.title || 'Título não disponível',
    author: item.autor || item.canal || item.publicador || 'Link Business School',
    year: extractedYear,
    description: item.descricao || 'Descrição não disponível',
    subject: subjectForBadge,
    type: item.tipo === 'livro' || item.tipo === 'artigos' ? 'titulo' : item.tipo === 'aula' ? 'video' : 'podcast' as 'titulo' | 'video' | 'podcast',
    thumbnail: item.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png'
  };

  // Propriedades específicas por tipo
  if (item.tipo === 'livro' || item.tipo === 'artigos') {
    baseResult.pdfUrl = item.arquivo || item.url;
    baseResult.pages = item.paginas;
    baseResult.language = item.language ? mapLanguageCode(item.language) : mapLanguageCode(item.idioma);
    baseResult.documentType = item.tipo === 'artigos' ? 'Artigo' : (item.tipo_documento || 'Livro');
  } else if (item.tipo === 'aula') {
    baseResult.embedUrl = item.embed_url;
    baseResult.duration = item.duracao_ms ? formatDuration(item.duracao_ms) : (item.duracao ? formatDurationFromSeconds(item.duracao) : undefined);
    baseResult.channel = item.canal || 'Canal desconhecido';
    baseResult.language = item.idioma ? mapLanguageCode(item.idioma) : undefined;
  } else if (item.tipo === 'podcast') {
    baseResult.duration = item.duracao_ms ? formatDuration(item.duracao_ms) : undefined;
    baseResult.embedUrl = item.embed_url;
    baseResult.program = item.podcast_titulo || 'Programa desconhecido';
  }

  return baseResult;
};

// BUSCA POR QUERY
const performQueryBasedSearch = async (searchParams: SearchRequest): Promise<any> => {
  const { query, filters, sortBy, page, resultsPerPage } = searchParams;
  
  console.log(`🔍 Busca Query-Based: "${query}", página ${page}`);
  
  const cacheKey = getCacheKey('queryBased', `${query}_page${page}_limit${resultsPerPage}`);
  
  if (isValidCache(cacheKey)) {
    const cached = getCache(cacheKey);
    console.log(`📦 Cache HIT Query: ${cached.results.length} itens`);
    return cached;
  }
  
  try {
    const url = `/conteudo-lbs/search?q=${encodeURIComponent(query)}&page=${page}&limit=${resultsPerPage}`;
    const data = await fetchFromAPI(url, TIMEOUTS.querySearch);
    
    if (!data.conteudo || !Array.isArray(data.conteudo)) {
      console.warn(`⚠️ Query search sem resultados: "${query}"`);
      
      const emptyResponse = {
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
      
      setCache(cacheKey, emptyResponse, 'queryBased');
      return emptyResponse;
    }
    
    const transformedItems = data.conteudo.map((item: any) => transformApiItem(item));
    
    let filteredItems = transformedItems;
    if (hasActiveFilters(filters)) {
      filteredItems = applyFilters(transformedItems, filters);
    }
    
    const sortedItems = sortResults(filteredItems, sortBy, query);
    
    const totalResults = data.total || sortedItems.length;
    const totalPages = data.totalPages || Math.ceil(totalResults / resultsPerPage);
    
    const response = {
      success: true,
      results: sortedItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      searchInfo: {
        query,
        appliedFilters: filters,
        sortBy
      }
    };
    
    setCache(cacheKey, response, 'queryBased');
    
    console.log(`✅ Query search concluída: ${sortedItems.length} resultados para "${query}"`);
    return response;
    
  } catch (error) {
    console.error(`❌ Query search falhou para "${query}":`, error);
    return await performGlobalSearch(searchParams);
  }
};

// BUSCA GLOBAL - IMPLEMENTAÇÃO REAL
const performGlobalSearch = async (searchParams: SearchRequest): Promise<any> => {
  const { query, filters, sortBy, page, resultsPerPage } = searchParams;
  
  console.log(`🌍 Global search - página ${page}, limit ${resultsPerPage}`);
  
  const cacheKey = getCacheKey('global', `page${page}_limit${resultsPerPage}_sort${sortBy}`);
  
  if (isValidCache(cacheKey)) {
    const cached = getCache(cacheKey);
    console.log(`📦 Cache HIT Global: ${cached.results.length} itens`);
    return cached;
  }
  
  try {
    // Buscar dados de todos os tipos
    const [livrosData, aulasData, podcastsData] = await Promise.allSettled([
      fetchFromAPI(`/conteudo-lbs?tipo=livro&page=${page}&limit=${Math.ceil(resultsPerPage/3)}`, TIMEOUTS.globalOperation),
      fetchFromAPI(`/conteudo-lbs?tipo=aula&page=${page}&limit=${Math.ceil(resultsPerPage/3)}`, TIMEOUTS.globalOperation),
      fetchFromAPI(`/conteudo-lbs?tipo=podcast&page=${page}&limit=${Math.ceil(resultsPerPage/3)}`, TIMEOUTS.globalOperation)
    ]);
    
    const allItems: SearchResult[] = [];
    
    // Processar livros
    if (livrosData.status === 'fulfilled' && livrosData.value.conteudo) {
      const livros = livrosData.value.conteudo.map((item: any) => transformApiItem(item));
      allItems.push(...livros);
    }
    
    // Processar aulas/vídeos
    if (aulasData.status === 'fulfilled' && aulasData.value.conteudo) {
      const aulas = aulasData.value.conteudo.map((item: any) => transformApiItem(item));
      allItems.push(...aulas);
    }
    
    // Processar podcasts
    if (podcastsData.status === 'fulfilled' && podcastsData.value.conteudo) {
      const podcasts = podcastsData.value.conteudo.map((item: any) => transformApiItem(item));
      allItems.push(...podcasts);
    }
    
    // Aplicar filtros se necessário
    let filteredItems = allItems;
    if (hasActiveFilters(filters)) {
      filteredItems = applyFilters(allItems, filters);
    }
    
    // Ordenar resultados
    const sortedItems = sortResults(filteredItems, sortBy, query);
    
    // Paginação dos resultados combinados
    const startIndex = (page - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const paginatedItems = sortedItems.slice(startIndex, endIndex);
    
    const totalResults = sortedItems.length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    
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
        query,
        appliedFilters: filters,
        sortBy
      }
    };
    
    setCache(cacheKey, response, 'global');
    
    console.log(`✅ Global search concluída: ${paginatedItems.length} resultados`);
    return response;
    
  } catch (error) {
    console.error(`❌ Global search falhou:`, error);
    
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
        query,
        appliedFilters: filters,
        sortBy
      },
      error: error.message
    };
  }
};

// BUSCA PAGINADA - IMPLEMENTAÇÃO REAL
const performPaginatedSearch = async (searchParams: SearchRequest): Promise<any> => {
  const { query, filters, sortBy, page, resultsPerPage } = searchParams;
  
  console.log(`📄 Paginated search - tipos: ${filters.resourceType.join(', ')}, página ${page}`);
  
  const cacheKey = getCacheKey('paginated', `${filters.resourceType.join('_')}_page${page}_limit${resultsPerPage}_sort${sortBy}`);
  
  if (isValidCache(cacheKey)) {
    const cached = getCache(cacheKey);
    console.log(`📦 Cache HIT Paginated: ${cached.results.length} itens`);
    return cached;
  }
  
  try {
    const allItems: SearchResult[] = [];
    
    // Buscar dados baseado nos tipos de recurso
    for (const resourceType of filters.resourceType) {
      let apiType = '';
      
      if (resourceType === 'titulo') {
        apiType = 'livro';
      } else if (resourceType === 'video') {
        apiType = 'aula';
      } else if (resourceType === 'podcast') {
        apiType = 'podcast';
      }
      
      if (apiType) {
        try {
          const data = await fetchFromAPI(`/conteudo-lbs?tipo=${apiType}&page=${page}&limit=${resultsPerPage}`, TIMEOUTS.paginatedBatch);
          
          if (data.conteudo && Array.isArray(data.conteudo)) {
            const items = data.conteudo.map((item: any) => transformApiItem(item));
            allItems.push(...items);
          }
        } catch (error) {
          console.warn(`⚠️ Falha ao buscar ${apiType}:`, error);
        }
      }
    }
    
    // Aplicar filtros se necessário
    let filteredItems = allItems;
    if (hasActiveFilters(filters)) {
      filteredItems = applyFilters(allItems, filters);
    }
    
    // Ordenar resultados
    const sortedItems = sortResults(filteredItems, sortBy, query);
    
    const totalResults = sortedItems.length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    
    const response = {
      success: true,
      results: sortedItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      searchInfo: {
        query,
        appliedFilters: filters,
        sortBy
      }
    };
    
    setCache(cacheKey, response, 'paginated');
    
    console.log(`✅ Paginated search concluída: ${sortedItems.length} resultados`);
    return response;
    
  } catch (error) {
    console.error(`❌ Paginated search falhou:`, error);
    return await performGlobalSearch(searchParams);
  }
};

// BUSCA FILTRADA - IMPLEMENTAÇÃO REAL
const performFilteredSearch = async (searchParams: SearchRequest): Promise<any> => {
  const { query, filters, sortBy, page, resultsPerPage } = searchParams;
  
  console.log(`🔍 Filtered search - filtros ativos detectados`);
  
  const cacheKey = getCacheKey('filtered', `${JSON.stringify(filters)}_page${page}_sort${sortBy}`);
  
  if (isValidCache(cacheKey)) {
    const cached = getCache(cacheKey);
    console.log(`📦 Cache HIT Filtered: ${cached.results.length} itens`);
    return cached;
  }
  
  try {
    // Para busca filtrada, buscar dados globais e aplicar filtros
    const globalParams = { ...searchParams, filters: { ...filters, resourceType: ['all'] } };
    const globalData = await performGlobalSearch(globalParams);
    
    if (!globalData.success) {
      return globalData;
    }
    
    // Aplicar filtros específicos
    let filteredItems = globalData.results;
    if (hasActiveFilters(filters)) {
      filteredItems = applyFilters(globalData.results, filters);
    }
    
    const sortedItems = sortResults(filteredItems, sortBy, query);
    
    // Paginação dos resultados filtrados
    const startIndex = (page - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const paginatedItems = sortedItems.slice(startIndex, endIndex);
    
    const totalResults = sortedItems.length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    
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
        query,
        appliedFilters: filters,
        sortBy
      }
    };
    
    setCache(cacheKey, response, 'filtered');
    
    console.log(`✅ Filtered search concluída: ${paginatedItems.length} resultados`);
    return response;
    
  } catch (error) {
    console.error(`❌ Filtered search falhou:`, error);
    return await performGlobalSearch(searchParams);
  }
};

// COORDENADOR PRINCIPAL
const performSearch = async (searchParams: SearchRequest): Promise<any> => {
  const searchType = detectSearchType(searchParams.query, searchParams.filters);
  
  console.log(`🎯 SEARCH COORDINATOR: Tipo detectado = ${searchType}`);
  console.log(`📋 Parâmetros:`, {
    query: searchParams.query,
    page: searchParams.page,
    filters: searchParams.filters
  });

  switch (searchType) {
    case 'queryBased':
      return await performQueryBasedSearch(searchParams);
    
    case 'filtered':
      return await performFilteredSearch(searchParams);
    
    case 'paginated':
      return await performPaginatedSearch(searchParams);
    
    case 'global':
    default:
      return await performGlobalSearch(searchParams);
  }
};

// FUNÇÕES AUXILIARES
const getSubjectFromCategories = (categorias: string[]): string => {
  if (!categorias || categorias.length === 0) return '';
  
  const categoryMap: Record<string, string> = {
    'negócios': 'Negócios',
    'empresários': 'Empreendedorismo', 
    'business': 'Negócios',
    'podcast': 'Podcast',
    'tecnologia': 'Tecnologia',
    'educação': 'Educação',
    'economia': 'Economia',
    'finanças': 'Finanças'
  };
  
  for (const categoria of categorias) {
    const mapped = categoryMap[categoria.toLowerCase()];
    if (mapped) return mapped;
  }
  
  return categorias[0].charAt(0).toUpperCase() + categorias[0].slice(1);
};

const getSubject = (tipo: string): string => {
  const typeMap: Record<string, string> = {
    'podcast': 'Podcast',
    'video': 'Vídeo', 
    'aula': 'Educação',
    'livro': 'Literatura',
    'artigos': 'Artigo',
    'titulo': 'Publicação'
  };
  
  return typeMap[tipo] || 'Conteúdo';
};

const hasActiveFilters = (filters: SearchFilters): boolean => {
  return filters.resourceType.length > 0 && !filters.resourceType.includes('all') ||
         filters.subject.length > 0 ||
         filters.author.length > 0 ||
         filters.year.trim() !== '' ||
         filters.duration.trim() !== '' ||
         filters.language.length > 0 ||
         filters.documentType.length > 0 ||
         filters.program.length > 0 ||
         filters.channel.length > 0;
};

const formatDurationFromSeconds = (durationSeconds: number): string => {
  const minutes = Math.floor(durationSeconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
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
    if (filters.resourceType.length > 0 && !filters.resourceType.includes('all')) {
      if (!filters.resourceType.includes(item.type)) {
        return false;
      }
    }

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

const extractYearFromDate = (dateValue: any): number => {
  if (!dateValue) return new Date().getFullYear();
  
  if (typeof dateValue === 'number') return dateValue;
  
  if (typeof dateValue === 'string' && dateValue.toLowerCase().includes('desconhecida')) {
    return new Date().getFullYear();
  }
  
  if (typeof dateValue === 'string') {
    const dateObj = new Date(dateValue);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.getFullYear();
    }
  }
  
  return new Date().getFullYear();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('📨 SEARCH REQUEST - Nova implementação completa:', requestBody);
    
    const result = await performSearch(requestBody);
    
    if (result.results && result.results.length > 0 && requestBody.query) {
      console.log('🔍 SEARCH RESULTS:', {
        query: requestBody.query,
        totalResults: result.pagination.totalResults,
        firstResult: result.results[0] ? {
          title: result.results[0].title.substring(0, 50),
          type: result.results[0].type,
          author: result.results[0].author
        } : null
      });
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error('❌ Erro na busca:', error);
    
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
