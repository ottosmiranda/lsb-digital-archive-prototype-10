import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para garantir números inteiros
const ensureInteger = (value: number): number => Math.floor(Math.abs(value)) || 1;

// Função para calcular limite por tipo dinamicamente
const calculateLimitPerType = (page: number, resultsPerPage: number): number => {
  const itemsNeeded = page * resultsPerPage;
  const buffer = Math.max(20, Math.floor(itemsNeeded * 0.25)); // 25% buffer
  const safeTotal = itemsNeeded + buffer;
  
  // Dividir por 4 tipos e garantir número inteiro
  const baseLimit = Math.ceil(safeTotal / 4);
  
  // Aplicar escalabilidade por faixas de páginas
  if (page <= 5) return ensureInteger(Math.max(20, baseLimit));
  if (page <= 25) return ensureInteger(Math.max(50, baseLimit));
  return ensureInteger(Math.max(200, baseLimit));
};

// Função para calcular limites proporcionais
const calculateProportionalLimits = (
  totalBooks: number, 
  totalVideos: number, 
  totalPodcasts: number, 
  totalArticles: number, 
  targetTotal: number
) => {
  const grandTotal = totalBooks + totalVideos + totalPodcasts + totalArticles;
  
  if (grandTotal === 0) {
    const equalLimit = Math.ceil(targetTotal / 4);
    return {
      booksLimit: ensureInteger(equalLimit),
      videosLimit: ensureInteger(equalLimit),
      podcastsLimit: ensureInteger(equalLimit),
      articlesLimit: ensureInteger(equalLimit)
    };
  }
  
  // Calcular distribuição proporcional com arredondamento inteligente
  const booksLimit = Math.max(1, Math.floor((totalBooks / grandTotal) * targetTotal));
  const videosLimit = Math.max(1, Math.floor((totalVideos / grandTotal) * targetTotal));
  const podcastsLimit = Math.max(1, Math.floor((totalPodcasts / grandTotal) * targetTotal));
  const articlesLimit = Math.max(1, Math.floor((totalArticles / grandTotal) * targetTotal));
  
  // Ajustar restos para atingir target exato
  const currentSum = booksLimit + videosLimit + podcastsLimit + articlesLimit;
  const remainder = targetTotal - currentSum;
  
  // Distribuir resto proporcionalmente (maiores tipos recebem mais)
  const limits = [
    { type: 'books', value: booksLimit, total: totalBooks },
    { type: 'videos', value: videosLimit, total: totalVideos },
    { type: 'podcasts', value: podcastsLimit, total: totalPodcasts },
    { type: 'articles', value: articlesLimit, total: totalArticles }
  ].sort((a, b) => b.total - a.total);
  
  // Distribuir remainder pelos tipos com maior representação
  for (let i = 0; i < remainder && i < limits.length; i++) {
    limits[i].value += 1;
  }
  
  return {
    booksLimit: ensureInteger(limits.find(l => l.type === 'books')?.value || 1),
    videosLimit: ensureInteger(limits.find(l => l.type === 'videos')?.value || 1),
    podcastsLimit: ensureInteger(limits.find(l => l.type === 'podcasts')?.value || 1),
    articlesLimit: ensureInteger(limits.find(l => l.type === 'articles')?.value || 1)
  };
};

// Cache simples em memória para blocos
const globalCache = new Map<string, any>();

// Função para calcular número do bloco
const getBlockNumber = (page: number): number => ensureInteger(Math.ceil(page / 10));

