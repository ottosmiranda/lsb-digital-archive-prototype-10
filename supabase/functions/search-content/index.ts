
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const API_BASE_URL = 'https://link-business-school.onrender.com/api/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  query?: string;
  filters?: {
    resourceType?: string[];
    subject?: string[];
    author?: string;
    year?: string;
    duration?: string;
    language?: string[];
    documentType?: string[];
  };
  sortBy?: string;
  page?: number;
  limit?: number;
}

// Cache simplificado para totais
const totalsCache = new Map<string, { total: number; timestamp: number }>();
const TOTALS_CACHE_TTL = 10 * 60 * 1000; // 10 minutos

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, filters, sortBy, page = 1, limit = 9 }: SearchParams = await req.json();
    
    console.log('🔍 Search request:', { query, filters, sortBy, page, limit });

    // Determinar tipos de conteúdo
    let contentTypes: string[] = ['livro', 'aula', 'podcast'];
    
    if (filters?.resourceType?.length) {
      if (filters.resourceType.includes('all')) {
        contentTypes = ['livro', 'aula', 'podcast'];
      } else {
        contentTypes = filters.resourceType.map(type => 
          type === 'titulo' ? 'livro' : type === 'video' ? 'aula' : type
        ).filter(type => ['livro', 'aula', 'podcast'].includes(type));
      }
    }

    console.log('📋 Content types to search:', contentTypes);

    // Buscar conteúdo de forma simplificada
    const results = await Promise.allSettled(
      contentTypes.map(tipo => fetchContentType(tipo, page, limit))
    );

    let allItems: any[] = [];
    let totalFromAllTypes = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const tipo = contentTypes[i];
      
      if (result.status === 'fulfilled') {
        const { items, total } = result.value;
        const transformedItems = items.map((item: any) => transformToSearchResult(item, tipo));
        allItems = allItems.concat(transformedItems);
        totalFromAllTypes += total;
      } else {
        console.error(`❌ Failed to fetch ${tipo}:`, result.reason);
      }
    }

    // Aplicar filtros locais se necessário
    let filteredItems = allItems;

    // Filtro por query
    if (query?.trim()) {
      const searchTerms = query.toLowerCase().trim().split(' ');
      filteredItems = filteredItems.filter(item => {
        const searchText = `${item.title} ${item.author} ${item.description}`.toLowerCase();
        return searchTerms.every(term => searchText.includes(term));
      });
    }

    // Filtro por autor
    if (filters?.author?.trim()) {
      const authorFilter = filters.author.toLowerCase().trim();
      filteredItems = filteredItems.filter(item => 
        item.author.toLowerCase().includes(authorFilter)
      );
    }

    // Filtro por assunto
    if (filters?.subject?.length) {
      filteredItems = filteredItems.filter(item =>
        filters.subject!.some(subject => 
          item.subject.toLowerCase().includes(subject.toLowerCase())
        )
      );
    }

    // Filtro por ano
    if (filters?.year?.trim()) {
      const yearFilter = parseInt(filters.year);
      if (!isNaN(yearFilter)) {
        filteredItems = filteredItems.filter(item => item.year === yearFilter);
      }
    }

    // Filtro por duração
    if (filters?.duration?.trim()) {
      filteredItems = filteredItems.filter(item => {
        if (!item.duration) return false;
        const duration = item.duration.toLowerCase();
        const filter = filters.duration!.toLowerCase();
        
        if (filter === 'curta') return duration.includes('m') && !duration.includes('h');
        if (filter === 'media') return duration.includes('h') && parseInt(duration) <= 2;
        if (filter === 'longa') return duration.includes('h') && parseInt(duration) > 2;
        
        return duration.includes(filter);
      });
    }

    // Aplicar ordenação
    filteredItems = applySorting(filteredItems, sortBy || 'relevance');

    // Se houve filtragem, recalcular total
    const finalTotal = (query?.trim() || filters?.author?.trim() || filters?.subject?.length || 
                       filters?.year?.trim() || filters?.duration?.trim()) 
                       ? filteredItems.length : totalFromAllTypes;

    // Aplicar paginação
    const startIndex = (page - 1) * limit;
    const pagedItems = filteredItems.slice(startIndex, startIndex + limit);

    const totalPages = Math.ceil(finalTotal / limit);

    console.log(`✅ Search completed: ${pagedItems.length} items returned, ${finalTotal} total`);

    const response = {
      success: true,
      results: pagedItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: finalTotal,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      searchInfo: {
        query: query || '',
        appliedFilters: filters || {},
        sortBy: sortBy || 'relevance'
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Search function error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
      results: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalResults: 0,
        hasNextPage: false,
        hasPreviousPage: false
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Função simplificada para buscar conteúdo por tipo
async function fetchContentType(tipo: string, page: number, limit: number): Promise<{ items: any[], total: number }> {
  try {
    console.log(`🔍 Fetching ${tipo} - page ${page}, limit ${limit}`);
    
    // Primeiro, tentar obter o total
    const totalCacheKey = `total_${tipo}`;
    let total = 0;
    
    const cachedTotal = totalsCache.get(totalCacheKey);
    if (cachedTotal && (Date.now() - cachedTotal.timestamp) < TOTALS_CACHE_TTL) {
      total = cachedTotal.total;
      console.log(`📊 Cache hit for ${tipo} total: ${total}`);
    } else {
      // Buscar total da API
      try {
        const totalUrl = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=1&limit=1`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const totalResponse = await fetch(totalUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'LSB-Search/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (totalResponse.ok) {
          const totalData = await totalResponse.json();
          total = totalData.total || 0;
          totalsCache.set(totalCacheKey, { total, timestamp: Date.now() });
          console.log(`📊 ${tipo} total from API: ${total}`);
        }
      } catch (err) {
        console.warn(`⚠️ Failed to get total for ${tipo}:`, err);
        total = 100; // Fallback estimate
      }
    }

    if (total === 0) {
      return { items: [], total: 0 };
    }

    // Buscar itens da página atual
    const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${page}&limit=${limit}`;
    console.log(`🌐 Fetching ${tipo} from: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LSB-Search/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const rawData = await response.json();
    const items = rawData.conteudo || [];
    
    console.log(`✅ ${tipo}: fetched ${items.length} items`);
    
    return { items, total };
    
  } catch (error) {
    console.error(`❌ Error fetching ${tipo}:`, error);
    return { items: [], total: 0 };
  }
}

// Função de ordenação simplificada
function applySorting(items: any[], sortType: string): any[] {
  return items.sort((a, b) => {
    switch (sortType) {
      case 'title':
      case 'relevance':
        const titleA = (a.title || '').toLowerCase();
        const titleB = (b.title || '').toLowerCase();
        return titleA.localeCompare(titleB);
        
      case 'recent':
        return b.year - a.year;
        
      case 'accessed':
        const typeOrder = { 'podcast': 3, 'video': 2, 'titulo': 1 };
        const orderA = typeOrder[a.type] || 0;
        const orderB = typeOrder[b.type] || 0;
        if (orderA !== orderB) return orderB - orderA;
        return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase());
        
      default:
        return 0;
    }
  });
}

function transformToSearchResult(item: any, tipo: string): any {
  // Usar timestamp + índice para gerar ID único e evitar duplicação
  const uniqueId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
  
  const baseResult = {
    id: uniqueId,
    originalId: item.id,
    title: item.titulo || item.podcast_titulo || item.title || 'Título não disponível',
    author: item.autor || item.canal || 'Link Business School',
    year: item.ano || new Date().getFullYear(),
    description: item.descricao || 'Descrição não disponível',
    subject: getSubjectFromCategories(item.categorias) || getDefaultSubject(tipo),
    type: tipo === 'livro' ? 'titulo' : tipo === 'aula' ? 'video' : 'podcast',
    thumbnail: item.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png'
  };

  if (tipo === 'livro') {
    return {
      ...baseResult,
      pdfUrl: item.arquivo,
      pages: item.paginas,
      language: item.language,
      documentType: item.tipo_documento || 'Livro'
    };
  } else if (tipo === 'aula') {
    return {
      ...baseResult,
      embedUrl: item.embed_url,
      duration: item.duracao_ms ? formatDuration(item.duracao_ms) : undefined
    };
  } else if (tipo === 'podcast') {
    return {
      ...baseResult,
      duration: item.duracao_ms ? formatDuration(item.duracao_ms) : undefined,
      embedUrl: item.embed_url
    };
  }

  return baseResult;
}

function getSubjectFromCategories(categorias: string[]): string {
  if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
    return '';
  }
  return categorias[0];
}

function getDefaultSubject(tipo: string): string {
  switch (tipo) {
    case 'livro': return 'Administração';
    case 'aula': return 'Empreendedorismo';
    case 'podcast': return 'Negócios';
    default: return 'Geral';
  }
}

function formatDuration(durationMs: number): string {
  const minutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}
