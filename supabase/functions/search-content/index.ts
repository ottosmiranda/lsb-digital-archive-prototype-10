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

interface SearchResult {
  id: string;
  title: string;
  type: string;
  description?: string;
  author?: string;
  year?: number;
  thumbnail?: string;
  url?: string;
  subjects?: string[];
  language?: string;
  documentType?: string;
  program?: string;
  channel?: string;
  duration?: string;
}

interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  searchInfo: {
    query: string;
    appliedFilters: SearchFilters;
    sortBy: string;
  };
  error?: string;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') as string

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';

// CORREÇÃO: Proporções reais descobertas para distribuição inteligente
const CONTENT_PROPORTIONS = {
  livro: 0.067,    // 6.7% (71 itens)
  aula: 0.261,     // 26.1% (276 itens) 
  podcast: 0.598,  // 59.8% (633 itens)
  artigos: 0.074   // 7.4% (79 itens)
};

const TOTAL_REAL_CONTENT = 1059; // Total real descoberto

function transformToSearchResult(item: any, type: string): SearchResult {
  const baseResult: SearchResult = {
    id: item.id?.toString() || Math.random().toString(),
    title: item.titulo || item.title || 'Sem título',
    type: type === 'aula' ? 'video' : (type === 'artigos' ? 'titulo' : type),
    description: item.resumo || item.description || item.descricao,
    thumbnail: item.thumbnail || item.imagem,
    url: item.url || item.link
  };

  // Adicionar campos específicos por tipo
  if (type === 'livro' || type === 'artigos') {
    return {
      ...baseResult,
      author: item.autor || item.author,
      year: item.ano ? parseInt(item.ano) : undefined,
      subjects: item.assuntos ? [item.assuntos] : undefined,
      language: item.idioma,
      documentType: item.tipo_documento
    };
  }

  if (type === 'aula') {
    return {
      ...baseResult,
      author: item.instrutor || item.autor,
      year: item.ano ? parseInt(item.ano) : undefined,
      duration: item.duracao,
      subjects: item.assuntos ? [item.assuntos] : undefined
    };
  }

  if (type === 'podcast') {
    return {
      ...baseResult,
      program: item.programa,
      channel: item.canal,
      year: item.ano ? parseInt(item.ano) : undefined,
      duration: item.duracao
    };
  }

  return baseResult;
}

