import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  query?: string;
  filters?: {
    resourceType?: string[];
    subject?: string[];
    author?: string | string[]; // CORRIGIDO: Suportar múltiplos autores
    year?: string;
    duration?: string;
    language?: string[];
    documentType?: string[];
    program?: string[]; // NOVO: Filtro de programa para podcasts
    channel?: string[]; // NOVO: Filtro de canal para vídeos
  };
  sortBy?: string;
  page?: number;
  limit?: number;
  getAllAuthors?: boolean;
}

// Cache para totais da API externa (30 minutos)
const totalsCache = new Map<string, { total: number; timestamp: number }>();
const TOTALS_CACHE_TTL = 30 * 60 * 1000; // 30 minutos

// Cache para conteúdo completo (5 minutos para permitir ordenação global)
const contentCache = new Map<string, { items: any[]; timestamp: number }>();
const CONTENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Cache para autores (10 minutos - reduzido para atualizações mais frequentes)
const authorsCache = new Map<string, { authors: any[]; timestamp: number }>();
const AUTHORS_CACHE_TTL = 10 * 60 * 1000; // 10 minutos

// Função para converter duração em minutos totais
const parseDurationToMinutes = (duration: string): number => {
  if (!duration) return 0;
  
  let totalMinutes = 0;
  const durationStr = duration.toLowerCase().trim();
  
  // Extrair horas
  const hoursMatch = durationStr.match(/(\d+)h/);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1]) * 60;
  }
  
  // Extrair minutos
  const minutesMatch = durationStr.match(/(\d+)m/);
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1]);
  }
  
  // Se só tem número (assumir minutos)
  if (!hoursMatch && !minutesMatch) {
    const numberMatch = durationStr.match(/(\d+)/);
    if (numberMatch) {
      totalMinutes = parseInt(numberMatch[1]);
    }
  }
  
  return totalMinutes;
};

