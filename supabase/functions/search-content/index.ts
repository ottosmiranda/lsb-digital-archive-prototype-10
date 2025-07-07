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

// CONFIGURAÇÃO DE ALTA ESCALABILIDADE
const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos para alta performance
const globalCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// CONFIGURAÇÃO DINÂMICA DE LIMITES ESCALÁVEIS
const SCALABLE_LIMITS = {
  podcast: {
    maxItems: parseInt(Deno.env.get('PODCAST_MAX_ITEMS') || '1500'), // 60% de 2512
    percentage: 0.6, // Buscar 60% do total disponível
    chunkSize: 50,
    maxConcurrency: 5
  },
  aula: {
    maxItems: parseInt(Deno.env.get('VIDEO_MAX_ITEMS') || '300'), // 100% dos vídeos
    percentage: 1.0, // Buscar todos os vídeos disponíveis
    chunkSize: 50,
    maxConcurrency: 4
  },
  livro: {
    maxItems: parseInt(Deno.env.get('BOOK_MAX_ITEMS') || '50'), // Todos os livros
    percentage: 1.0, // Buscar todos os livros disponíveis
    chunkSize: 25,
    maxConcurrency: 2
  }
};

// TIMEOUTS OTIMIZADOS PARA ALTA ESCALABILIDADE
const TIMEOUTS = {
  singleRequest: 8000, // 8s por requisição individual
  chunkParallel: 12000, // 12s para chunks paralelos
  totalOperation: 45000, // 45s para operação completa
  healthCheck: 3000 // 3s para health check
};

// Cache helpers com validação aprimorada para alta escalabilidade
const getCacheKey = (key: string): string => `scalable_search_${key}`;

const isValidCache = (cacheKey: string): boolean => {
  const cached = globalCache.get(cacheKey);
  if (!cached) return false;
  
  const isValid = (Date.now() - cached.timestamp) < cached.ttl;
  
  // VALIDAÇÃO CRÍTICA: Não usar cache corrompido
  if (isValid && Array.isArray(cached.data) && cached.data.length === 0) {
    console.warn(`🚨 Cache corrompido detectado: ${cacheKey}`);
    globalCache.delete(cacheKey);
    return false;
  }
  
  return isValid;
};

const setCache = (cacheKey: string, data: any, ttl: number = CACHE_TTL): void => {
  // Cache apenas resultados significativos
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

// FUNÇÃO ESCALÁVEL PARA DESCOBRIR TOTAL DISPONÍVEL NA API
const discoverTotalContent = async (tipo: string): Promise<number> => {
  const cacheKey = getCacheKey(`total_${tipo}`);
  
  if (isValidCache(cacheKey)) {
    const cached = getCache(cacheKey);
    console.log(`📊 Total ${tipo} (cache): ${cached}`);
    return cached;
  }

  try {
    console.log(`🔍 Descobrindo total de ${tipo}...`);
    const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=1&limit=1`;
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout descobrindo total ${tipo}`)), TIMEOUTS.singleRequest);
    });
    
    const fetchPromise = fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'LSB-Scalable-Search/2.0'
      }
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const total = data.total || 0;
    
    // Cache do total por 30 minutos
    setCache(cacheKey, total, 30 * 60 * 1000);
    
    console.log(`📊 Total ${tipo} descoberto: ${total}`);
    return total;
    
  } catch (error) {
    console.error(`❌ Erro descobrindo total ${tipo}:`, error);
    // Retornar estimativa baseada na configuração
    const config = SCALABLE_LIMITS[tipo as keyof typeof SCALABLE_LIMITS];
    return config ? Math.ceil(config.maxItems / config.percentage) : 100;
  }
};

// FUNÇÃO DE AUTO-SCALING INTELIGENTE
const calculateOptimalLimit = async (tipo: string): Promise<number> => {
  const config = SCALABLE_LIMITS[tipo as keyof typeof SCALABLE_LIMITS];
  if (!config) return 50;

  try {
    const totalAvailable = await discoverTotalContent(tipo);
    const calculatedLimit = Math.min(
      Math.ceil(totalAvailable * config.percentage),
      config.maxItems
    );
    
    console.log(`🎯 Auto-scaling ${tipo}: ${calculatedLimit} de ${totalAvailable} (${Math.round(config.percentage * 100)}%)`);
    return calculatedLimit;
    
  } catch (error) {
    console.error(`❌ Erro no auto-scaling ${tipo}:`, error);
    return config.maxItems;
  }
};

