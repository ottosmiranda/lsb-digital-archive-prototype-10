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

// NOVA ARQUITETURA: APIs e Configurações
const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';

// TIMEOUTS OTIMIZADOS PARA PAGINAÇÃO REAL
const TIMEOUTS = {
  singleRequest: 8000,
  paginatedBatch: 12000,
  globalOperation: 25000,
  healthCheck: 3000
};

// ESTRATÉGIAS DE CACHE INTELIGENTE
const CACHE_STRATEGIES = {
  paginated: { ttl: 10 * 60 * 1000, prefix: 'paginated' }, // 10 min para páginas específicas
  global: { ttl: 15 * 60 * 1000, prefix: 'global' },       // 15 min para busca "Todos"
  filtered: { ttl: 2 * 60 * 1000, prefix: 'filtered' }     // 2 min para buscas filtradas
};

type SearchType = 'paginated' | 'global' | 'filtered';

// Cache global otimizado
const globalCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// DETECTOR DE TIPO DE BUSCA (SRP)
const detectSearchType = (query: string, filters: SearchFilters): SearchType => {
  const hasQuery = query && query.trim() !== '';
  const hasResourceTypeFilters = filters.resourceType.length > 0 && !filters.resourceType.includes('all');
  const hasOtherFilters = filters.subject.length > 0 || filters.author.length > 0 || 
                          filters.year || filters.duration || filters.language.length > 0 ||
                          filters.documentType.length > 0 || filters.program.length > 0 || 
                          filters.channel.length > 0;

  // Busca global: filtro "Todos" ou sem filtros específicos
  if (filters.resourceType.includes('all') || (!hasResourceTypeFilters && !hasQuery && !hasOtherFilters)) {
    return 'global';
  }
  
  // Busca filtrada: tem query ou outros filtros além do tipo de recurso
  if (hasQuery || hasOtherFilters) {
    return 'filtered';
  }
  
  // Busca paginada: tipos específicos sem query
  return 'paginated';
};

// FUNÇÕES DE CACHE INTELIGENTE
const getCacheKey = (strategy: SearchType, identifier: string): string => {
  const config = CACHE_STRATEGIES[strategy];
  return `${config.prefix}_${identifier}`;
};

const isValidCache = (cacheKey: string): boolean => {
  const cached = globalCache.get(cacheKey);
  if (!cached) return false;
  
  const isValid = (Date.now() - cached.timestamp) < cached.ttl;
  
  // VALIDAÇÃO: Não usar cache corrompido
  if (isValid && Array.isArray(cached.data) && cached.data.length === 0) {
    console.warn(`🚨 Cache corrompido detectado: ${cacheKey}`);
    globalCache.delete(cacheKey);
    return false;
  }
  
  return isValid;
};

const setCache = (cacheKey: string, data: any, strategy: SearchType): void => {
  const config = CACHE_STRATEGIES[strategy];
  
  // Cache apenas resultados válidos
  if (Array.isArray(data) && data.length === 0 && strategy !== 'filtered') {
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

// SERVIÇO DE PAGINAÇÃO REAL DA API (SRP)
const fetchPaginatedContent = async (
  contentType: string,
  page: number,
  limit: number
): Promise<{ items: SearchResult[]; total: number }> => {
  const url = `${API_BASE_URL}/conteudo-lbs?tipo=${contentType}&page=${page}&limit=${limit}`;
  
  console.log(`🔍 API Paginada: ${contentType} página ${page}, limite ${limit}`);
  
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout ${contentType} página ${page}`)), TIMEOUTS.singleRequest);
    });
    
    const fetchPromise = fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'LSB-Paginated-Search/1.0'
      }
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} para ${contentType} página ${page}`);
    }

    const data = await response.json();
    const items = data.conteudo || [];
    const total = data.total || 0;
    
    const transformedItems = items.map((item: any) => transformToSearchResult(item, contentType));
    
    console.log(`✅ API Paginada ${contentType}: ${transformedItems.length} itens, total ${total}`);
    
    return { items: transformedItems, total };
    
  } catch (error) {
    console.error(`❌ Erro API paginada ${contentType} página ${page}:`, error);
    throw error;
  }
};

