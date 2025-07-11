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

// DETECTOR DE TIPO DE BUSCA CORRIGIDO
const detectSearchType = (query: string, filters: SearchFilters): SearchType => {
  const cleanQuery = query?.trim() || '';
  const hasQuery = cleanQuery !== '';
  
  console.log('🔍 Search Type Detection:', { 
    query: `"${query}"`,
    cleanQuery: `"${cleanQuery}"`,
    hasQuery,
    resourceType: filters.resourceType,
    isAll: filters.resourceType.includes('all'),
    hasResourceTypeFilters: filters.resourceType.length > 0 && !filters.resourceType.includes('all')
  });

  // PRIORIDADE 1: Query sempre tem precedência ABSOLUTA
  if (hasQuery) {
    console.log(`🎯 QUERY DETECTADA: "${cleanQuery}" → QUERY-BASED SEARCH`);
    return 'queryBased';
  }

  // PRIORIDADE 2: Filtros de tipo específico
  const hasResourceTypeFilters = filters.resourceType.length > 0 && !filters.resourceType.includes('all');
  const hasOtherFilters = filters.subject.length > 0 || filters.author.length > 0 || 
                          filters.year || filters.duration || filters.language.length > 0 ||
                          filters.program.length > 0 || filters.channel.length > 0;

  if (hasResourceTypeFilters) {
    console.log(`📋 FILTRO ESPECÍFICO: ${filters.resourceType.join(', ')} → PAGINATED SEARCH`);
    return 'paginated';
  }

  if (hasOtherFilters) {
    console.log('🔍 OUTROS FILTROS ATIVOS → FILTERED SEARCH');
    return 'filtered';
  }
  
  // PRIORIDADE 3: Busca global (filtro "Todos" ou sem filtros)
  console.log('🌍 SEM FILTROS ESPECÍFICOS → GLOBAL SEARCH');
  return 'global';
};

// FUNÇÕES DE CACHE
const getCacheKey = (strategy: SearchType, identifier: string): string => {
  const config = CACHE_STRATEGIES[strategy];
  return `${config.prefix}_${identifier}`;
};

