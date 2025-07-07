
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

const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const globalCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Função para verificar se filtro "all" está ativo
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

// Cache helpers
const getCacheKey = (key: string): string => `search_${key}`;

const isValidCache = (cacheKey: string): boolean => {
  const cached = globalCache.get(cacheKey);
  if (!cached) return false;
  return (Date.now() - cached.timestamp) < cached.ttl;
};

const setCache = (cacheKey: string, data: any, ttl: number = CACHE_TTL): void => {
  globalCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

const getCache = (cacheKey: string): any => {
  const cached = globalCache.get(cacheKey);
  return cached?.data || null;
};

// Função otimizada para buscar todo conteúdo com paginação inteligente
const fetchAllContentForGlobalSorting = async (): Promise<SearchResult[]> => {
  const cacheKey = getCacheKey('global_content');
  
  // Verificar cache primeiro
  if (isValidCache(cacheKey)) {
    console.log('📦 Cache HIT: Returning cached global content');
    return getCache(cacheKey);
  }

  console.log('🌐 Fetching ALL content with optimized pagination...');
  
  try {
    // Buscar com paginação otimizada em paralelo
    const fetchPromises = [
      fetchContentType('livro', 100), // Buscar até 100 livros
      fetchContentType('aula', 100),  // Buscar até 100 aulas
      fetchContentType('podcast', 100) // Buscar até 100 podcasts
    ];

    const results = await Promise.allSettled(fetchPromises);
    
    const allContent: SearchResult[] = [];
    
    // Processar resultados
    results.forEach((result, index) => {
      const contentType = ['livro', 'aula', 'podcast'][index];
      if (result.status === 'fulfilled') {
        allContent.push(...result.value);
        console.log(`✅ ${contentType}: ${result.value.length} items loaded`);
      } else {
        console.error(`❌ Failed to load ${contentType}:`, result.reason);
      }
    });

    if (allContent.length === 0) {
      console.warn('⚠️ No content loaded from API, trying Supabase fallback...');
      return await fetchAllFromSupabaseFallback();
    }

    // Cache o resultado por 5 minutos
    setCache(cacheKey, allContent, CACHE_TTL);
    
    console.log(`✅ Global content loaded: ${allContent.length} total items`);
    return allContent;
    
  } catch (error) {
    console.error('❌ Error in fetchAllContentForGlobalSorting:', error);
    return await fetchAllFromSupabaseFallback();
  }
};

// Função para buscar um tipo de conteúdo com paginação inteligente
const fetchContentType = async (tipo: string, maxItems: number = 100): Promise<SearchResult[]> => {
  const allItems: SearchResult[] = [];
  let page = 1;
  const limit = 10; // API limita a 10 por página
  
  try {
    while (allItems.length < maxItems) {
      const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${page}&limit=${limit}`;
      
      console.log(`📡 Fetching ${tipo} page ${page}...`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const items = data.conteudo || [];
      
      if (items.length === 0) {
        console.log(`📄 No more ${tipo} items available (page ${page})`);
        break;
      }

      // Transformar items para SearchResult
      const transformedItems = items.map((item: any) => transformToSearchResult(item, tipo));
      allItems.push(...transformedItems);
      
      console.log(`📦 ${tipo} page ${page}: ${items.length} items (total: ${allItems.length})`);
      
      // Se retornou menos que o limite, chegamos ao fim
      if (items.length < limit) {
        break;
      }
      
      page++;
      
      // Pequena pausa para não sobrecarregar API
      if (page > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
  } catch (error) {
    console.error(`❌ Error fetching ${tipo}:`, error);
    // Tentar fallback do Supabase para este tipo específico
    return await fetchFromSupabaseFallback(tipo);
  }
  
  return allItems.slice(0, maxItems); // Garantir que não excede o máximo
};

// Fallback para Supabase (mantido do código original)
const fetchAllFromSupabaseFallback = async (): Promise<SearchResult[]> => {
  console.log('🔄 Using Supabase fallback for global content...');
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const [booksResult, videosResult, podcastsResult] = await Promise.allSettled([
      supabase.functions.invoke('fetch-books'),
      supabase.functions.invoke('fetch-videos'),
      supabase.functions.invoke('fetch-podcasts')
    ]);

    const allContent: SearchResult[] = [];

    if (booksResult.status === 'fulfilled' && booksResult.value.data?.success) {
      allContent.push(...(booksResult.value.data.books || []).slice(0, 50));
    }
    if (videosResult.status === 'fulfilled' && videosResult.value.data?.success) {
      allContent.push(...(videosResult.value.data.videos || []).slice(0, 50));
    }
    if (podcastsResult.status === 'fulfilled' && podcastsResult.value.data?.success) {
      allContent.push(...(podcastsResult.value.data.podcasts || []).slice(0, 50));
    }

    console.log(`✅ Supabase fallback loaded: ${allContent.length} items`);
    return allContent;
    
  } catch (error) {
    console.error('❌ Supabase fallback failed:', error);
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

// Função para transformar item da API em SearchResult
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

// Função principal de busca
const performSearch = async (searchParams: SearchRequest): Promise<any> => {
  const { query, filters, sortBy, page, resultsPerPage } = searchParams;
  
  console.log('🔍 Search request:', {
    query: query || '(empty)',
    filters,
    sortBy,
    page,
    isGlobal: isGlobalSearch(filters)
  });

  try {
    let allData: SearchResult[] = [];

    // CORRIGIDO: Detectar busca global (filtro "Todos")
    if (isGlobalSearch(filters)) {
      console.log('🌐 GLOBAL SEARCH detected - fetching ALL content');
      allData = await fetchAllContentForGlobalSorting();
      
      if (allData.length === 0) {
        console.warn('⚠️ No global content available');
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
      
      console.log(`✅ Global search: ${allData.length} total items available`);
    } else {
      // Busca específica por tipo de conteúdo
      const activeTypes = filters.resourceType.filter(type => type !== 'all');
      if (activeTypes.length > 0) {
        const typePromises = activeTypes.map(type => {
          const apiType = type === 'titulo' ? 'livro' : type === 'video' ? 'aula' : 'podcast';
          return fetchContentType(apiType, 50); // Limitar para performance
        });
        
        const typeResults = await Promise.allSettled(typePromises);
        typeResults.forEach(result => {
          if (result.status === 'fulfilled') {
            allData.push(...result.value);
          }
        });
      }
    }

    // Aplicar filtros se necessário
    let filteredData = allData;
    
    // Filtrar por query se fornecida
    if (query && query.trim()) {
      const queryLower = query.toLowerCase();
      filteredData = filteredData.filter(item => {
        const searchText = `${item.title} ${item.author} ${item.description}`.toLowerCase();
        return searchText.includes(queryLower);
      });
    }

    // Aplicar outros filtros
    filteredData = applyFilters(filteredData, filters);

    // Ordenar resultados
    filteredData = sortResults(filteredData, sortBy, query);

    // Paginação
    const totalResults = filteredData.length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    const startIndex = (page - 1) * resultsPerPage;
    const paginatedResults = filteredData.slice(startIndex, startIndex + resultsPerPage);

    console.log(`✅ Search completed: ${paginatedResults.length}/${totalResults} results (page ${page}/${totalPages})`);

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

  } catch (error) {
    console.error('❌ Search failed:', error);
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
      }
    };
  }
};

// Função para aplicar filtros
const applyFilters = (data: SearchResult[], filters: SearchFilters): SearchResult[] => {
  return data.filter(item => {
    // Subject filter
    if (filters.subject.length > 0) {
      const matchesSubject = filters.subject.some(filterSubject =>
        item.subject.toLowerCase().includes(filterSubject.toLowerCase())
      );
      if (!matchesSubject) return false;
    }

    // Author filter
    if (filters.author.length > 0) {
      const matchesAuthor = filters.author.some(filterAuthor =>
        item.author.toLowerCase().includes(filterAuthor.toLowerCase())
      );
      if (!matchesAuthor) return false;
    }

    // Year filter
    if (filters.year.trim()) {
      const filterYear = parseInt(filters.year);
      if (!isNaN(filterYear) && item.year !== filterYear) return false;
    }

    // Duration filter
    if (filters.duration.trim()) {
      if (!matchesDurationFilter(item.duration, filters.duration)) return false;
    }

    // Language filter
    if (filters.language.length > 0) {
      const matchesLanguage = filters.language.some(filterLang =>
        item.language?.toLowerCase().includes(filterLang.toLowerCase()) ||
        item.pais?.toLowerCase().includes(filterLang.toLowerCase())
      );
      if (!matchesLanguage) return false;
    }

    // Document type filter
    if (filters.documentType.length > 0) {
      if (!item.documentType || !filters.documentType.includes(item.documentType)) return false;
    }

    // Program filter (for podcasts)
    if (filters.program.length > 0) {
      if (item.type !== 'podcast' || !item.program) return false;
      const matchesProgram = filters.program.some(filterProgram =>
        item.program!.toLowerCase().includes(filterProgram.toLowerCase())
      );
      if (!matchesProgram) return false;
    }

    // Channel filter (for videos)
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

// Função auxiliar para filtro de duração
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

// Função para ordenar resultados
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('📨 Search request received:', requestBody);
    
    const result = await performSearch(requestBody);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error('❌ Handler error:', error);
    
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