// BUSCA PAGINADA REAL (NOVA IMPLEMENTAÇÃO)
const performPaginatedSearch = async (
  searchParams: SearchRequest
): Promise<any> => {
  const { filters, sortBy, page, resultsPerPage } = searchParams;
  const activeTypes = filters.resourceType.filter(type => type !== 'all');
  
  console.log(`🎯 Busca Paginada: tipos ${activeTypes.join(', ')}, página ${page}`);
  
  if (activeTypes.length === 0) {
    throw new Error('Nenhum tipo de conteúdo especificado para busca paginada');
  }
  
  // Para busca paginada, processar apenas o primeiro tipo (mantém consistência)
  const contentType = activeTypes[0];
  const apiType = contentType === 'titulo' ? 'livro' : contentType === 'video' ? 'aula' : 'podcast';
  
  const cacheKey = getCacheKey('paginated', `${apiType}_page${page}_limit${resultsPerPage}`);
  
  if (isValidCache(cacheKey)) {
    const cached = getCache(cacheKey);
    console.log(`📦 Cache HIT Paginado: ${cached.results.length} itens`);
    return cached;
  }
  
  try {
    const { items, total } = await fetchPaginatedContent(apiType, page, resultsPerPage);
    
    const totalPages = Math.ceil(total / resultsPerPage);
    
    const response = {
      success: true,
      results: items,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: total,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      searchInfo: {
        query: '',
        appliedFilters: filters,
        sortBy
      }
    };
    
    setCache(cacheKey, response, 'paginated');
    
    console.log(`✅ Busca Paginada concluída: ${items.length} itens, ${total} total`);
    return response;
    
  } catch (error) {
    console.error('❌ Erro na busca paginada:', error);
    throw error;
  }
};

// NOVA IMPLEMENTAÇÃO: Busca Global com Paginação Real Unificada
const performGlobalSearch = async (
  searchParams: SearchRequest
): Promise<any> => {
  const { sortBy, page, resultsPerPage } = searchParams;
  
  console.log(`🎯 Busca Global UNIFICADA: página ${page} (paginação REAL)`);
  
  const cacheKey = getCacheKey('global', `page${page}_limit${resultsPerPage}_sort${sortBy}`);
  
  if (isValidCache(cacheKey)) {
    const cached = getCache(cacheKey);
    console.log(`📦 Cache HIT Global Página: ${cached.results.length} itens`);
    return cached;
  }
  
  try {
    // NOVA ABORDAGEM: Distribuição inteligente por página
    const response = await performUnifiedPageFetch(page, resultsPerPage, sortBy);
    
    setCache(cacheKey, response, 'global');
    
    console.log(`✅ Busca Global Unificada concluída: página ${page}/${response.pagination.totalPages}`);
    return response;
    
  } catch (error) {
    console.error('❌ Erro na busca global unificada:', error);
    throw error;
  }
};