async function performGlobalSearch(
  query: string,
  filters: SearchFilters,
  sortBy: string,
  page: number,
  resultsPerPage: number
): Promise<SearchResponse> {
  const requestId = `global_search_${Date.now()}`;
  console.group(`🌍 ${requestId} - Busca Global CORRIGIDA (Página ${page})`);
  
  try {
    // ✅ CORREÇÃO PRINCIPAL: Calcular dados necessários dinamicamente
    const startIndex = (page - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    
    // Calcular quantos dados precisamos buscar baseado na página
    let itemsNeeded: number;
    if (page <= 3) {
      // Páginas iniciais: manter lógica atual (já funciona)
      itemsNeeded = 60; // Buffer pequeno
    } else if (page <= 20) {
      // Páginas médias: buscar mais dados
      itemsNeeded = page * resultsPerPage + 100; // Buffer médio
    } else if (page <= 50) {
      // Páginas avançadas: buscar muitos dados
      itemsNeeded = page * resultsPerPage + 200; // Buffer grande
    } else {
      // Páginas finais: buscar a maior quantidade possível
      itemsNeeded = Math.min(TOTAL_REAL_CONTENT, page * resultsPerPage + 500);
    }
    
    console.log(`📊 Página ${page}: Coletando ${itemsNeeded} itens (índices ${startIndex}-${endIndex})`);
    
    // ✅ CORREÇÃO: Distribuir proporcionalmente por tipo
    const limitBooks = Math.ceil(itemsNeeded * CONTENT_PROPORTIONS.livro);
    const limitVideos = Math.ceil(itemsNeeded * CONTENT_PROPORTIONS.aula);
    const limitPodcasts = Math.ceil(itemsNeeded * CONTENT_PROPORTIONS.podcast);
    const limitArticles = Math.ceil(itemsNeeded * CONTENT_PROPORTIONS.artigos);
    
    console.log(`📋 Limites distribuídos:`, {
      livros: limitBooks,
      videos: limitVideos, 
      podcasts: limitPodcasts,
      artigos: limitArticles,
      total: limitBooks + limitVideos + limitPodcasts + limitArticles
    });

    // Buscar dados de todos os tipos em paralelo
    const fetchPromises = await Promise.allSettled([
      fetchPaginatedContent('livro', 1, limitBooks),
      fetchPaginatedContent('aula', 1, limitVideos),
      fetchPaginatedContent('podcast', 1, limitPodcasts),
      fetchPaginatedContent('artigos', 1, limitArticles)
    ]);

    const allResults: SearchResult[] = [];
    let totalCollected = 0;

    // Processar resultados de cada tipo
    fetchPromises.forEach((result, index) => {
      const types = ['livros', 'videos', 'podcasts', 'artigos'];
      const typeName = types[index];
      
      if (result.status === 'fulfilled') {
        const typeResults = result.value;
        allResults.push(...typeResults);
        totalCollected += typeResults.length;
        console.log(`✅ ${typeName}: ${typeResults.length} itens coletados`);
      } else {
        console.warn(`⚠️ ${typeName}: Falha -`, result.reason);
      }
    });

    console.log(`📊 Total coletado: ${totalCollected} itens de ${TOTAL_REAL_CONTENT} disponíveis`);

    // ✅ CORREÇÃO: Aplicar filtros se especificados
    let filteredResults = allResults;
    
    if (query && query.trim() !== '') {
      const queryLower = query.toLowerCase().trim();
      filteredResults = allResults.filter(item => 
        item.title.toLowerCase().includes(queryLower) ||
        (item.description && item.description.toLowerCase().includes(queryLower)) ||
        (item.author && item.author.toLowerCase().includes(queryLower))
      );
    }

    // ✅ CORREÇÃO: Intercalar tipos para diversidade (manter proporção real)
    const sortedResults = intercalateContentTypes(filteredResults);
    
    // ✅ CORREÇÃO: Aplicar paginação real aos dados coletados
    const paginatedResults = sortedResults.slice(startIndex, endIndex);
    
    // Calcular totais baseados nos dados disponíveis vs. reais
    const actualTotal = query && query.trim() !== '' ? filteredResults.length : TOTAL_REAL_CONTENT;
    const totalPages = Math.ceil(actualTotal / resultsPerPage);
    
    console.log(`✅ Página ${page}: ${paginatedResults.length} itens retornados`);
    console.log(`📊 Totais: ${actualTotal} itens, ${totalPages} páginas`);
    
    // ✅ VALIDAÇÃO: Verificar se temos dados suficientes
    if (paginatedResults.length === 0 && page <= totalPages && totalCollected > 0) {
      console.warn(`⚠️ AVISO: Página ${page} sem dados, mas deveria ter. Dados coletados: ${totalCollected}`);
    }
    
    console.groupEnd();

    const response: SearchResponse = {
      success: true,
      results: paginatedResults,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalResults: actualTotal,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      searchInfo: {
        query: query || '',
        appliedFilters: filters,
        sortBy
      }
    };

    return response;

  } catch (error) {
    console.error(`❌ ${requestId} - Erro na busca global:`, error);
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
        query: query || '',
        appliedFilters: filters,
        sortBy
      },
      error: error instanceof Error ? error.message : 'Erro na busca global'
    };
  }
}

// ✅ NOVA FUNÇÃO: Intercalar tipos mantendo proporção real
function intercalateContentTypes(results: SearchResult[]): SearchResult[] {
  // Separar por tipo
  const books = results.filter(r => r.type === 'titulo');
  const videos = results.filter(r => r.type === 'video'); 
  const podcasts = results.filter(r => r.type === 'podcast');
  
  const intercalated: SearchResult[] = [];
  const maxLength = Math.max(books.length, videos.length, podcasts.length);
  
  // Intercalar mantendo proporção aproximada: 1 livro, 4 vídeos, 9 podcasts
  for (let i = 0; i < maxLength; i++) {
    // Adicionar podcasts (maior proporção)
    for (let p = 0; p < 3 && podcasts[i * 3 + p]; p++) {
      intercalated.push(podcasts[i * 3 + p]);
    }
    
    // Adicionar vídeos
    if (videos[i]) intercalated.push(videos[i]);
    
    // Adicionar livros (menor proporção)
    if (i % 3 === 0 && books[Math.floor(i / 3)]) {
      intercalated.push(books[Math.floor(i / 3)]);
    }
  }
  
  return intercalated;
}