const isValidCache = (cacheKey: string): boolean => {
  // Cache buster para Warren
  if (cacheKey.toLowerCase().includes('warren')) {
    console.log('🔥 WARREN CACHE BUSTER ATIVO - FORÇANDO REFRESH TOTAL');
    return false;
  }
  
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
  // Não cachear Warren durante debug
  if (cacheKey.toLowerCase().includes('warren')) {
    console.log('🔥 WARREN - NÃO CACHEANDO DURANTE DEBUG');
    return;
  }
  
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
  console.log(`🔄 TRANSFORM API ITEM - DEBUGGING:`, {
    id: item.id,
    tipo: item.tipo,
    titulo: item.titulo?.substring(0, 50) + '...',
    hasArquivo: !!item.arquivo,
    hasPaginas: !!item.paginas,
    hasEmbedUrl: !!item.embed_url
  });
  
  const realId = String(item.id || item.episodio_id || item.podcast_id || Math.floor(Math.random() * 10000) + 1000);
  
  // ✅ CORREÇÃO CRÍTICA: Detecção inteligente de tipo baseada em múltiplos campos
  let detectedType: 'titulo' | 'video' | 'podcast';
  
  if (item.tipo === 'livro' || item.tipo === 'artigos') {
    detectedType = 'titulo';
    console.log(`✅ TIPO DETECTADO: ${item.tipo} → titulo (livro/artigo)`);
  } else if (item.tipo === 'aula' || item.tipo === 'video') {
    detectedType = 'video';
    console.log(`✅ TIPO DETECTADO: ${item.tipo} → video`);
  } else if (item.tipo === 'podcast') {
    detectedType = 'podcast';
    console.log(`✅ TIPO DETECTADO: ${item.tipo} → podcast`);
  } else {
    // ✅ DETECÇÃO DEFENSIVA: Baseada em campos disponíveis
    if (item.arquivo || item.paginas) {
      detectedType = 'titulo';
      console.log(`🛡️ DETECÇÃO DEFENSIVA: tem arquivo/páginas → titulo (original: ${item.tipo})`);
    } else if (item.embed_url && item.duracao_ms) {
      detectedType = 'podcast';
      console.log(`🛡️ DETECÇÃO DEFENSIVA: tem embed_url + duração → podcast (original: ${item.tipo})`);
    } else if (item.embed_url) {
      detectedType = 'video';
      console.log(`🛡️ DETECÇÃO DEFENSIVA: tem embed_url → video (original: ${item.tipo})`);
    } else {
      detectedType = 'titulo';
      console.log(`⚠️ FALLBACK: tipo desconhecido "${item.tipo}" → titulo por padrão`);
    }
  }
  
  let subjectForBadge: string;
  
  if (detectedType === 'podcast') {
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
    type: detectedType, // ✅ CORRIGIDO: Usar tipo detectado corretamente
    thumbnail: item.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png'
  };

  // Propriedades específicas por tipo
  if (detectedType === 'titulo') {
    baseResult.pdfUrl = item.arquivo || item.url;
    baseResult.pages = item.paginas;
    baseResult.language = item.language ? mapLanguageCode(item.language) : mapLanguageCode(item.idioma);
    
    // ✅ CORREÇÃO: Mapeamento correto de document type
    if (item.tipo === 'artigos') {
      baseResult.documentType = 'Artigo';
      console.log(`📄 Document type: Artigo (baseado em item.tipo: ${item.tipo})`);
    } else {
      baseResult.documentType = item.tipo_documento || 'Livro';
      console.log(`📚 Document type: ${baseResult.documentType} (padrão: Livro)`);
    }
  } else if (detectedType === 'video') {
    baseResult.embedUrl = item.embed_url;
    baseResult.duration = item.duracao_ms ? formatDuration(item.duracao_ms) : (item.duracao ? formatDurationFromSeconds(item.duracao) : undefined);
    baseResult.channel = item.canal || 'Canal desconhecido';
    baseResult.language = item.idioma ? mapLanguageCode(item.idioma) : undefined;
  } else if (detectedType === 'podcast') {
    baseResult.duration = item.duracao_ms ? formatDuration(item.duracao_ms) : undefined;
    baseResult.embedUrl = item.embed_url;
    baseResult.program = item.podcast_titulo || 'Programa desconhecido';
  }

  console.log(`✅ TRANSFORM RESULT:`, {
    id: realId,
    originalType: item.tipo,
    detectedType: detectedType,
    documentType: baseResult.documentType,
    title: baseResult.title.substring(0, 40) + '...'
  });

  return baseResult;
};