// Nova função para busca unificada por página
const performUnifiedPageFetch = async (
  page: number,
  limit: number,
  sortBy: string
): Promise<any> => {
  const CONTENT_TOTALS = {
    podcasts: 2512,
    videos: 300,
    books: 30
  };
  
  const TOTAL_ITEMS = CONTENT_TOTALS.podcasts + CONTENT_TOTALS.videos + CONTENT_TOTALS.books; // 2842
  
  // Calcular distribuição proporcional para esta página
  const startIndex = (page - 1) * limit;
  
  const podcastRatio = CONTENT_TOTALS.podcasts / TOTAL_ITEMS; // ~0.88
  const videoRatio = CONTENT_TOTALS.videos / TOTAL_ITEMS; // ~0.11
  const bookRatio = CONTENT_TOTALS.books / TOTAL_ITEMS; // ~0.01
  
  const podcastsNeeded = Math.round(limit * podcastRatio);
  const videosNeeded = Math.round(limit * videoRatio);
  const booksNeeded = limit - podcastsNeeded - videosNeeded;
  
  // Calcular páginas correspondentes
  const podcastPage = Math.ceil((startIndex * podcastRatio + 1) / podcastsNeeded) || 1;
  const videoPage = Math.ceil((startIndex * videoRatio + 1) / videosNeeded) || 1;
  const bookPage = Math.ceil((startIndex * bookRatio + 1) / booksNeeded) || 1;
  
  console.log(`📊 Distribuição página ${page}:`, {
    podcasts: { page: podcastPage, limit: podcastsNeeded },
    videos: { page: videoPage, limit: videosNeeded },
    books: { page: bookPage, limit: booksNeeded }
  });
  
  // Requisições paralelas otimizadas - apenas os itens necessários
  const [podcastsResult, videosResult, booksResult] = await Promise.allSettled([
    fetchPaginatedContent('podcast', Math.max(1, podcastPage), Math.max(1, podcastsNeeded)),
    fetchPaginatedContent('aula', Math.max(1, videoPage), Math.max(1, videosNeeded)),
    fetchPaginatedContent('livro', Math.max(1, bookPage), Math.max(1, booksNeeded))
  ]);
  
  const allItems: SearchResult[] = [];
  
  // Agregar apenas os resultados necessários
  if (podcastsResult.status === 'fulfilled') {
    allItems.push(...podcastsResult.value.items);
    console.log(`✅ Podcasts: ${podcastsResult.value.items.length} itens`);
  }
  
  if (videosResult.status === 'fulfilled') {
    allItems.push(...videosResult.value.items);
    console.log(`✅ Vídeos: ${videosResult.value.items.length} itens`);
  }
  
  if (booksResult.status === 'fulfilled') {
    allItems.push(...booksResult.value.items);
    console.log(`✅ Livros: ${booksResult.value.items.length} itens`);
  }
  
  // Ordenar e limitar
  const sortedItems = sortResults(allItems, sortBy);
  const finalItems = sortedItems.slice(0, limit);
  
  const totalPages = Math.ceil(TOTAL_ITEMS / limit);
  
  console.log(`🎯 Página ${page}: ${finalItems.length} itens finais de ${TOTAL_ITEMS} totais`);
  
  return {
    success: true,
    results: finalItems,
    pagination: {
      currentPage: page,
      totalPages,
      totalResults: TOTAL_ITEMS,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    },
    searchInfo: {
      query: '',
      appliedFilters: { resourceType: ['all'] },
      sortBy
    }
  };
};

// NOVA FUNÇÃO: Busca direta por ID específico
const performDirectIdSearch = async (
  searchId: string
): Promise<any> => {
  console.log(`🎯 Busca Direta por ID: ${searchId}`);
  
  // Tentar diferentes formatos de ID
  const searches = [
    // 1. Busca exata por ID numérico
    { type: 'numeric', value: parseInt(searchId) },
    // 2. Busca por originalId (UUID)
    { type: 'uuid', value: searchId },
    // 3. Busca por proximidade numérica
    { type: 'proximity', value: parseInt(searchId) }
  ];

  for (const search of searches) {
    try {
      console.log(`🔍 Tentativa ${search.type} para ${search.value}`);
      
      // Buscar em todos os tipos de conteúdo
      const promises = ['podcast', 'aula', 'livro'].map(async (contentType) => {
        try {
          // Para busca UUID, procurar por originalId
          if (search.type === 'uuid') {
            const { items } = await fetchPaginatedContent(contentType, 1, 100);
            return items.find(item => (item as any).originalId === searchId);
          }
          
          // Para busca numérica, procurar por ID exato
          if (search.type === 'numeric' && !isNaN(search.value as number)) {
            const { items } = await fetchPaginatedContent(contentType, 1, 100);
            return items.find(item => item.id === search.value);
          }
          
          return null;
        } catch (error) {
          console.error(`❌ Erro buscando ${contentType}:`, error);
          return null;
        }
      });

      const results = await Promise.allSettled(promises);
      const foundItem = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<any>).value)
        .find(item => item !== null);

      if (foundItem) {
        console.log(`✅ Recurso encontrado via ${search.type}:`, foundItem.title);
        return {
          success: true,
          results: [foundItem],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalResults: 1,
            hasNextPage: false,
            hasPreviousPage: false
          },
          searchInfo: {
            query: '',
            appliedFilters: { resourceType: ['all'] },
            sortBy: 'relevance',
            searchType: `direct_id_${search.type}`
          }
        };
      }
    } catch (error) {
      console.error(`❌ Erro na busca ${search.type}:`, error);
    }
  }

  // Se não encontrou, buscar sugestões por proximidade
  return await performSuggestionSearch(searchId);
};

