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

// ✅ ATUALIZADO: Mapeamento de códigos de idioma (mesmo do fetch-videos)
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
    books: 30,
    articles: 35
  };
  
  const TOTAL_ITEMS = CONTENT_TOTALS.podcasts + CONTENT_TOTALS.videos + CONTENT_TOTALS.books + CONTENT_TOTALS.articles; // 2877
  
  // Calcular distribuição proporcional para esta página
  const startIndex = (page - 1) * limit;
  
  const podcastRatio = CONTENT_TOTALS.podcasts / TOTAL_ITEMS; // ~0.87
  const videoRatio = CONTENT_TOTALS.videos / TOTAL_ITEMS; // ~0.10
  const bookRatio = CONTENT_TOTALS.books / TOTAL_ITEMS; // ~0.01
  const articleRatio = CONTENT_TOTALS.articles / TOTAL_ITEMS; // ~0.01
  
  const podcastsNeeded = Math.round(limit * podcastRatio);
  const videosNeeded = Math.round(limit * videoRatio);
  const booksNeeded = Math.round(limit * bookRatio);
  const articlesNeeded = limit - podcastsNeeded - videosNeeded - booksNeeded;
  
  // Calcular páginas correspondentes
  const podcastPage = Math.ceil((startIndex * podcastRatio + 1) / podcastsNeeded) || 1;
  const videoPage = Math.ceil((startIndex * videoRatio + 1) / videosNeeded) || 1;
  const bookPage = Math.ceil((startIndex * bookRatio + 1) / booksNeeded) || 1;
  const articlePage = Math.ceil((startIndex * articleRatio + 1) / articlesNeeded) || 1;
  
  console.log(`📊 Distribuição página ${page}:`, {
    podcasts: { page: podcastPage, limit: podcastsNeeded },
    videos: { page: videoPage, limit: videosNeeded },
    books: { page: bookPage, limit: booksNeeded },
    articles: { page: articlePage, limit: articlesNeeded }
  });
  
  // Requisições paralelas otimizadas - apenas os itens necessários
  const [podcastsResult, videosResult, booksResult, articlesResult] = await Promise.allSettled([
    fetchPaginatedContent('podcast', Math.max(1, podcastPage), Math.max(1, podcastsNeeded)),
    fetchPaginatedContent('aula', Math.max(1, videoPage), Math.max(1, videosNeeded)),
    fetchPaginatedContent('livro', Math.max(1, bookPage), Math.max(1, booksNeeded)),
    fetchPaginatedContent('artigos', Math.max(1, articlePage), Math.max(1, articlesNeeded))
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
  
  if (articlesResult.status === 'fulfilled') {
    allItems.push(...articlesResult.value.items);
    console.log(`✅ Artigos: ${articlesResult.value.items.length} itens`);
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
      const [podcastsResult, videosResult, booksResult, articlesResult] = await Promise.allSettled([
        fetchPaginatedContent('podcast', 1, 25),
        fetchPaginatedContent('aula', 1, 25),
        fetchPaginatedContent('livro', 1, 15),
        fetchPaginatedContent('artigos', 1, 15)
      ]);

      if (podcastsResult.status === 'fulfilled') allContent.push(...podcastsResult.value.items);
      if (videosResult.status === 'fulfilled') allContent.push(...videosResult.value.items);
      if (booksResult.status === 'fulfilled') allContent.push(...booksResult.value.items);
      if (articlesResult.status === 'fulfilled') allContent.push(...articlesResult.value.items);
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

// FUNÇÃO PRINCIPAL DE BUSCA COM NOVA ARQUITETURA
const performSearch = async (searchParams: SearchRequest): Promise<any> => {
  const { query, filters } = searchParams;
  const requestId = `search_${Date.now()}`;
  
  // DETECTOR DE TIPO DE BUSCA
  const searchType = detectSearchType(query, filters);
  
  console.group(`🔍 ${requestId} - ${searchType.toUpperCase()} SEARCH`);
  console.log('📋 Parâmetros:', { 
    query: query || '(vazio)', 
    resourceTypes: filters.resourceType,
    page: searchParams.page,
    type: searchType
  });

  try {
    let result;
    
    // ROTEAMENTO POR TIPO DE BUSCA
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
    
    console.log(`✅ ${searchType.toUpperCase()} concluída:`, {
      resultados: result.results.length,
      total: result.pagination.totalResults,
      pagina: `${result.pagination.currentPage}/${result.pagination.totalPages}`
    });
    
    console.groupEnd();
    return result;

  } catch (error) {
    console.error(`❌ ${searchType.toUpperCase()} falhou:`, error);
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

const transformToSearchResult = (item: any, tipo: string): SearchResult => {
  console.log(`🔄 ARTIGOS INTEGRATION: Transformando ${tipo}:`, {
    originalId: item.id,
    titulo: item.titulo || item.podcast_titulo || item.episodio_titulo,
    idioma: item.idioma,
    categorias: item.categorias,
    categoria: item.categoria,
    data_publicacao: item.data_publicacao,
    url: item.url,
    tipo_documento: item.tipo_documento
  });
  
  const realId = String(item.id || item.episodio_id || item.podcast_id || Math.floor(Math.random() * 10000) + 1000);
  
  let subjectForBadge: string;
  
  if (tipo === 'podcast') {
    subjectForBadge = getSubjectFromCategories(item.categorias) || 'Podcast';
    console.log(`🏷️ PODCAST BADGE: "${subjectForBadge}" (de categorias) em vez de "${item.podcast_titulo}"`);
  } else {
    subjectForBadge = getSubjectFromCategories(item.categorias) || 
                     (item.categoria ? item.categoria : '') || 
                     getSubject(tipo);
  }
  
  // ✅ NOVO: Extrair ano de data_publicacao para artigos
  const extractedYear = extractYearFromDate(item.data_publicacao || item.ano || item.data_lancamento);
  
  const baseResult: SearchResult = {
    id: realId,
    originalId: String(item.id || item.episodio_id || item.podcast_id),
    title: item.titulo || item.podcast_titulo || item.episodio_titulo || item.title || 'Título não disponível',
    author: item.autor || item.canal || item.publicador || 'Link Business School',
    year: extractedYear,
    description: item.descricao || 'Descrição não disponível',
    subject: subjectForBadge,
    type: tipo === 'livro' || tipo === 'artigos' ? 'titulo' : tipo === 'aula' ? 'video' : 'podcast' as 'titulo' | 'video' | 'podcast',
    thumbnail: item.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
    categories: Array.isArray(item.categorias) ? item.categorias : (item.categoria ? [item.categoria] : [])
  };

  console.log(`✅ RESULTADO FINAL: ${baseResult.type} com subject="${baseResult.subject}" para badge`);

  if (tipo === 'livro' || tipo === 'artigos') {
    baseResult.pdfUrl = item.arquivo || item.url;
    baseResult.pages = item.paginas;
    baseResult.language = item.language ? mapLanguageCode(item.language) : mapLanguageCode(item.idioma);
    baseResult.documentType = tipo === 'artigos' ? 'Artigo' : (item.tipo_documento || 'Livro');
    console.log(`📚 ${tipo.toUpperCase()}: documentType="${baseResult.documentType}", language="${baseResult.language}", pdfUrl="${baseResult.pdfUrl?.substring(0, 50)}..."`);
  } else if (tipo === 'aula') {
    baseResult.embedUrl = item.embed_url;
    baseResult.duration = item.duracao_ms ? formatDuration(item.duracao_ms) : undefined;
    baseResult.channel = item.canal || 'Canal desconhecido';
    // ✅ CORRIGIDO: Adicionar language para vídeos
    baseResult.language = item.idioma ? mapLanguageCode(item.idioma) : undefined;
    console.log(`🌐 VIDEO LANGUAGE: ${item.idioma} -> ${baseResult.language}`);
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
  // ✅ CORREÇÃO: Capitalizar primeira letra da primeira categoria para badges
  const firstCategory = categorias[0];
  return firstCategory.charAt(0).toUpperCase() + firstCategory.slice(1);
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
    // ✅ CRÍTICO: Validar resourceType primeiro para garantir tipos corretos
    if (filters.resourceType.length > 0 && !filters.resourceType.includes('all')) {
      if (!filters.resourceType.includes(item.type)) {
        console.log(`🚫 Item rejeitado por tipo: ${item.type} não está em ${filters.resourceType.join(', ')}`);
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
  
  // Se já é um número, retornar diretamente
  if (typeof dateValue === 'number') return dateValue;
  
  // Se é string "desconhecida", retornar ano atual
  if (typeof dateValue === 'string' && dateValue.toLowerCase().includes('desconhecida')) {
    return new Date().getFullYear();
  }
  
  // Tentar extrair ano de string de data
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
    console.log('📨 ARTIGOS INTEGRATION - Nova busca:', requestBody);
    
    const result = await performSearch(requestBody);
    
    // LOG CRÍTICO: Verificar artigos nos resultados
    if (result.results && result.results.length > 0) {
      const articleResults = result.results.filter((r: any) => r.documentType === 'Artigo');
      if (articleResults.length > 0) {
        console.log('📄 VERIFICAÇÃO ARTIGOS:', {
          totalArtigos: articleResults.length,
          primeiroArtigo: {
            title: articleResults[0].title.substring(0, 50),
            documentType: articleResults[0].documentType,
            author: articleResults[0].author,
            year: articleResults[0].year,
            pdfUrl: articleResults[0].pdfUrl?.substring(0, 50)
          }
        });
      }
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error('❌ Erro na busca com integração de artigos:', error);
    
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