// BUSCA PARALELA POR CHUNKS - ALTA PERFORMANCE
const fetchContentTypeScalable = async (tipo: string, targetLimit: number): Promise<SearchResult[]> => {
  const config = SCALABLE_LIMITS[tipo as keyof typeof SCALABLE_LIMITS];
  if (!config) return [];

  const allItems: SearchResult[] = [];
  const chunkSize = config.chunkSize;
  const totalChunks = Math.ceil(targetLimit / chunkSize);
  const maxConcurrency = config.maxConcurrency;
  
  console.log(`🚀 Busca escalável ${tipo}: ${totalChunks} chunks de ${chunkSize} itens (concorrência: ${maxConcurrency})`);

  // Processar chunks em batches paralelos
  for (let batchStart = 0; batchStart < totalChunks; batchStart += maxConcurrency) {
    const batchEnd = Math.min(batchStart + maxConcurrency, totalChunks);
    const chunkPromises: Promise<SearchResult[]>[] = [];
    
    // Criar promises para o batch atual
    for (let chunkIndex = batchStart; chunkIndex < batchEnd; chunkIndex++) {
      const page = chunkIndex + 1;
      const chunkPromise = fetchSingleChunk(tipo, page, chunkSize);
      chunkPromises.push(chunkPromise);
    }
    
    console.log(`📦 Processando batch ${Math.ceil(batchStart / maxConcurrency) + 1}: chunks ${batchStart + 1}-${batchEnd}`);
    
    try {
      // Timeout para todo o batch
      const batchTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Batch timeout ${tipo}`)), TIMEOUTS.chunkParallel);
      });
      
      const batchResults = await Promise.race([
        Promise.allSettled(chunkPromises),
        batchTimeoutPromise
      ]);
      
      // Processar resultados do batch
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allItems.push(...result.value);
          console.log(`✅ Chunk ${batchStart + index + 1}: ${result.value.length} itens`);
        } else {
          console.error(`❌ Chunk ${batchStart + index + 1} falhou:`, result.reason?.message);
        }
      });
      
      // Verificar se já temos itens suficientes
      if (allItems.length >= targetLimit) {
        console.log(`🎯 Limite atingido: ${allItems.length}/${targetLimit} itens`);
        break;
      }
      
      // Pausa entre batches para não sobrecarregar a API
      if (batchEnd < totalChunks) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error(`❌ Erro no batch ${batchStart}-${batchEnd}:`, error);
      // Continuar com próximo batch mesmo se este falhar
    }
  }

  const finalItems = allItems.slice(0, targetLimit);
  console.log(`✅ Busca escalável ${tipo} concluída: ${finalItems.length} itens`);
  
  return finalItems;
};

// BUSCA DE UM CHUNK INDIVIDUAL
const fetchSingleChunk = async (tipo: string, page: number, limit: number): Promise<SearchResult[]> => {
  const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${page}&limit=${limit}`;
  
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Chunk timeout ${tipo} page ${page}`)), TIMEOUTS.singleRequest);
    });
    
    const fetchPromise = fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'LSB-Scalable-Search/2.0'
      }
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${tipo} page ${page}`);
    }

    const data = await response.json();
    const items = data.conteudo || [];
    
    if (items.length === 0) {
      console.log(`📄 Fim dos dados ${tipo} na página ${page}`);
      return [];
    }

    const transformedItems = items.map((item: any) => transformToSearchResult(item, tipo));
    return transformedItems;
    
  } catch (error) {
    console.error(`❌ Erro chunk ${tipo} page ${page}:`, error);
    return [];
  }
};

// FUNÇÃO PRINCIPAL ESCALÁVEL PARA BUSCAR TODO CONTEÚDO
const fetchAllContentScalable = async (): Promise<SearchResult[]> => {
  const cacheKey = getCacheKey('global_scalable_content');
  
  if (isValidCache(cacheKey)) {
    const cached = getCache(cacheKey);
    console.log(`📦 Cache HIT: Conteúdo global escalável (${cached.length} itens)`);
    return cached;
  }

  console.log('🌐 Iniciando busca escalável de TODOS os conteúdos...');
  const startTime = Date.now();
  
  try {
    // Timeout global para toda a operação
    const globalTimeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout global da busca escalável')), TIMEOUTS.totalOperation);
    });
    
    const searchPromise = performScalableSearch();
    const allContent = await Promise.race([searchPromise, globalTimeoutPromise]);
    
    if (allContent.length === 0) {
      console.warn('⚠️ Nenhum conteúdo escalável carregado, usando fallback...');
      return await fetchAllFromSupabaseFallback();
    }

    // Cache o resultado por tempo otimizado
    setCache(cacheKey, allContent, CACHE_TTL);
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`✅ Busca escalável concluída em ${duration}s: ${allContent.length} itens totais`);
    return allContent;
    
  } catch (error) {
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.error(`❌ Erro na busca escalável após ${duration}s:`, error);
    return await fetchAllFromSupabaseFallback();
  }
};