// NOVA FUNÇÃO: Busca de sugestões por proximidade
const performSuggestionSearch = async (originalId: string): Promise<any> => {
  console.log(`💡 Buscando sugestões para ID: ${originalId}`);
  
  const numericId = parseInt(originalId);
  if (isNaN(numericId)) {
    return {
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
        appliedFilters: { resourceType: ['all'] },
        sortBy: 'relevance',
        searchType: 'suggestions_failed'
      }
    };
  }

  try {
    // Buscar alguns itens de cada tipo para encontrar IDs próximos
    const promises = ['podcast', 'aula', 'livro'].map(async (contentType) => {
      try {
        const { items } = await fetchPaginatedContent(contentType, 1, 50);
        return items.map(item => ({
          ...item,
          distance: Math.abs(item.id - numericId)
        }));
      } catch (error) {
        console.error(`❌ Erro buscando sugestões ${contentType}:`, error);
        return [];
      }
    });

    const results = await Promise.allSettled(promises);
    const allItems = results
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => (result as PromiseFulfilledResult<any>).value);

    // Ordenar por proximidade e pegar os 5 mais próximos
    const suggestions = allItems
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5)
      .map(item => {
        const { distance, ...itemWithoutDistance } = item;
        return itemWithoutDistance;
      });

    console.log(`💡 Encontradas ${suggestions.length} sugestões para ID ${originalId}`);

    return {
      success: false,
      results: suggestions,
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalResults: 0,
        hasNextPage: false,
        hasPreviousPage: false
      },
      searchInfo: {
        query: '',
        appliedFilters: { resourceType: ['all'] },
        sortBy: 'proximity',
        searchType: 'suggestions',
        originalId
      }
    };

  } catch (error) {
    console.error('❌ Erro ao buscar sugestões:', error);
    return {
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
        appliedFilters: { resourceType: ['all'] },
        sortBy: 'relevance',
        searchType: 'suggestions_error'
      }
    };
  }
};

// FUNÇÃO PRINCIPAL DE BUSCA COM NOVA ARQUITETURA
const performSearch = async (searchParams: SearchRequest): Promise<any> => {
  const { query, filters, searchById, findSimilar } = searchParams as any;
  const requestId = `search_${Date.now()}`;
  
  console.group(`🔍 ${requestId} - SEARCH REQUEST`);
  console.log('📋 Parâmetros:', { 
    query: query || '(vazio)', 
    resourceTypes: filters.resourceType,
    page: searchParams.page,
    searchById,
    findSimilar
  });

  try {
    let result;
    
    // NOVO: Busca direta por ID específico
    if (searchById) {
      console.log(`🎯 Modo: BUSCA POR ID ESPECÍFICO (${searchById})`);
      result = await performDirectIdSearch(searchById);
    }
    // NOVO: Busca de sugestões por proximidade
    else if (findSimilar) {
      console.log(`💡 Modo: BUSCA DE SUGESTÕES (${findSimilar})`);
      result = await performSuggestionSearch(String(findSimilar));
    }
    // Lógica existente
    else {
      const searchType = detectSearchType(query, filters);
      
      switch (searchType) {
        case 'paginated':
          result = await performPaginatedSearch(searchParams);
          break;
        case 'global':
          result = await performGlobalSearch(searchParams);
          break;
        case 'filtered':
          result = await performFilteredSearch(searchParams);
          break;
        default:
          throw new Error(`Tipo de busca não suportado: ${searchType}`);
      }
    }
    
    console.log(`✅ BUSCA concluída:`, {
      resultados: result.results.length,
      total: result.pagination.totalResults,
      tipo: result.searchInfo.searchType || 'standard'
    });
    
    console.groupEnd();
    return result;

  } catch (error) {
    console.error(`❌ BUSCA falhou:`, error);
    console.groupEnd();
    
    return {
      success: false,
      error: error.message,
      results: [],
      pagination: {
        currentPage: searchParams.page,
        totalPages: 0,
        totalResults: 0,
        hasNextPage: false,
        hasPreviousPage: false
      },
      searchInfo: { 
        query: searchParams.query, 
        appliedFilters: searchParams.filters, 
        sortBy: searchParams.sortBy 
      }
    };
  }
};