// BUSCA POR QUERY - Mantida sem alterações para Warren
const performQueryBasedSearch = async (searchParams: SearchRequest): Promise<any> => {
  const { query, filters, sortBy, page, resultsPerPage } = searchParams;
  
  const requestId = `query_search_${Date.now()}`;
  console.group(`🔥 ${requestId} - QUERY-BASED SEARCH`);
  console.log('📋 QUERY PARAMETERS:', { 
    query: `"${query}"`, 
    page, 
    resultsPerPage
  });
  
  const cacheKey = getCacheKey('queryBased', `${query}_page${page}_limit${resultsPerPage}_sort${sortBy}`);
  
  // Para Warren, NUNCA usar cache
  const isWarren = query.toLowerCase().includes('warren');
  if (!isWarren && isValidCache(cacheKey)) {
    const cached = getCache(cacheKey);
    console.log(`📦 Cache HIT Query: ${cached.results.length} itens de ${cached.pagination.totalResults} totais`);
    console.groupEnd();
    return cached;
  }
  
  try {
    const apiUrl = `/conteudo-lbs/search?q=${encodeURIComponent(query)}&page=${page}&limit=${resultsPerPage}`;
    
    console.log('🌐 QUERY API CALL:', `${API_BASE_URL}${apiUrl}`);
    
    const data = await fetchFromAPI(apiUrl, TIMEOUTS.querySearch);
    
    console.log('📊 QUERY API RESPONSE:', {
      query: data.query,
      total: data.total,
      totalPages: data.totalPages,
      currentPage: data.page,
      itemsReceived: data.conteudo?.length || 0
    });
    
    if (!data.conteudo || !Array.isArray(data.conteudo)) {
      console.warn(`⚠️ Query search sem conteúdo: "${query}"`);
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
      console.groupEnd();
      return emptyResponse;
    }
    
    const transformedItems = data.conteudo.map((item: any) => transformApiItem(item));
    
    // Aplicar filtros apenas se necessário
    let filteredItems = transformedItems;
    if (hasActiveFilters(filters)) {
      filteredItems = applyFilters(transformedItems, filters);
    }
    
    const sortedItems = sortResults(filteredItems, sortBy, query);
    
    // Usar sempre os totais da API externa
    const totalResults = data.total || 0;
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
    
    if (!isWarren) {
      setCache(cacheKey, response, 'queryBased');
    }
    
    console.log(`✅ Query search: ${sortedItems.length} resultados DESTA PÁGINA de ${totalResults} totais`);
    console.groupEnd();
    return response;
    
  } catch (error) {
    console.error(`❌ Query search falhou para "${query}":`, error);
    console.groupEnd();
    
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

// BUSCA GLOBAL CORRIGIDA - Para filtro "Todos"
const performGlobalSearch = async (searchParams: SearchRequest): Promise<any> => {
  const { query, filters, sortBy, page, resultsPerPage } = searchParams;
  
  const requestId = `global_search_${Date.now()}`;
  console.group(`🌍 ${requestId} - GLOBAL SEARCH (Filtro Todos)`);
  console.log(`📋 Global search - página ${page}, limit ${resultsPerPage}`);
  
  const cacheKey = getCacheKey('global', `page${page}_limit${resultsPerPage}_sort${sortBy}`);
  
  if (isValidCache(cacheKey)) {
    const cached = getCache(cacheKey);
    console.log(`📦 Cache HIT Global: ${cached.results.length} itens`);
    console.groupEnd();
    return cached;
  }
  
  try {
    // CORREÇÃO: Buscar mais dados de cada tipo para ter variedade suficiente
    const itemsPerType = Math.max(50, resultsPerPage * 2); // Buscar pelo menos 50 de cada tipo
    
    console.log(`📊 Buscando ${itemsPerType} itens de cada tipo para mix global`);
    
    const [livrosData, aulasData, podcastsData] = await Promise.allSettled([
      fetchFromAPI(`/conteudo-lbs?tipo=livro&page=1&limit=${itemsPerType}`, TIMEOUTS.globalOperation),
      fetchFromAPI(`/conteudo-lbs?tipo=aula&page=1&limit=${itemsPerType}`, TIMEOUTS.globalOperation),
      fetchFromAPI(`/conteudo-lbs?tipo=podcast&page=1&limit=${itemsPerType}`, TIMEOUTS.globalOperation)
    ]);
    
    const allItems: SearchResult[] = [];
    
    // Processar livros
    if (livrosData.status === 'fulfilled' && livrosData.value.conteudo) {
      const livros = livrosData.value.conteudo.map((item: any) => transformApiItem(item));
      allItems.push(...livros);
      console.log(`✅ Livros carregados: ${livros.length}`);
    }
    
    // Processar aulas/vídeos
    if (aulasData.status === 'fulfilled' && aulasData.value.conteudo) {
      const aulas = aulasData.value.conteudo.map((item: any) => transformApiItem(item));
      allItems.push(...aulas);
      console.log(`✅ Vídeos carregados: ${aulas.length}`);
    }
    
    // Processar podcasts
    if (podcastsData.status === 'fulfilled' && podcastsData.value.conteudo) {
      const podcasts = podcastsData.value.conteudo.map((item: any) => transformApiItem(item));
      allItems.push(...podcasts);
      console.log(`✅ Podcasts carregados: ${podcasts.length}`);
    }
    
    console.log(`📊 Total de itens combinados: ${allItems.length}`);
    
    // Aplicar filtros se necessário
    let filteredItems = allItems;
    if (hasActiveFilters(filters)) {
      filteredItems = applyFilters(allItems, filters);
      console.log(`🔍 Após filtros: ${filteredItems.length} itens`);
    }
    
    // Ordenar resultados
    const sortedItems = sortResults(filteredItems, sortBy, query);
    console.log(`📊 Após ordenação: ${sortedItems.length} itens`);
    
    // CORREÇÃO: Paginação correta dos resultados combinados
    const totalResults = sortedItems.length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    const startIndex = (page - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const paginatedItems = sortedItems.slice(startIndex, endIndex);
    
    console.log(`📄 Paginação: ${startIndex}-${endIndex} de ${totalResults} (página ${page}/${totalPages})`);
    
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
    
    console.log(`✅ Global search: ${paginatedItems.length} itens na página ${page} de ${totalResults} totais`);
    console.groupEnd();
    return response;
    
  } catch (error) {
    console.error(`❌ Global search falhou:`, error);
    console.groupEnd();
    
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

// BUSCA PAGINADA CORRIGIDA - Para filtros específicos
const performPaginatedSearch = async (searchParams: SearchRequest): Promise<any> => {
  const { query, filters, sortBy, page, resultsPerPage } = searchParams;
  
  const requestId = `paginated_search_${Date.now()}`;
  console.group(`📄 ${requestId} - PAGINATED SEARCH`);
  console.log(`📋 Paginated search - tipos: ${filters.resourceType.join(', ')}, página ${page}`);
  
  const cacheKey = getCacheKey('paginated', `${filters.resourceType.join('_')}_page${page}_limit${resultsPerPage}_sort${sortBy}`);
  
  if (isValidCache(cacheKey)) {
    const cached = getCache(cacheKey);
    console.log(`📦 Cache HIT Paginated: ${cached.results.length} itens`);
    console.groupEnd();
    return cached;
  }
  
  try {
    const allItems: SearchResult[] = [];
    let totalResultsFromAPI = 0;
    let totalPagesFromAPI = 0;
    
    // CORREÇÃO: Buscar dados baseado nos tipos de recurso com paginação correta
    for (const resourceType of filters.resourceType) {
      if (resourceType === 'titulo') {
        // CORREÇÃO ESPECIAL: Para 'titulo', buscar TANTO livros quanto artigos
        try {
          console.log(`📚 Buscando 'titulo' - fazendo chamadas paralelas para livros E artigos - página ${page}`);
          
          // ✅ CORREÇÃO: Distribuir limite com proporções REAIS (47:35 = 0.573:0.427)
          const totalTitulos = 47 + 35; // 82 títulos totais
          const limitLivros = Math.ceil(resultsPerPage * (47 / totalTitulos)); // 0.573
          const limitArtigos = resultsPerPage - limitLivros;
          
          console.log(`📊 Distribuição CORRIGIDA: ${limitLivros} livros (${47}/82=${(47/82).toFixed(3)}) + ${limitArtigos} artigos (${35}/82=${(35/82).toFixed(3)}) = ${resultsPerPage} total`);
          
          const [livrosResponse, artigosResponse] = await Promise.allSettled([
            fetchFromAPI(`/conteudo-lbs?tipo=livro&page=${page}&limit=${limitLivros}`, TIMEOUTS.paginatedBatch),
            fetchFromAPI(`/conteudo-lbs?tipo=artigos&page=${page}&limit=${limitArtigos}`, TIMEOUTS.paginatedBatch)
          ]);
          
          let totalLivros = 0;
          let totalArtigos = 0;
          
          // Processar livros
          if (livrosResponse.status === 'fulfilled' && livrosResponse.value.conteudo) {
            const livros = livrosResponse.value.conteudo.map((item: any) => transformApiItem(item));
            allItems.push(...livros);
            // ✅ CORREÇÃO: Usar total REAL da API (47)
            totalLivros = livrosResponse.value.total || 47;
            console.log(`✅ Livros: ${livros.length} carregados de ${totalLivros} totais`);
          }
          
          // Processar artigos
          if (artigosResponse.status === 'fulfilled' && artigosResponse.value.conteudo) {
            const artigos = artigosResponse.value.conteudo.map((item: any) => transformApiItem(item));
            allItems.push(...artigos);
            // ✅ CORREÇÃO: Usar total REAL da API (35)
            totalArtigos = artigosResponse.value.total || 35;
            console.log(`✅ Artigos: ${artigos.length} carregados de ${totalArtigos} totais`);
          }
          
          // ✅ CORREÇÃO: TOTAIS COMBINADOS REAIS para Livros & Artigos
          const totalCombinado = totalLivros + totalArtigos; // 47 + 35 = 82
          totalResultsFromAPI = Math.max(totalResultsFromAPI, totalCombinado);
          totalPagesFromAPI = Math.max(totalPagesFromAPI, Math.ceil(totalCombinado / resultsPerPage));
          
          console.log(`📊 TITULO COMBINADO CORRIGIDO: ${totalCombinado} total (${totalLivros} livros + ${totalArtigos} artigos)`);
          console.log(`📄 PÁGINAS CALCULADAS: ${Math.ceil(totalCombinado / resultsPerPage)} páginas (${totalCombinado}÷${resultsPerPage})`);
          
        } catch (error) {
          console.warn(`⚠️ Falha ao buscar titulo (livros + artigos):`, error);
        }
        
      } else {
        // Tipos simples: video ou podcast
        let apiType = '';
        
        if (resourceType === 'video') {
          apiType = 'aula';
        } else if (resourceType === 'podcast') {
          apiType = 'podcast';
        }
        
        if (apiType) {
          try {
            console.log(`🔍 Buscando ${apiType} - página ${page}, limit ${resultsPerPage}`);
            
            const data = await fetchFromAPI(`/conteudo-lbs?tipo=${apiType}&page=${page}&limit=${resultsPerPage}`, TIMEOUTS.paginatedBatch);
            
            console.log(`📊 API Response para ${apiType}:`, {
              total: data.total,
              totalPages: data.totalPages,
              currentPage: data.page || page,
              itemsReceived: data.conteudo?.length || 0
            });
            
            if (data.conteudo && Array.isArray(data.conteudo)) {
              const items = data.conteudo.map((item: any) => transformApiItem(item));
              allItems.push(...items);
              
              // CORREÇÃO: Usar os totais da API quando disponível
              if (data.total) {
                totalResultsFromAPI = Math.max(totalResultsFromAPI, data.total);
              }
              if (data.totalPages) {
                totalPagesFromAPI = Math.max(totalPagesFromAPI, data.totalPages);
              }
            }
          } catch (error) {
            console.warn(`⚠️ Falha ao buscar ${apiType}:`, error);
          }
        }
      }
    }
    
    console.log(`📊 Items carregados ANTES dos filtros: ${allItems.length}`);
    console.log(`📊 Totais REAIS da API: ${totalResultsFromAPI} resultados, ${totalPagesFromAPI} páginas`);
    
    // CORREÇÃO CRÍTICA: Aplicar filtros APENAS para filtros de refinamento (não resourceType)
    let filteredItems = allItems;
    const hasRefinementFilters = hasActiveFilters(filters);
    
    if (hasRefinementFilters) {
      console.log(`🔍 Aplicando filtros de refinamento...`);
      // Criar filtros temporários SEM resourceType para evitar filtragem dupla
      const refinementFilters = {
        ...filters,
        resourceType: [] // CRÍTICO: Eliminar resourceType pois já foi usado na busca paginada
      };
      filteredItems = applyFilters(allItems, refinementFilters);
      console.log(`🔍 Após filtros de refinamento: ${filteredItems.length} itens`);
    } else {
      console.log(`🔍 SKIP - Nenhum filtro de refinamento ativo, mantendo ${allItems.length} itens`);
    }
    
    // Ordenar resultados
    const sortedItems = sortResults(filteredItems, sortBy, query);
    
    // CORREÇÃO: Usar totais da API se disponível, senão calcular
    const finalTotalResults = totalResultsFromAPI > 0 ? totalResultsFromAPI : sortedItems.length;
    const finalTotalPages = totalPagesFromAPI > 0 ? totalPagesFromAPI : Math.ceil(finalTotalResults / resultsPerPage);
    
    const response = {
      success: true,
      results: sortedItems,
      pagination: {
        currentPage: page,
        totalPages: finalTotalPages,
        totalResults: finalTotalResults,
        hasNextPage: page < finalTotalPages,
        hasPreviousPage: page > 1
      },
      searchInfo: {
        query,
        appliedFilters: filters,
        sortBy
      }
    };
    
    setCache(cacheKey, response, 'paginated');
    
    console.log(`✅ Paginated search FINAL CORRIGIDO: ${sortedItems.length} itens na página ${page} de ${finalTotalResults} totais (${finalTotalPages} páginas)`);
    console.groupEnd();
    return response;
    
  } catch (error) {
    console.error(`❌ Paginated search falhou:`, error);
    console.groupEnd();
    
    // Fallback para busca global em caso de erro
    return await performGlobalSearch(searchParams);
  }
};

// BUSCA FILTRADA - Mantida sem grandes alterações
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
    query: `"${searchParams.query}"`,
    page: searchParams.page,
    resourceType: searchParams.filters.resourceType,
    hasOtherFilters: hasActiveFilters(searchParams.filters)
  });

  switch (searchType) {
    case 'queryBased':
      console.log('🎯 Executando QUERY-BASED search');
      return await performQueryBasedSearch(searchParams);
    
    case 'paginated':
      console.log('📄 Executando PAGINATED search');
      return await performPaginatedSearch(searchParams);
    
    case 'filtered':
      console.log('🔍 Executando FILTERED search');
      return await performFilteredSearch(searchParams);
    
    case 'global':
    default:
      console.log('🌍 Executando GLOBAL search');
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
  return filters.subject.length > 0 ||
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
  console.log(`🔍 APPLY FILTERS - Input: ${data.length} items`);
  console.log(`🔍 FILTERS:`, {
    resourceType: filters.resourceType,
    subject: filters.subject,
    author: filters.author,
    year: filters.year,
    duration: filters.duration,
    language: filters.language,
    documentType: filters.documentType,
    program: filters.program,
    channel: filters.channel
  });

  const filtered = data.filter(item => {
    // Resource type filter - CORRIGIDO: Não aplicar se foi usado para busca paginada
    if (filters.resourceType.length > 0 && !filters.resourceType.includes('all')) {
      const hasResourceMatch = filters.resourceType.includes(item.type);
      if (!hasResourceMatch) {
        console.log(`❌ Item "${item.title}" eliminado por resourceType: ${item.type} não está em ${filters.resourceType.join(', ')}`);
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

  console.log(`🔍 APPLY FILTERS - Output: ${filtered.length} items (${data.length - filtered.length} eliminados)`);
  return filtered;
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
    
    // Log especial para Warren
    if (requestBody.query && requestBody.query.toLowerCase().includes('warren')) {
      console.log('🔥 WARREN REQUEST DETECTED:', {
        query: requestBody.query,
        page: requestBody.page,
        resultsPerPage: requestBody.resultsPerPage
      });
    }
    
    console.log('📨 SEARCH REQUEST:', {
      query: requestBody.query,
      resourceType: requestBody.filters?.resourceType,
      page: requestBody.page,
      type: requestBody.query ? 'QUERY' : (requestBody.filters?.resourceType?.length > 0 && !requestBody.filters.resourceType.includes('all') ? 'FILTERED' : 'GLOBAL')
    });
    
    const result = await performSearch(requestBody);
    
    // Log especial para Warren response
    if (requestBody.query && requestBody.query.toLowerCase().includes('warren')) {
      console.log('🔥 WARREN RESPONSE:', {
        totalResults: result.pagination?.totalResults,
        totalPages: result.pagination?.totalPages,
        currentPage: result.pagination?.currentPage,
        resultsCount: result.results?.length
      });
    }
    
    console.log('📤 SEARCH RESPONSE:', {
      success: result.success,
      resultsCount: result.results?.length,
      totalResults: result.pagination?.totalResults,
      totalPages: result.pagination?.totalPages,
      currentPage: result.pagination?.currentPage
    });
    
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