// Função para aplicar filtro de duração
const matchesDurationFilter = (itemDuration: string, filterDuration: string): boolean => {
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

// CORRIGIDO: Função para aplicar filtro de múltiplos autores
const matchesAuthorFilter = (itemAuthor: string, authorFilters: string | string[]): boolean => {
  if (!authorFilters) return true;
  
  const authors = Array.isArray(authorFilters) ? authorFilters : [authorFilters];
  const itemAuthorLower = itemAuthor.toLowerCase();
  
  return authors.some(author => 
    author.trim() && itemAuthorLower.includes(author.toLowerCase().trim())
  );
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, filters, sortBy, page = 1, limit = 9, getAllAuthors }: SearchParams = await req.json();
    
    console.log('🔍 Search request:', { query, filters, sortBy, page, limit, getAllAuthors });

    // Se é uma requisição para buscar todos os autores
    if (getAllAuthors) {
      return await handleGetAllAuthors();
    }

    let contentTypes: string[];
    let isMultiTypeSearch = false;
    
    if (filters?.resourceType?.length) {
      if (filters.resourceType.includes('all')) {
        contentTypes = ['livro', 'aula', 'podcast'];
        isMultiTypeSearch = true;
      } else {
        contentTypes = filters.resourceType.map(type => 
          type === 'titulo' ? 'livro' : type === 'video' ? 'aula' : type
        );
        isMultiTypeSearch = contentTypes.length > 1;
      }
    } else {
      contentTypes = ['livro', 'aula', 'podcast'];
      isMultiTypeSearch = true;
    }

    console.log('📋 Content types to search:', contentTypes, '| Multi-type:', isMultiTypeSearch);

    const getRealTotal = async (tipo: string): Promise<number> => {
      const cacheKey = `total_${tipo}`;
      const cached = totalsCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < TOTALS_CACHE_TTL) {
        console.log(`📊 Cache HIT for ${tipo} total: ${cached.total}`);
        return cached.total;
      }

      try {
        console.log(`📊 Fetching real total for ${tipo} from API`);
        const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=1&limit=1`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'LSB-Search/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const rawData = await response.json();
        const total = rawData.total || 0;
        
        totalsCache.set(cacheKey, { total, timestamp: Date.now() });
        
        console.log(`✅ Real total for ${tipo}: ${total}`);
        return total;
        
      } catch (error) {
        console.error(`❌ Error fetching total for ${tipo}:`, error);
        return 0;
      }
    };

    const fetchAllContentForGlobalSorting = async (): Promise<{ items: any[], totalResults: number }> => {
      console.log('🌍 Starting GLOBAL sorting with real pagination');
      
      const totals = await Promise.all(
        contentTypes.map(async (tipo) => ({
          tipo,
          total: await getRealTotal(tipo)
        }))
      );
      
      const totalResults = totals.reduce((sum, t) => sum + t.total, 0);
      console.log('📊 Content totals:', totals, 'Total combined:', totalResults);
      
      if (totalResults === 0) {
        return { items: [], totalResults: 0 };
      }
      
      const maxItemsToFetch = Math.max(500, page * limit * 2);
      
      console.log(`🎯 Will fetch up to ${maxItemsToFetch} items from each type for global sorting`);
      
      let allItems: any[] = [];
      
      for (const { tipo, total } of totals) {
        if (total === 0) continue;
        
        const cacheKey = `content_${tipo}_${maxItemsToFetch}`;
        let typeItems: any[] = [];
        
        const cached = contentCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CONTENT_CACHE_TTL) {
          console.log(`📦 Content cache HIT for ${tipo}: ${cached.items.length} items`);
          typeItems = cached.items;
        } else {
          console.log(`🌐 Fetching content for ${tipo}`);
          typeItems = await fetchContentFromType(tipo, Math.min(maxItemsToFetch, total));
          
          contentCache.set(cacheKey, { items: typeItems, timestamp: Date.now() });
        }
        
        allItems = allItems.concat(typeItems);
        console.log(`✅ ${tipo}: ${typeItems.length} items added`);
      }
      
      console.log(`📋 Total items fetched: ${allItems.length}`);
      
      allItems = applySorting(allItems, sortBy || 'title');
      
      console.log(`🎯 Global sorting applied: ${sortBy || 'title'}`);
      
      return { items: allItems, totalResults };
    };

    const fetchContentFromType = async (tipo: string, maxItems: number): Promise<any[]> => {
      console.log(`🔍 Fetching ${maxItems} items from ${tipo}`);
      
      try {
        let allItems: any[] = [];
        const itemsPerPage = 100;
        const maxPages = Math.ceil(maxItems / itemsPerPage);
        
        for (let apiPage = 1; apiPage <= maxPages; apiPage++) {
          const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${apiPage}&limit=${itemsPerPage}`;
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'User-Agent': 'LSB-Search/1.0'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.warn(`⚠️ API page ${apiPage} failed for ${tipo}: ${response.status}`);
            break;
          }
          
          const rawData = await response.json();
          const items = rawData.conteudo || [];
          allItems = allItems.concat(items);
          
          console.log(`📄 ${tipo} page ${apiPage}: ${items.length} items, total so far: ${allItems.length}`);
          
          if (items.length < itemsPerPage || allItems.length >= maxItems) {
            break;
          }
        }
        
        const transformedItems = allItems.slice(0, maxItems).map((item: any) => transformToSearchResult(item, tipo));
        
        console.log(`✅ ${tipo}: ${transformedItems.length} items transformed`);
        return transformedItems;
        
      } catch (error) {
        console.error(`❌ Error fetching ${tipo} content:`, error);
        return [];
      }
    };

    const applySorting = (items: any[], sortType: string): any[] => {
      console.log(`🔄 Applying sorting: ${sortType}`);
      
      return items.sort((a, b) => {
        switch (sortType) {
          case 'title':
          case 'relevance':
            const titleA = (a.title || '').toLowerCase();
            const titleB = (b.title || '').toLowerCase();
            return titleA.localeCompare(titleB);
            
          case 'recent':
            // Melhorado: tratar anos nulos corretamente
            const yearA = a.year && a.year > 1900 ? a.year : 0;
            const yearB = b.year && b.year > 1900 ? b.year : 0;
            return yearB - yearA;
            
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
    };

    const fetchContentType = async (tipo: string, requestedPage: number, requestedLimit: number) => {
      try {
        const realTotal = await getRealTotal(tipo);
        
        if (realTotal === 0) {
          console.log(`⚠️ No content available for ${tipo}`);
          return { items: [], total: 0 };
        }

        const startItem = (requestedPage - 1) * requestedLimit;
        const endItem = startItem + requestedLimit;
        
        if (startItem >= realTotal) {
          console.log(`📄 Page ${requestedPage} is beyond available content for ${tipo} (total: ${realTotal})`);
          return { items: [], total: realTotal };
        }

        let allItems: any[] = [];
        
        if (tipo === 'podcast') {
          const apiPageSize = 100;
          const startApiPage = Math.floor(startItem / apiPageSize) + 1;
          const endApiPage = Math.floor((endItem - 1) / apiPageSize) + 1;
          
          console.log(`📄 ${tipo} pagination: requesting items ${startItem}-${endItem}, API pages ${startApiPage}-${endApiPage}`);
          
          for (let apiPage = startApiPage; apiPage <= endApiPage; apiPage++) {
            const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${apiPage}&limit=${apiPageSize}`;
            console.log(`🌐 Fetching ${tipo} page ${apiPage} from:`, url);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(url, {
              signal: controller.signal,
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'LSB-Search/1.0'
              }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              console.warn(`⚠️ API page ${apiPage} failed: ${response.status}`);
              continue;
            }
            
            const rawData = await response.json();
            const items = rawData.conteudo || [];
            allItems = allItems.concat(items);
            
            console.log(`✅ ${tipo} page ${apiPage}: ${items.length} items fetched, total so far: ${allItems.length}`);
            
            if (items.length < apiPageSize) {
              console.log(`📄 Reached end of ${tipo} data at page ${apiPage}`);
              break;
            }
          }
          
          const itemsInAllPages = allItems.length;
          const localStartIndex = startItem % (apiPageSize * (endApiPage - startApiPage + 1));
          const localEndIndex = localStartIndex + requestedLimit;
          
          allItems = allItems.slice(localStartIndex, localEndIndex);
          console.log(`📊 Final ${tipo} items for page ${requestedPage}: ${allItems.length} of ${itemsInAllPages} loaded, total available: ${realTotal}`);
          
        } else {
          if (realTotal <= 100) {
            const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=1&limit=100`;
            console.log(`🌐 Fetching all ${tipo} from:`, url);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(url, {
              signal: controller.signal,
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'LSB-Search/1.0'
              }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const rawData = await response.json();
            const allContentItems = rawData.conteudo || [];
            
            allItems = allContentItems.slice(startItem, endItem);
            console.log(`📊 ${tipo} local pagination: ${allItems.length} items for page ${requestedPage}`);
            
          } else {
            const apiPage = Math.ceil(endItem / 100);
            const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${apiPage}&limit=100`;
            
            const response = await fetch(url, {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'LSB-Search/1.0'
              }
            });
            
            if (response.ok) {
              const rawData = await response.json();
              const items = rawData.conteudo || [];
              const localStart = startItem % 100;
              allItems = items.slice(localStart, localStart + requestedLimit);
            }
          }
        }
        
        return { items: allItems, total: realTotal };
        
      } catch (error) {
        console.error(`❌ Error fetching ${tipo}:`, error);
        return { items: [], total: 0 };
      }
    };

    let allItems: any[] = [];
    let totalFromAllTypes = 0;

    if (isMultiTypeSearch) {
      console.log('🌍 Using GLOBAL sorting with real pagination for multi-type search');
      
      const { items: allSortedItems, totalResults } = await fetchAllContentForGlobalSorting();
      totalFromAllTypes = totalResults;
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      let pagedItems = allSortedItems.slice(startIndex, endIndex);

      let filteredItems = pagedItems;

      if (query?.trim()) {
        const searchTerms = query.toLowerCase().trim().split(' ');
        filteredItems = filteredItems.filter(item => {
          const searchText = `${item.title} ${item.author} ${item.description}`.toLowerCase();
          return searchTerms.every(term => searchText.includes(term));
        });
      }

      // CORRIGIDO: Aplicar filtro de múltiplos autores
      if (filters?.author) {
        console.log(`🔍 Applying author filter:`, filters.author);
        filteredItems = filteredItems.filter(item => 
          matchesAuthorFilter(item.author, filters.author!)
        );
      }

      if (filters?.subject?.length) {
        filteredItems = filteredItems.filter(item =>
          filters.subject!.some(subject => 
            item.subject.toLowerCase().includes(subject.toLowerCase())
          )
        );
      }

      // CORRIGIDO: Filtro de ano melhorado
      if (filters?.year?.trim()) {
        const yearFilter = parseInt(filters.year);
        console.log(`🔍 Applying year filter: ${yearFilter}`);
        if (!isNaN(yearFilter) && yearFilter > 1900) {
          filteredItems = filteredItems.filter(item => {
            const itemYear = item.year;
            // CORRIGIDO: Filtrar apenas itens com ano válido e que correspondam ao filtro
            const hasValidYear = itemYear && itemYear > 1900 && itemYear <= new Date().getFullYear();
            const matches = hasValidYear && itemYear === yearFilter;
            if (hasValidYear) {
              console.log(`🎯 Item "${item.title}" year ${itemYear} matches filter ${yearFilter}: ${matches}`);
            }
            return matches;
          });
        }
      }

      if (filters?.duration?.trim()) {
        console.log(`🔍 Applying duration filter: ${filters.duration}`);
        filteredItems = filteredItems.filter(item => {
          const matches = matchesDurationFilter(item.duration, filters.duration!);
          console.log(`🎯 Item "${item.title}" duration "${item.duration}" matches filter "${filters.duration}": ${matches}`);
          return matches;
        });
      }

      if (filters?.language?.length) {
        filteredItems = filteredItems.filter(item =>
          filters.language!.some(lang => 
            item.language?.toLowerCase().includes(lang.toLowerCase()) ||
            item.pais?.toLowerCase().includes(lang.toLowerCase())
          )
        );
      }

      // NOVO: Filtro de programa para podcasts
      if (filters?.program?.length) {
        console.log(`🔍 Applying program filter:`, filters.program);
        filteredItems = filteredItems.filter(item =>
          item.type === 'podcast' && filters.program!.some(program => 
            item.program?.toLowerCase().includes(program.toLowerCase())
          )
        );
      }

      // NOVO: Filtro de canal para vídeos
      if (filters?.channel?.length) {
        console.log(`🔍 Applying channel filter:`, filters.channel);
        filteredItems = filteredItems.filter(item =>
          item.type === 'video' && filters.channel!.some(channel => 
            item.channel?.toLowerCase().includes(channel.toLowerCase())
          )
        );
      }

      if (query?.trim() || filters?.author || filters?.subject?.length || 
          filters?.year?.trim() || filters?.duration?.trim() || filters?.language?.length) {
        console.log('🔍 Applying filters to all content...');
        
        let allItemsForFiltering = allSortedItems;
        
        if (query?.trim()) {
          const searchTerms = query.toLowerCase().trim().split(' ');
          allItemsForFiltering = allItemsForFiltering.filter(item => {
            const searchText = `${item.title} ${item.author} ${item.description}`.toLowerCase();
            return searchTerms.every(term => searchText.includes(term));
          });
        }

        // CORRIGIDO: Aplicar filtro de múltiplos autores na filtragem geral
        if (filters?.author) {
          console.log(`🔍 Filtering all items by authors:`, filters.author);
          allItemsForFiltering = allItemsForFiltering.filter(item => 
            matchesAuthorFilter(item.author, filters.author!)
          );
        }

        if (filters?.subject?.length) {
          allItemsForFiltering = allItemsForFiltering.filter(item =>
            filters.subject!.some(subject => 
              item.subject.toLowerCase().includes(subject.toLowerCase())
            )
          );
        }

        // CORRIGIDO: Aplicar filtro de ano melhorado nos itens para filtragem
        if (filters?.year?.trim()) {
          const yearFilter = parseInt(filters.year);
          console.log(`🔍 Filtering all items by year: ${yearFilter}`);
          if (!isNaN(yearFilter) && yearFilter > 1900) {
            allItemsForFiltering = allItemsForFiltering.filter(item => {
              const itemYear = item.year;
              const hasValidYear = itemYear && itemYear > 1900 && itemYear <= new Date().getFullYear();
              return hasValidYear && itemYear === yearFilter;
            });
          }
        }

        if (filters?.duration?.trim()) {
          console.log(`🔍 Filtering all items by duration: ${filters.duration}`);
          allItemsForFiltering = allItemsForFiltering.filter(item => 
            matchesDurationFilter(item.duration, filters.duration!)
          );
        }

        if (filters?.language?.length) {
          allItemsForFiltering = allItemsForFiltering.filter(item =>
            filters.language!.some(lang => 
              item.language?.toLowerCase().includes(lang.toLowerCase()) ||
              item.pais?.toLowerCase().includes(lang.toLowerCase())
            )
          );
        }
        
        totalFromAllTypes = allItemsForFiltering.length;
        filteredItems = allItemsForFiltering.slice(startIndex, endIndex);
      }

      allItems = filteredItems;
      
      console.log(`🌍 Global sorting result: ${allItems.length} items for page ${page}, total: ${totalFromAllTypes}`);
      
    } else {
      console.log('📄 Using single-type search pagination');
      
      const results = await Promise.all(
        contentTypes.map(async (tipo) => {
          const result = await fetchContentType(tipo, page, limit);
          return {
            tipo,
            items: result.items.map((item: any) => transformToSearchResult(item, tipo)),
            total: result.total
          };
        })
      );

      for (const result of results) {
        allItems = allItems.concat(result.items);
        totalFromAllTypes += result.total;
      }
    }
    
    console.log(`📊 Final results: ${allItems.length} items, total available: ${totalFromAllTypes}`);
    
    const totalPages = Math.ceil(totalFromAllTypes / limit);

    console.log(`📄 Final pagination: page ${page}/${totalPages}, showing ${allItems.length}/${totalFromAllTypes} items`);

    const response = {
      success: true,
      results: allItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: totalFromAllTypes,
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

// MELHORADO: Função para buscar todos os autores com mais dados
async function handleGetAllAuthors() {
  console.log('👥 Fetching all authors request');
  
  try {
    const cacheKey = 'all_authors';
    const cached = authorsCache.get(cacheKey);
    
    // Verificar cache
    if (cached && (Date.now() - cached.timestamp) < AUTHORS_CACHE_TTL) {
      console.log(`👥 Authors cache HIT: ${cached.authors.length} authors`);
      return new Response(JSON.stringify({
        success: true,
        authors: cached.authors
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('👥 Fetching all authors from API with increased sample size');
    
    const contentTypes = ['livro', 'aula', 'podcast'];
    let allAuthors: { name: string; count: number; type: string }[] = [];
    
    // MELHORADO: Buscar mais páginas para ter mais autores
    for (const tipo of contentTypes) {
      try {
        console.log(`👥 Fetching authors from ${tipo}`);
        
        // AUMENTADO: Buscar até 1000 itens de cada tipo para ter uma amostra muito maior
        const maxSampleSize = 1000;
        let sampleItems: any[] = [];
        
        // Buscar múltiplas páginas para obter mais dados
        const itemsPerPage = 100;
        const maxPages = Math.ceil(maxSampleSize / itemsPerPage);
        
        for (let page = 1; page <= maxPages; page++) {
          const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${page}&limit=${itemsPerPage}`;
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          
          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'User-Agent': 'LSB-Search/1.0'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.warn(`⚠️ Failed to fetch ${tipo} page ${page} for authors: ${response.status}`);
            break;
          }
          
          const rawData = await response.json();
          const items = rawData.conteudo || [];
          
          if (items.length === 0) {
            console.log(`📄 No more items for ${tipo} at page ${page}`);
            break;
          }
          
          sampleItems = sampleItems.concat(items);
          console.log(`👥 Page ${page}: Got ${items.length} items from ${tipo}, total so far: ${sampleItems.length}`);
          
          // Se pegou menos itens que o esperado, não há mais páginas
          if (items.length < itemsPerPage) {
            break;
          }
        }
        
        console.log(`👥 Total sample from ${tipo}: ${sampleItems.length} items`);
        
        // Extrair autores únicos deste tipo
        const typeAuthors = new Map<string, number>();
        
        sampleItems.forEach(item => {
          let authorName = '';
          
          switch (tipo) {
            case 'livro':
              authorName = item.autor || '';
              break;
            case 'aula':
              authorName = item.canal || '';
              break;
            case 'podcast':
              authorName = item.publicador || '';
              break;
          }
          
          // MELHORADO: Filtros mais rigorosos para excluir autores inválidos
          if (authorName && 
              authorName.trim() !== '' &&
              authorName !== 'Autor desconhecido' && 
              authorName !== 'Canal desconhecido' && 
              authorName !== 'Publicador desconhecido' &&
              authorName.toLowerCase() !== 'null' &&
              authorName.toLowerCase() !== 'undefined' &&
              authorName.length > 1) {
            typeAuthors.set(authorName.trim(), (typeAuthors.get(authorName.trim()) || 0) + 1);
          }
        });
        
        // Adicionar ao array final
        typeAuthors.forEach((count, name) => {
          allAuthors.push({
            name,
            count,
            type: tipo === 'livro' ? 'titulo' : tipo === 'aula' ? 'video' : 'podcast'
          });
        });
        
        console.log(`👥 Extracted ${typeAuthors.size} unique authors from ${tipo}`);
        
      } catch (error) {
        console.error(`❌ Error fetching authors from ${tipo}:`, error);
      }
    }
    
    // Consolidar autores com mesmo nome mas de tipos diferentes
    const consolidatedAuthors = new Map<string, { name: string; count: number; types: string[] }>();
    
    allAuthors.forEach(author => {
      const existing = consolidatedAuthors.get(author.name);
      if (existing) {
        existing.count += author.count;
        if (!existing.types.includes(author.type)) {
          existing.types.push(author.type);
        }
      } else {
        consolidatedAuthors.set(author.name, {
          name: author.name,
          count: author.count,
          types: [author.type]
        });
      }
    });
    
    // REMOVIDO: Limite de 100 autores - agora retorna todos
    const finalAuthors = Array.from(consolidatedAuthors.values())
      .sort((a, b) => b.count - a.count);
    
    console.log(`👥 Final consolidated authors: ${finalAuthors.length} (was limited to 100 before)`);
    
    // Cachear resultado
    authorsCache.set(cacheKey, { authors: finalAuthors, timestamp: Date.now() });
    
    return new Response(JSON.stringify({
      success: true,
      authors: finalAuthors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('❌ Error fetching all authors:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch authors',
      authors: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Função para transformar item em resultado de busca
function transformToSearchResult(item: any, tipo: string): any {
  const baseResult = {
    id: Math.floor(Math.random() * 10000) + 1000,
    originalId: item.id,
    title: item.titulo || item.podcast_titulo || item.title || 'Título não disponível',
    author: getAuthorByType(item, tipo),
    year: getYearByType(item, tipo), // MELHORADO: função atualizada
    description: item.descricao || 'Descrição não disponível',
    subject: getSubjectByType(item, tipo),
    type: tipo === 'livro' ? 'titulo' : tipo === 'aula' ? 'video' : 'podcast',
    thumbnail: item.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
    language: getLanguageByType(item, tipo),
    pais: item.pais
  };

  if (tipo === 'livro') {
    return {
      ...baseResult,
      pdfUrl: item.arquivo,
      pages: item.paginas
    };
  } else if (tipo === 'aula') {
    return {
      ...baseResult,
      embedUrl: item.embed_url,
      duration: item.duracao ? formatVideoDuration(item.duracao) : undefined,
      channel: item.canal || undefined // NOVO: Extrair canal para vídeos
    };
  } else if (tipo === 'podcast') {
    return {
      ...baseResult,
      duration: item.duracao_ms ? formatPodcastDuration(item.duracao_ms) : undefined,
      embedUrl: item.embed_url,
      program: item.podcast_titulo || undefined // NOVO: Extrair programa para podcasts
    };
  }

  return baseResult;
}

function getAuthorByType(item: any, tipo: string): string {
  switch (tipo) {
    case 'livro':
      return item.autor || 'Autor desconhecido';
    case 'aula':
      return item.canal || 'Canal desconhecido';
    case 'podcast':
      return item.publicador || 'Publicador desconhecido';
    default:
      return 'Link Business School';
  }
}

// MELHORADO: Função getYearByType para lidar melhor com anos inválidos
function getYearByType(item: any, tipo: string): number | null {
  let year: number = 0;
  
  switch (tipo) {
    case 'livro':
      year = item.ano ? parseInt(item.ano) : 0;
      break;
    case 'podcast':
      if (item.data_lancamento) {
        const yearFromDate = parseInt(item.data_lancamento.split('-')[0]);
        year = isNaN(yearFromDate) ? 0 : yearFromDate;
      }
      break;
    case 'aula':
      // Vídeos normalmente não têm ano na API
      year = 0;
      break;
    default:
      year = 0;
  }
  
  // MELHORADO: Retornar null se o ano não for válido
  const currentYear = new Date().getFullYear();
  if (year > 1900 && year <= currentYear) {
    return year;
  }
  
  // Retornar null em vez de ano atual como fallback
  return null;
}

function getSubjectByType(item: any, tipo: string): string {
  switch (tipo) {
    case 'livro':
    case 'aula':
      return getSubjectFromCategories(item.categorias) || getDefaultSubject(tipo);
    case 'podcast':
      return getDefaultSubject(tipo);
    default:
      return getDefaultSubject(tipo);
  }
}

function getLanguageByType(item: any, tipo: string): string | undefined {
  switch (tipo) {
    case 'livro':
      return item.language;
    case 'aula':
      return undefined;
    case 'podcast':
      return undefined;
    default:
      return undefined;
  }
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

function formatPodcastDuration(durationMs: number): string {
  const minutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}

function formatVideoDuration(duration: number): string {
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