// Função para gerar chave de cache
const getCacheKey = (blockNumber: number, sortBy: string): string => 
  `global_block_${blockNumber}_sort_${sortBy}`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query = '', filters = {}, sortBy = 'relevance', page = 1, resultsPerPage = 9 } = await req.json();
    
    console.log(`🔍 Search request: query="${query}", page=${page}, filters:`, filters);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Helper function to construct filter conditions
    const constructFilterConditions = (filterType: string, filterValues: string[], tableAlias: string = 'c') => {
      if (!filterValues || filterValues.length === 0) return '';
      
      const values = filterValues.map(val => `'${val}'`).join(', ');
      return `AND ${tableAlias}.${filterType} IN (${values})`;
    };

    // Helper function to apply date range filter
    const applyDateRangeFilter = (year: string) => {
      if (!year) return '';
      
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      return `AND c.created_at BETWEEN '${start}' AND '${end}'`;
    };

    // Helper function to apply duration filter
    const applyDurationFilter = (duration: string) => {
      if (!duration) return '';

      // Extract numeric value and unit from the duration string
      const value = parseInt(duration.replace(/\D/g, ''));
      const unit = duration.replace(/\d/g, '').toLowerCase();

      if (isNaN(value)) return '';

      let condition = '';
      switch (unit) {
        case 'min':
          condition = `AND c.duration <= ${value * 60}`; // Convert minutes to seconds
          break;
        case 'hr':
          condition = `AND c.duration <= ${value * 3600}`; // Convert hours to seconds
          break;
        default:
          return '';
      }

      return condition;
    };

    // Function to fetch content based on filters
    const fetchContent = async (resourceType: string) => {
      let queryBuilder = supabase
        .from('content')
        .select('*')
        .eq('resource_type', resourceType)
        .limit(resultsPerPage);

      if (query && query.trim()) {
        queryBuilder = queryBuilder.textSearch('title', query);
      }

      // Apply filters
      if (filters.subject && filters.subject.length > 0) {
        queryBuilder = queryBuilder.in('subject', filters.subject);
      }
      if (filters.author && filters.author.length > 0) {
        queryBuilder = queryBuilder.in('author', filters.author);
      }
      if (filters.language && filters.language.length > 0) {
        queryBuilder = queryBuilder.in('language', filters.language);
      }
      if (filters.documentType && filters.documentType.length > 0) {
        queryBuilder = queryBuilder.in('document_type', filters.documentType);
      }
      if (filters.program && filters.program.length > 0) {
        queryBuilder = queryBuilder.in('program', filters.program);
      }
       if (filters.channel && filters.channel.length > 0) {
        queryBuilder = queryBuilder.in('channel', filters.channel);
      }
      if (filters.year) {
        const start = `${filters.year}-01-01`;
        const end = `${filters.year}-12-31`;
        queryBuilder = queryBuilder.gte('created_at', start).lte('created_at', end);
      }
      if (filters.duration) {
        // Extract numeric value and unit from the duration string
        const value = parseInt(filters.duration.replace(/\D/g, ''));
        const unit = filters.duration.replace(/\d/g, '').toLowerCase();

        if (!isNaN(value)) {
          if (unit === 'min') {
            queryBuilder = queryBuilder.lte('duration', value * 60); // Convert minutes to seconds
          } else if (unit === 'hr') {
            queryBuilder = queryBuilder.lte('duration', value * 3600); // Convert hours to seconds
          }
        }
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error fetching content:', error);
        return { data: [], error };
      }

      return { data, error: null };
    };

    // Função para buscar conteúdo com limite específico
    const fetchContentWithLimit = async (type: string, limit: number) => {
      const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';
      const url = `${API_BASE_URL}/conteudo-lbs/${type}?limit=${limit}`;
      
      try {
        const response = await fetch(url, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return data.conteudo || [];
      } catch (error) {
        console.warn(`⚠️ Erro ao buscar ${type}:`, error);
        return [];
      }
    };

    // Função para buscar totais de cada tipo
    const fetchTotals = async () => {
      try {
        const [booksRes, videosRes, podcastsRes, articlesRes] = await Promise.allSettled([
          fetchContentWithLimit('livro', 1),
          fetchContentWithLimit('aula', 1), 
          fetchContentWithLimit('podcast', 1),
          fetchContentWithLimit('artigo', 1)
        ]);

        // Para obter totais reais, fazemos uma busca com limit alto e contamos
        const [booksData, videosData, podcastsData, articlesData] = await Promise.allSettled([
          fetchContentWithLimit('livro', 1000),
          fetchContentWithLimit('aula', 1000),
          fetchContentWithLimit('podcast', 1000), 
          fetchContentWithLimit('artigo', 1000)
        ]);

        const totalBooks = booksData.status === 'fulfilled' ? booksData.value.length : 0;
        const totalVideos = videosData.status === 'fulfilled' ? videosData.value.length : 0;
        const totalPodcasts = podcastsData.status === 'fulfilled' ? podcastsData.value.length : 0;
        const totalArticles = articlesData.status === 'fulfilled' ? articlesData.value.length : 0;

        return { totalBooks, totalVideos, totalPodcasts, totalArticles };
      } catch (error) {
        console.warn('⚠️ Erro ao buscar totais, usando valores padrão');
        return { totalBooks: 71, totalVideos: 276, totalPodcasts: 633, totalArticles: 79 };
      }
    };

    // Função principal para busca global melhorada
    const performGlobalSearch = async (query: string, sortBy: string, page: number, resultsPerPage: number) => {
      const requestId = `global_search_${Date.now()}`;
      console.group(`🌍 ${requestId} - Busca Global Dinâmica (Página ${page})`);
      
      try {
        // Verificar cache por blocos
        const blockNumber = getBlockNumber(page);
        const cacheKey = getCacheKey(blockNumber, sortBy);
        
        if (globalCache.has(cacheKey)) {
          console.log(`📦 Cache HIT para bloco ${blockNumber}`);
          const cachedData = globalCache.get(cacheKey);
          
          // Extrair página específica do bloco cacheado
          const startIndex = ((page - 1) % 10) * resultsPerPage;
          const endIndex = startIndex + resultsPerPage;
          const pageResults = cachedData.allResults.slice(startIndex, endIndex);
          
          return {
            success: true,
            results: pageResults,
            pagination: {
              currentPage: page,
              totalPages: cachedData.totalPages,
              totalResults: cachedData.totalResults,
              hasNextPage: page < cachedData.totalPages,
              hasPreviousPage: page > 1
            },
            searchInfo: {
              query,
              appliedFilters: {},
              sortBy
            }
          };
        }
        
        console.log(`🔄 Cache MISS para bloco ${blockNumber} - buscando dados`);
        
        // Obter totais reais de cada tipo
        const { totalBooks, totalVideos, totalPodcasts, totalArticles } = await fetchTotals();
        const grandTotal = totalBooks + totalVideos + totalPodcasts + totalArticles;
        
        console.log(`📊 Totais reais: Books=${totalBooks}, Videos=${totalVideos}, Podcasts=${totalPodcasts}, Articles=${totalArticles}, Total=${grandTotal}`);
        
        // Calcular limite dinâmico por tipo baseado na página
        const baseLimitPerType = calculateLimitPerType(page, resultsPerPage);
        
        // Se estamos buscando um bloco avançado, precisamos de mais dados
        const itemsNeededForBlock = blockNumber * 10 * resultsPerPage;
        const targetTotal = Math.max(itemsNeededForBlock, baseLimitPerType * 4);
        
        // Calcular limites proporcionais
        const { booksLimit, videosLimit, podcastsLimit, articlesLimit } = 
          calculateProportionalLimits(totalBooks, totalVideos, totalPodcasts, totalArticles, targetTotal);
        
        console.log(`🎯 Limites dinâmicos: Books=${booksLimit}, Videos=${videosLimit}, Podcasts=${podcastsLimit}, Articles=${articlesLimit}`);
        
        // Buscar dados de cada tipo com limites calculados
        const [booksData, videosData, podcastsData, articlesData] = await Promise.allSettled([
          fetchContentWithLimit('livro', booksLimit),
          fetchContentWithLimit('aula', videosLimit),
          fetchContentWithLimit('podcast', podcastsLimit),
          fetchContentWithLimit('artigo', articlesLimit)
        ]);
        
        // Coletar resultados
        const allResults: any[] = [];
        
        if (booksData.status === 'fulfilled') {
          allResults.push(...booksData.value.map((item: any) => ({ ...item, type: 'titulo' })));
        }
        if (videosData.status === 'fulfilled') {
          allResults.push(...videosData.value.map((item: any) => ({ ...item, type: 'video' })));
        }
        if (podcastsData.status === 'fulfilled') {
          allResults.push(...podcastsData.value.map((item: any) => ({ ...item, type: 'podcast' })));
        }
        if (articlesData.status === 'fulfilled') {
          allResults.push(...articlesData.value.map((item: any) => ({ ...item, type: 'titulo' })));
        }
        
        // Aplicar filtros se necessário
        let filteredResults = allResults;
        
        if (query && query.trim()) {
          const searchTerm = query.toLowerCase().trim();
          filteredResults = allResults.filter(item => 
            item.titulo?.toLowerCase().includes(searchTerm) ||
            item.title?.toLowerCase().includes(searchTerm) ||
            item.autor?.toLowerCase().includes(searchTerm) ||
            item.author?.toLowerCase().includes(searchTerm) ||
            item.descricao?.toLowerCase().includes(searchTerm) ||
            item.description?.toLowerCase().includes(searchTerm)
          );
        }
        
        // Aplicar ordenação
        if (sortBy === 'title') {
          filteredResults.sort((a, b) => {
            const titleA = (a.titulo || a.title || '').toLowerCase();
            const titleB = (b.titulo || b.title || '').toLowerCase();
            return titleA.localeCompare(titleB);
          });
        } else if (sortBy === 'recent') {
          filteredResults.sort((a, b) => {
            const yearA = parseInt(a.ano || a.year || '0');
            const yearB = parseInt(b.ano || b.year || '0');
            return yearB - yearA;
          });
        } else {
          // Ordenação por relevância: intercalar tipos para diversidade
          const books = filteredResults.filter(item => item.type === 'titulo' && (item.categoria === 'Livro' || !item.categoria));
          const articles = filteredResults.filter(item => item.type === 'titulo' && item.categoria === 'Artigo');
          const videos = filteredResults.filter(item => item.type === 'video');
          const podcasts = filteredResults.filter(item => item.type === 'podcast');
          
          const interlaced: any[] = [];
          const maxLength = Math.max(books.length, articles.length, videos.length, podcasts.length);
          
          for (let i = 0; i < maxLength; i++) {
            if (podcasts[i]) interlaced.push(podcasts[i]);
            if (videos[i]) interlaced.push(videos[i]);
            if (books[i]) interlaced.push(books[i]);
            if (articles[i]) interlaced.push(articles[i]);
          }
          
          filteredResults = interlaced;
        }
        
        const totalResults = grandTotal; // Usar total real da API
        const totalPages = ensureInteger(Math.ceil(totalResults / resultsPerPage));
        
        // Cachear dados do bloco
        globalCache.set(cacheKey, {
          allResults: filteredResults,
          totalResults,
          totalPages,
          timestamp: Date.now()
        });
        
        // Limpar cache antigo (manter apenas 5 blocos)
        if (globalCache.size > 5) {
          const oldestKey = Array.from(globalCache.keys())[0];
          globalCache.delete(oldestKey);
        }
        
        // Extrair página específica
        const startIndex = (page - 1) * resultsPerPage;
        const endIndex = startIndex + resultsPerPage;
        const pageResults = filteredResults.slice(startIndex, endIndex);
        
        console.log(`✅ Busca global concluída: ${pageResults.length} resultados para página ${page} de ${totalPages}`);
        console.groupEnd();
        
        return {
          success: true,
          results: pageResults,
          pagination: {
            currentPage: ensureInteger(page),
            totalPages,
            totalResults,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          },
          searchInfo: {
            query,
            appliedFilters: {},
            sortBy
          }
        };
        
      } catch (error) {
        console.error('❌ Erro na busca global:', error);
        console.groupEnd();
        throw error;
      }
    };

    // Specific filter handling
    const handleSpecificFilters = async (resourceType: string, query: string, filters: any, sortBy: string, page: number, resultsPerPage: number) => {
      const { data, error } = await fetchContent(resourceType);

      if (error) {
        console.error('Error fetching content:', error);
        throw error;
      }

      const totalResults = data ? data.length : 0;
      const totalPages = Math.ceil(totalResults / resultsPerPage);
      const startIndex = (page - 1) * resultsPerPage;
      const endIndex = startIndex + resultsPerPage;
      const pageResults = data ? data.slice(startIndex, endIndex) : [];

      return {
        success: true,
        results: pageResults,
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

    // Determinar tipo de busca
    const hasResourceTypeFilter = filters.resourceType && filters.resourceType.length > 0;
    const isGlobalSearch = !hasResourceTypeFilter || filters.resourceType.length === 0;
    
    if (isGlobalSearch) {
      console.log('🌍 Executando busca global com paginação dinâmica');
      const result = await performGlobalSearch(query, sortBy, page, resultsPerPage);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    // Handle specific filters
    if (filters.resourceType && filters.resourceType.length === 1) {
      const resourceType = filters.resourceType[0];
      console.log(`🔍 Executando busca para tipo específico: ${resourceType}`);

      const result = await handleSpecificFilters(resourceType, query, filters, sortBy, page, resultsPerPage);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Fallback: busca global se nenhuma condição específica foi atendida
    console.log('🔄 Fallback para busca global');
    const fallbackResult = await performGlobalSearch(query, sortBy, page, resultsPerPage);
    
    return new Response(JSON.stringify(fallbackResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Erro geral na busca:', error);
    
    return new Response(JSON.stringify({
      success: false,
      results: [],
      pagination: {
        currentPage: ensureInteger(page),
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
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