async function fetchPaginatedContent(tipo: string, page: number = 1, limit: number = 10): Promise<SearchResult[]> {
  const requestId = `fetch_${tipo}_${Date.now()}`;
  console.log(`📡 ${requestId} - Buscando ${tipo} (página ${page}, limite ${limit})`);
  
  try {
    const url = `${API_BASE_URL}/conteudo-lbs/tipo/${tipo}?page=${page}&limit=${limit}`;
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout ${tipo} após 15s`)), 15000);
    });
    
    const fetchPromise = fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LSB-Search/1.0'
      }
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} para ${tipo}`);
    }

    const data = await response.json();
    
    if (!data.conteudo || !Array.isArray(data.conteudo)) {
      console.warn(`⚠️ ${requestId} - Sem conteúdo ${tipo}`);
      return [];
    }
    
    const transformedResults = data.conteudo.map((item: any) => transformToSearchResult(item, tipo));
    
    console.log(`✅ ${requestId} - ${transformedResults.length} itens ${tipo} coletados`);
    return transformedResults;
    
  } catch (error) {
    console.error(`❌ ${requestId} - Erro ${tipo}:`, error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { query = '', filters = {}, sortBy = 'relevance', page = 1, resultsPerPage = 9 } = requestBody;

    console.log('🔍 Search request received:', { query, filters, sortBy, page, resultsPerPage });

    let response: SearchResponse;

    // Determinar tipo de busca
    const hasResourceTypeFilter = filters.resourceType && filters.resourceType.length > 0;
    const hasQuery = query && query.trim() !== '';
    const hasOtherFilters = Object.entries(filters).some(([key, value]) => 
      key !== 'resourceType' && value && 
      (Array.isArray(value) ? value.length > 0 : value.toString().trim() !== '')
    );

    if (!hasResourceTypeFilter && !hasOtherFilters) {
      // Busca global (filtro "Todos") - CORRIGIDA
      console.log('🌍 Executando busca global corrigida...');
      response = await performGlobalSearch(query, filters, sortBy, page, resultsPerPage);
    } else {
      // Busca específica por tipo - manter lógica existente
      console.log('🎯 Executando busca específica...');
      response = await performSpecificSearch(query, filters, sortBy, page, resultsPerPage);
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Search function error:', error);
    
    const errorResponse: SearchResponse = {
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
        appliedFilters: {},
        sortBy: 'relevance'
      },
      error: error instanceof Error ? error.message : 'Internal server error'
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function performSpecificSearch(
  query: string,
  filters: SearchFilters,
  sortBy: string,
  page: number,
  resultsPerPage: number
): Promise<SearchResponse> {
  const requestId = `specific_search_${Date.now()}`;
  console.group(`🎯 ${requestId} - Busca Específica`);
  
  try {
    const resourceTypes = filters.resourceType || [];
    const allResults: SearchResult[] = [];
    
    for (const resourceType of resourceTypes) {
      const apiType = mapResourceTypeToApiType(resourceType);
      if (apiType) {
        const typeResults = await fetchPaginatedContent(apiType, page, resultsPerPage * 2);
        allResults.push(...typeResults);
      }
    }
    
    // Apply query filter if specified
    let filteredResults = allResults;
    if (query && query.trim() !== '') {
      const queryLower = query.toLowerCase().trim();
      filteredResults = allResults.filter(item => 
        item.title.toLowerCase().includes(queryLower) ||
        (item.description && item.description.toLowerCase().includes(queryLower)) ||
        (item.author && item.author.toLowerCase().includes(queryLower))
      );
    }
    
    // Apply pagination
    const startIndex = (page - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const paginatedResults = filteredResults.slice(startIndex, endIndex);
    
    const totalResults = filteredResults.length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    
    console.log(`✅ ${requestId} - ${paginatedResults.length} resultados específicos`);
    console.groupEnd();
    
    return {
      success: true,
      results: paginatedResults,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalResults: totalResults,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      searchInfo: {
        query: query || '',
        appliedFilters: filters,
        sortBy
      }
    };
    
  } catch (error) {
    console.error(`❌ ${requestId} - Erro na busca específica:`, error);
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
        query: query || '',
        appliedFilters: filters,
        sortBy
      },
      error: error instanceof Error ? error.message : 'Erro na busca específica'
    };
  }
}

function mapResourceTypeToApiType(resourceType: string): string | null {
  const mapping: { [key: string]: string } = {
    'titulo': 'livro',
    'video': 'aula', 
    'podcast': 'podcast'
  };
  
  return mapping[resourceType] || null;
}