// EXECUTAR BUSCA ESCALÁVEL PARALELA
const performScalableSearch = async (): Promise<SearchResult[]> => {
  console.log('🎯 Executando auto-scaling para descobrir limites ótimos...');
  
  // Descobrir limites ótimos para cada tipo
  const [podcastLimit, aulaLimit, livroLimit] = await Promise.allSettled([
    calculateOptimalLimit('podcast'),
    calculateOptimalLimit('aula'),
    calculateOptimalLimit('livro')
  ]);

  const limits = {
    podcast: podcastLimit.status === 'fulfilled' ? podcastLimit.value : SCALABLE_LIMITS.podcast.maxItems,
    aula: aulaLimit.status === 'fulfilled' ? aulaLimit.value : SCALABLE_LIMITS.aula.maxItems,
    livro: livroLimit.status === 'fulfilled' ? livroLimit.value : SCALABLE_LIMITS.livro.maxItems
  };

  console.log('📊 Limites calculados:', limits);
  
  // Executar buscas paralelas com limites otimizados
  const searchPromises = [
    fetchContentTypeScalable('podcast', limits.podcast),
    fetchContentTypeScalable('aula', limits.aula),
    fetchContentTypeScalable('livro', limits.livro)
  ];

  const results = await Promise.allSettled(searchPromises);
  const allContent: SearchResult[] = [];

  results.forEach((result, index) => {
    const contentType = ['podcast', 'aula', 'livro'][index];
    if (result.status === 'fulfilled') {
      allContent.push(...result.value);
      console.log(`✅ ${contentType}: ${result.value.length} itens carregados`);
    } else {
      console.error(`❌ Falha ${contentType}:`, result.reason?.message);
    }
  });

  return allContent;
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

const fetchFromSupabaseFallback = async (tipo: string): Promise<SearchResult[]> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    let functionName: string;
    switch (tipo) {
      case 'livro': functionName = 'fetch-books'; break;
      case 'aula': functionName = 'fetch-videos'; break;
      case 'podcast': functionName = 'fetch-podcasts'; break;
      default: return [];
    }
    
    const { data, error } = await supabase.functions.invoke(functionName);
    
    if (error || !data.success) {
      console.error(`❌ Supabase ${functionName} error:`, error || data.error);
      return [];
    }
    
    const items = tipo === 'livro' ? data.books : tipo === 'aula' ? data.videos : data.podcasts;
    return items || [];
    
  } catch (error) {
    console.error(`❌ Supabase fallback failed for ${tipo}:`, error);
    return [];
  }
};

// Verificação se é busca global
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

// FUNÇÃO PRINCIPAL DE BUSCA COM SISTEMA ESCALÁVEL
const performSearch = async (searchParams: SearchRequest): Promise<any> => {
  const { query, filters, sortBy, page, resultsPerPage } = searchParams;
  const requestId = `scalable_search_${Date.now()}`;
  
  console.group(`🔍 ${requestId} - BUSCA ESCALÁVEL`);
  console.log('📋 Parâmetros:', { query: query || '(vazio)', filters, sortBy, page, resultsPerPage });
  console.log('🌐 Busca global:', isGlobalSearch(filters));

  try {
    let allData: SearchResult[] = [];

    if (isGlobalSearch(filters)) {
      console.log('🌐 BUSCA GLOBAL ESCALÁVEL - carregando todo conteúdo');
      allData = await fetchAllContentScalable();
      
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
      // Busca específica escalável por tipo
      const activeTypes = filters.resourceType.filter(type => type !== 'all');
      console.log('🎯 Busca específica escalável para tipos:', activeTypes);
      
      if (activeTypes.length > 0) {
        const typePromises = activeTypes.map(async type => {
          const apiType = type === 'titulo' ? 'livro' : type === 'video' ? 'aula' : 'podcast';
          const targetLimit = await calculateOptimalLimit(apiType);
          return fetchContentTypeScalable(apiType, targetLimit);
        });
        
        const typeResults = await Promise.allSettled(typePromises);
        typeResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            allData.push(...result.value);
            console.log(`✅ Tipo ${activeTypes[index]}: ${result.value.length} itens`);
          } else {
            console.error(`❌ Tipo ${activeTypes[index]} falhou:`, result.reason);
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
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    const startIndex = (page - 1) * resultsPerPage;
    const paginatedResults = filteredData.slice(startIndex, startIndex + resultsPerPage);

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

    console.log(`✅ Busca escalável concluída:`, {
      totalEncontrado: totalResults,
      retornado: paginatedResults.length,
      pagina: `${page}/${totalPages}`
    });
    
    console.groupEnd();
    return response;

  } catch (error) {
    console.error(`❌ Busca escalável falhou:`, error);
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
    console.log('📨 Requisição de busca escalável recebida:', requestBody);
    
    const result = await performSearch(requestBody);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error('❌ Erro no handler escalável:', error);
    
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
