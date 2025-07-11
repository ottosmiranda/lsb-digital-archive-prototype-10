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
  healthCheck: 3000,
  querySearch: 15000 // ✅ NOVO: Timeout para busca por query
};

// ESTRATÉGIAS DE CACHE INTELIGENTE
const CACHE_STRATEGIES = {
  paginated: { ttl: 10 * 60 * 1000, prefix: 'paginated' }, // 10 min para páginas específicas
  global: { ttl: 15 * 60 * 1000, prefix: 'global' },       // 15 min para busca "Todos"
  filtered: { ttl: 2 * 60 * 1000, prefix: 'filtered' },    // 2 min para buscas filtradas
  queryBased: { ttl: 5 * 60 * 1000, prefix: 'query' }      // ✅ NOVO: 5 min para busca por query
};

type SearchType = 'paginated' | 'global' | 'filtered' | 'queryBased'; // ✅ NOVO: Tipo de busca por query

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

// ✅ ATUALIZADO: DETECTOR DE TIPO DE BUSCA - AGORA INCLUI QUERY-BASED
const detectSearchType = (query: string, filters: SearchFilters): SearchType => {
  const hasQuery = query && query.trim() !== '';
  const hasResourceTypeFilters = filters.resourceType.length > 0 && !filters.resourceType.includes('all');
  
  // ✅ CRÍTICO: documentType removido de hasOtherFilters - será tratado como paginação
  const hasOtherFilters = filters.subject.length > 0 || filters.author.length > 0 || 
                          filters.year || filters.duration || filters.language.length > 0 ||
                          filters.program.length > 0 || 
                          filters.channel.length > 0;

  console.log('🔍 DETECTOR ATUALIZADO:', { 
    hasQuery, 
    hasResourceTypeFilters, 
    hasOtherFilters, 
    documentType: filters.documentType,
    resultado: hasQuery ? 'queryBased' : hasOtherFilters ? 'filtered' : hasResourceTypeFilters ? 'paginated' : 'global'
  });

  // ✅ NOVA PRIORIDADE: Busca por query tem precedência máxima
  if (hasQuery) {
    return 'queryBased';
  }

  // Busca global: filtro "Todos" ou sem filtros específicos
  if (filters.resourceType.includes('all') || (!hasResourceTypeFilters && !hasOtherFilters)) {
    return 'global';
  }
  
  // Busca filtrada: outros filtros além do tipo de recurso
  if (hasOtherFilters) {
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

// ✅ NOVA FUNÇÃO: BUSCA POR QUERY USANDO O NOVO ENDPOINT
const performQueryBasedSearch = async (
  searchParams: SearchRequest
): Promise<any> => {
  const { query, filters, sortBy, page, resultsPerPage } = searchParams;
  
  console.log(`🔍 Busca Query-Based: "${query}", página ${page}`);
  
  const cacheKey = getCacheKey('queryBased', `${query}_page${page}_limit${resultsPerPage}`);
  
  if (isValidCache(cacheKey)) {
    const cached = getCache(cacheKey);
    console.log(`📦 Cache HIT Query: ${cached.results.length} itens`);
    return cached;
  }
  
  try {
    const url = `${API_BASE_URL}/conteudo-lbs/search?q=${encodeURIComponent(query)}&page=${page}&limit=${resultsPerPage}`;
    
    console.log(`🌐 Query API URL: ${url}`);
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Query search timeout for "${query}"`)), TIMEOUTS.querySearch);
    });
    
    const fetchPromise = fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LSB-Query-Search/1.0'
      }
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} para query search: ${query}`);
    }

    const data = await response.json();
    
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
    
    // Transformar dados do novo endpoint para o formato atual
    const transformedItems = data.conteudo.map((item: any) => transformFromQueryEndpoint(item));
    
    // Aplicar filtros adicionais se necessário
    let filteredItems = transformedItems;
    if (hasActiveFilters(filters)) {
      filteredItems = applyFilters(transformedItems, filters);
    }
    
    // Aplicar ordenação
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
    
    // Fallback para busca filtrada se query falhar
    console.log(`🔄 Fallback para busca filtrada...`);
    return await performFilteredSearch(searchParams);
  }
};

// ✅ NOVA FUNÇÃO: Transformar dados do endpoint de query para formato padrão
const transformFromQueryEndpoint = (item: any): SearchResult => {
  console.log(`🔄 Query Transform: ${item.tipo}`, {
    titulo: item.titulo || item.episodio_titulo,
    tipo: item.tipo
  });
  
  const realId = String(item.id || item.episodio_id || item.podcast_id || Math.floor(Math.random() * 10000) + 1000);
  
  let subjectForBadge: string;
  
  if (item.tipo === 'podcast') {
    subjectForBadge = getSubjectFromCategories(item.categorias) || 'Podcast';
  } else {
    subjectForBadge = getSubjectFromCategories(item.categorias) || 
                     (item.categoria ? item.categoria : '') || 
                     getSubject(item.tipo);
  }
  
  // Extrair ano
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

// ✅ FUNÇÃO PRINCIPAL: Coordenador de busca
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

// ✅ FUNÇÃO: Busca filtrada - fallback para busca global
const performFilteredSearch = async (searchParams: SearchRequest): Promise<any> => {
  console.log('🔍 Filtered search - usando fallback para global...');
  return await performGlobalSearch(searchParams);
};

// ✅ FUNÇÃO: Busca paginada - fallback para busca global  
const performPaginatedSearch = async (searchParams: SearchRequest): Promise<any> => {
  console.log('📄 Paginated search - usando fallback para global...');
  return await performGlobalSearch(searchParams);
};

// ✅ FUNÇÃO: Busca global - retorna resposta vazia estruturada
const performGlobalSearch = async (searchParams: SearchRequest): Promise<any> => {
  console.log('🌍 Global search - retornando resposta vazia estruturada...');
  
  const { query, filters, sortBy, page, resultsPerPage } = searchParams;
  
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

// ✅ FUNÇÃO: Mapear categorias para subjects
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

// ✅ FUNÇÃO: Determinar subject baseado no tipo
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

// ✅ NOVA FUNÇÃO: Helper para verificar se há filtros ativos
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

// ✅ NOVA FUNÇÃO: Formatar duração de segundos
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
    console.log('📨 QUERY-BASED INTEGRATION - Nova busca:', requestBody);
    
    const result = await performSearch(requestBody);
    
    // LOG para busca por query
    if (result.results && result.results.length > 0 && requestBody.query) {
      console.log('🔍 QUERY SEARCH RESULTS:', {
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
    console.error('❌ Erro na busca com query integration:', error);
    
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
