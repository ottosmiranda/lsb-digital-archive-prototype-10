
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

// API Configuration
const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos para cache por página
const GLOBAL_CACHE_TTL = 15 * 60 * 1000; // 15 minutos para cache global

// Timeouts otimizados
const TIMEOUTS = {
  singleRequest: 8000,
  globalSearch: 30000
};

// Cache global
const globalCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cache helpers
const getCacheKey = (key: string): string => `search_${key}`;

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

// BUSCA PAGINADA OTIMIZADA - Usar paginação real da API
const fetchContentPaginated = async (tipo: string, page: number, limit: number): Promise<SearchResult[]> => {
  const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${page}&limit=${limit}`;
  
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout ${tipo} page ${page}`)), TIMEOUTS.singleRequest);
    });
    
    const fetchPromise = fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'LSB-Paginated-Search/1.0'
      }
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${tipo} page ${page}`);
    }

    const data = await response.json();
    const items = data.conteudo || [];
    
    const transformedItems = items.map((item: any) => transformToSearchResult(item, tipo));
    return transformedItems;
    
  } catch (error) {
    console.error(`❌ Erro busca paginada ${tipo} page ${page}:`, error);
    return [];
  }
};

// BUSCA GLOBAL OTIMIZADA - Para filtro "Todos" apenas
const fetchAllContentOptimized = async (): Promise<SearchResult[]> => {
  const cacheKey = getCacheKey('global_all_content');
  
  if (isValidCache(cacheKey)) {
    const cached = getCache(cacheKey);
    console.log(`📦 Cache HIT: Conteúdo global (${cached.length} itens)`);
    return cached;
  }

  console.log('🌐 Carregando conteúdo global otimizado...');
  const startTime = Date.now();
  
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout global search')), TIMEOUTS.globalSearch);
    });
    
    const searchPromise = performOptimizedGlobalSearch();
    const allContent = await Promise.race([searchPromise, timeoutPromise]);
    
    if (allContent.length === 0) {
      console.warn('⚠️ Nenhum conteúdo global carregado, usando fallback...');
      return await fetchAllFromSupabaseFallback();
    }

    // Cache global por 15 minutos
    setCache(cacheKey, allContent, GLOBAL_CACHE_TTL);
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`✅ Busca global concluída em ${duration}s: ${allContent.length} itens totais`);
    return allContent;
    
  } catch (error) {
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.error(`❌ Erro na busca global após ${duration}s:`, error);
    return await fetchAllFromSupabaseFallback();
  }
};

// BUSCA GLOBAL OTIMIZADA - Carrega quantidade limitada de cada tipo
const performOptimizedGlobalSearch = async (): Promise<SearchResult[]> => {
  console.log('🎯 Executando busca global otimizada...');
  
  // Limites otimizados para busca global
  const globalLimits = {
    podcast: 50, // Primeiras 50 páginas = ~2500 podcasts
    aula: 6,     // Primeiras 6 páginas = ~300 vídeos  
    livro: 2     // Primeiras 2 páginas = ~30 livros
  };

  const searchPromises = [
    fetchMultiplePages('podcast', globalLimits.podcast),
    fetchMultiplePages('aula', globalLimits.aula),
    fetchMultiplePages('livro', globalLimits.livro)
  ];

  const results = await Promise.allSettled(searchPromises);
  const allContent: SearchResult[] = [];

  results.forEach((result, index) => {
    const contentType = ['podcast', 'aula', 'livro'][index];
    if (result.status === 'fulfilled') {
      allContent.push(...result.value);
      console.log(`✅ Global ${contentType}: ${result.value.length} itens carregados`);
    } else {
      console.error(`❌ Falha global ${contentType}:`, result.reason?.message);
    }
  });

  return allContent;
};

// Buscar múltiplas páginas em paralelo
const fetchMultiplePages = async (tipo: string, maxPages: number): Promise<SearchResult[]> => {
  const allItems: SearchResult[] = [];
  const chunkSize = 50; // Itens por página
  
  // Buscar páginas em paralelo (máximo 3 por vez para não sobrecarregar)
  for (let batch = 0; batch < maxPages; batch += 3) {
    const batchEnd = Math.min(batch + 3, maxPages);
    const pagePromises: Promise<SearchResult[]>[] = [];
    
    for (let page = batch + 1; page <= batchEnd; page++) {
      pagePromises.push(fetchContentPaginated(tipo, page, chunkSize));
    }
    
    const batchResults = await Promise.allSettled(pagePromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
      } else {
        console.error(`❌ Erro página ${batch + index + 1} de ${tipo}:`, result.reason);
      }
    });
    
    // Pausa entre batches
    if (batchEnd < maxPages) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return allItems;
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

// Verifica se é busca global (filtro "Todos")
const isGlobalSearch = (filters: SearchFilters): boolean => {
  return filters.resourceType.includes('all') || 
         (filters.resourceType.length === 0 && 
          filters.subject.length === 0 &&
          filters.author.length === 0 &&
          !filters.year &&
          !filters.duration &&
          filters.language.length === 0 &&
          filters.documentType.length === 0 &&
          filters.program.length === 0 &&
          filters.channel.length === 0);
};

// FUNÇÃO PRINCIPAL DE BUSCA COM PAGINAÇÃO REAL
const performSearch = async (searchParams: SearchRequest): Promise<any> => {
  const { query, filters, sortBy, page, resultsPerPage } = searchParams;
  const requestId = `search_${Date.now()}`;
  
  console.group(`🔍 ${requestId} - Busca com paginação real`);
  console.log('📋 Parâmetros:', { query: query || '(vazio)', filters, sortBy, page, resultsPerPage });

  try {
    let allData: SearchResult[] = [];

    if (isGlobalSearch(filters)) {
      // BUSCA GLOBAL: Cache global + paginação frontend
      console.log('🌐 BUSCA GLOBAL - usando cache global + paginação frontend');
      allData = await fetchAllContentOptimized();
      
      if (allData.length === 0) {
        console.warn('⚠️ Nenhum conteúdo global disponível');
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
          searchInfo: { query, appliedFilters: filters, sortBy }
        };
      }
    } else {
      // BUSCA ESPECÍFICA: Paginação real da API
      const activeTypes = filters.resourceType.filter(type => type !== 'all');
      console.log('🎯 Busca específica com paginação real para tipos:', activeTypes);
      
      if (activeTypes.length > 0) {
        const typePromises = activeTypes.map(async type => {
          const apiType = type === 'titulo' ? 'livro' : type === 'video' ? 'aula' : 'podcast';
          
          // Cache por página específica
          const cacheKey = getCacheKey(`${apiType}_page_${page}_limit_${resultsPerPage}`);
          
          if (isValidCache(cacheKey)) {
            const cached = getCache(cacheKey);
            console.log(`📦 Cache HIT: ${apiType} página ${page} (${cached.length} itens)`);
            return cached;
          }
          
          const result = await fetchContentPaginated(apiType, page, resultsPerPage);
          
          // Cache apenas se há resultados
          if (result.length > 0) {
            setCache(cacheKey, result, CACHE_TTL);
          }
          
          return result;
        });
        
        const typeResults = await Promise.allSettled(typePromises);
        typeResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            allData.push(...result.value);
            console.log(`✅ Paginação real tipo ${activeTypes[index]}: ${result.value.length} itens`);
          } else {
            console.error(`❌ Paginação real tipo ${activeTypes[index]} falhou:`, result.reason);
          }
        });
      }
    }

    // Aplicar filtros
    let filteredData = allData;
    
    if (query && query.trim()) {
      const queryLower = query.toLowerCase();
      filteredData = filteredData.filter(item => {
        const searchText = `${item.title} ${item.author} ${item.description}`.toLowerCase();
        return searchText.includes(queryLower);
      });
      console.log(`🔍 Filtro de query aplicado: ${filteredData.length} resultados`);
    }

    filteredData = applyFilters(filteredData, filters);
    console.log(`🔧 Todos os filtros aplicados: ${filteredData.length} resultados`);

    // Ordenar
    filteredData = sortResults(filteredData, sortBy, query);
    console.log(`📊 Ordenado por ${sortBy}: ${filteredData.length} resultados`);

    // Paginação
    const totalResults = filteredData.length;
    let totalPages: number;
    let paginatedResults: SearchResult[];
    
    if (isGlobalSearch(filters)) {
      // Para busca global, fazer paginação frontend
      totalPages = Math.ceil(totalResults / resultsPerPage);
      const startIndex = (page - 1) * resultsPerPage;
      paginatedResults = filteredData.slice(startIndex, startIndex + resultsPerPage);
    } else {
      // Para busca específica, os resultados já vêm paginados da API
      totalPages = Math.ceil(totalResults / resultsPerPage);
      paginatedResults = filteredData;
    }

    const response = {
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

    console.log(`✅ Busca com paginação concluída:`, {
      totalEncontrado: totalResults,
      retornado: paginatedResults.length,
      pagina: `${page}/${totalPages}`,
      estrategia: isGlobalSearch(filters) ? '🌐 GLOBAL' : '🎯 PAGINADA'
    });
    
    console.groupEnd();
    return response;

  } catch (error) {
    console.error(`❌ Busca com paginação falhou:`, error);
    console.groupEnd();
    
    return {
      success: false,
      error: error.message,
      results: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalResults: 0,
        hasNextPage: false,
        hasPreviousPage: false
      },
      searchInfo: { query, appliedFilters: filters, sortBy }
    };
  }
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
    console.log('📨 Requisição de busca com paginação real recebida:', requestBody);
    
    const result = await performSearch(requestBody);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error('❌ Erro no handler com paginação real:', error);
    
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