// FUNÇÃO AUXILIAR: Carregar TODOS os itens de um tipo específico
const loadAllContentOfType = async (contentType: string): Promise<SearchResult[]> => {
  const allItems: SearchResult[] = [];
  let currentPage = 1;
  let hasMore = true;
  
  // Limites aumentados para carregamento completo
  const batchSize = 100; // Itens por batch
  const maxPages = 100; // Limite de segurança
  
  console.log(`🔍 Carregando TODOS os ${contentType}s disponíveis...`);
  
  while (hasMore && currentPage <= maxPages) {
    try {
      const { items, total } = await fetchPaginatedContent(contentType, currentPage, batchSize);
      
      if (items.length === 0) {
        console.log(`📄 ${contentType} página ${currentPage}: Sem mais itens`);
        hasMore = false;
        break;
      }
      
      allItems.push(...items);
      console.log(`📄 ${contentType} página ${currentPage}: +${items.length} itens (total: ${allItems.length})`);
      
      // Continuar se há mais itens e não atingimos o total
      hasMore = items.length === batchSize && allItems.length < total;
      currentPage++;
      
    } catch (error) {
      console.error(`❌ Erro carregando ${contentType} página ${currentPage}:`, error);
      hasMore = false;
    }
  }
  
  console.log(`✅ ${contentType} completo: ${allItems.length} itens carregados`);
  return allItems;
};

// BUSCA FILTRADA COM CACHE TEMPORÁRIO
const performFilteredSearch = async (
  searchParams: SearchRequest
): Promise<any> => {
  const { query, filters, sortBy, page, resultsPerPage } = searchParams;
  
  console.log(`🔍 Busca Filtrada: "${query}", página ${page}`);
  
  // Para busca filtrada, usar dataset global e aplicar filtros
  const globalCacheKey = getCacheKey('global', 'all_content');
  let allContent: SearchResult[] = [];
  
  if (isValidCache(globalCacheKey)) {
    allContent = getCache(globalCacheKey);
    console.log(`📦 Usando dataset global para busca filtrada: ${allContent.length} itens`);
  } else {
    // Fallback: carregar dataset básico
    console.log(`🔄 Carregando dataset para busca filtrada...`);
    try {
      const [podcastsResult, videosResult, booksResult] = await Promise.allSettled([
        fetchPaginatedContent('podcast', 1, 25),
        fetchPaginatedContent('aula', 1, 25),
        fetchPaginatedContent('livro', 1, 15)
      ]);

      if (podcastsResult.status === 'fulfilled') allContent.push(...podcastsResult.value.items);
      if (videosResult.status === 'fulfilled') allContent.push(...videosResult.value.items);
      if (booksResult.status === 'fulfilled') allContent.push(...booksResult.value.items);
    } catch (error) {
      console.error('❌ Erro carregando dataset para busca filtrada:', error);
    }
  }
  
  // Aplicar filtros
  let filteredData = allContent;
  
  if (query && query.trim()) {
    const queryLower = query.toLowerCase();
    filteredData = filteredData.filter(item => {
      const searchText = `${item.title} ${item.author} ${item.description}`.toLowerCase();
      return searchText.includes(queryLower);
    });
  }
  
  filteredData = applyFilters(filteredData, filters);
  filteredData = sortResults(filteredData, sortBy, query);
  
  // Paginação
  const totalResults = filteredData.length;
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const startIndex = (page - 1) * resultsPerPage;
  const paginatedResults = filteredData.slice(startIndex, startIndex + resultsPerPage);
  
  console.log(`✅ Busca Filtrada: ${paginatedResults.length} resultados na página ${page}/${totalPages}`);
  
  return {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('📨 Nova Arquitetura de Busca:', requestBody);
    
    const result = await performSearch(requestBody);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error('❌ Erro na nova arquitetura:', error);
    
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
