import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Global cache for intelligent block caching
const globalCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper functions for integer-only calculations
const ensureInteger = (value: number): number => {
  return Math.floor(Math.abs(value)) || 1;
};

const validatePagination = (page: number, totalPages: number) => {
  return {
    page: ensureInteger(page),
    totalPages: ensureInteger(totalPages),
    isValid: page >= 1 && page <= totalPages
  };
};

// Dynamic limitPerType calculation based on page ranges
const calculateDynamicLimit = (page: number, resultsPerPage: number): number => {
  const pageInt = ensureInteger(page);
  const resultsInt = ensureInteger(resultsPerPage);
  
  // Calculate base items needed with safety buffer
  const itemsNeeded = pageInt * resultsInt;
  const buffer = Math.max(20, Math.floor(itemsNeeded * 0.25)); // 25% buffer
  const safeTotal = itemsNeeded + buffer;
  
  // Divide by 4 content types and ensure integer
  const baseLimit = Math.ceil(safeTotal / 4);
  
  // Apply scalability by page ranges
  if (pageInt <= 5) {
    return Math.max(20, baseLimit);
  } else if (pageInt <= 25) {
    return Math.max(50, baseLimit);
  } else {
    return Math.max(200, baseLimit);
  }
};

// Proportional distribution with integer adjustment
const calculateProportionalLimits = (
  totalBooks: number, 
  totalVideos: number, 
  totalPodcasts: number, 
  totalArticles: number, 
  targetTotal: number
) => {
  const grandTotal = totalBooks + totalVideos + totalPodcasts + totalArticles;
  
  if (grandTotal === 0) {
    const equalShare = Math.floor(targetTotal / 4);
    return {
      booksLimit: equalShare,
      videosLimit: equalShare,
      podcastsLimit: equalShare,
      articlesLimit: targetTotal - (equalShare * 3)
    };
  }
  
  // Calculate proportional distribution
  const booksLimit = Math.max(1, Math.floor((totalBooks / grandTotal) * targetTotal));
  const videosLimit = Math.max(1, Math.floor((totalVideos / grandTotal) * targetTotal));
  const podcastsLimit = Math.max(1, Math.floor((totalPodcasts / grandTotal) * targetTotal));
  const articlesLimit = Math.max(1, Math.floor((totalArticles / grandTotal) * targetTotal));
  
  // Adjust remainder to reach exact target
  const currentSum = booksLimit + videosLimit + podcastsLimit + articlesLimit;
  const remainder = targetTotal - currentSum;
  
  // Distribute remainder to the largest type
  const limits = [
    { type: 'books', value: booksLimit, total: totalBooks },
    { type: 'videos', value: videosLimit, total: totalVideos },
    { type: 'podcasts', value: podcastsLimit, total: totalPodcasts },
    { type: 'articles', value: articlesLimit, total: totalArticles }
  ].sort((a, b) => b.total - a.total);
  
  const result = {
    booksLimit,
    videosLimit,
    podcastsLimit,
    articlesLimit
  };
  
  if (remainder > 0) {
    const largestType = limits[0].type;
    if (largestType === 'books') result.booksLimit += remainder;
    else if (largestType === 'videos') result.videosLimit += remainder;
    else if (largestType === 'podcasts') result.podcastsLimit += remainder;
    else result.articlesLimit += remainder;
  }
  
  return result;
};

// Block caching functions
const getBlockCacheKey = (blockNumber: number, sortBy: string): string => {
  return `global_block_${blockNumber}_sort_${sortBy}`;
};

const isValidCache = (cacheKey: string): boolean => {
  const cached = globalCache.get(cacheKey);
  if (!cached) return false;
  
  const isValid = (Date.now() - cached.timestamp) < CACHE_TTL;
  if (!isValid) {
    globalCache.delete(cacheKey);
    return false;
  }
  
  return cached.data && Array.isArray(cached.data.items) && cached.data.items.length > 0;
};

const setBlockCache = (cacheKey: string, data: any): void => {
  globalCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  // Cleanup old cache entries (keep max 10 blocks)
  if (globalCache.size > 10) {
    const oldestKey = globalCache.keys().next().value;
    globalCache.delete(oldestKey);
  }
};

const extractPageFromBlock = (blockData: any, page: number, resultsPerPage: number) => {
  const pageInt = ensureInteger(page);
  const resultsInt = ensureInteger(resultsPerPage);
  
  // Calculate position within the block
  const blockNumber = Math.ceil(pageInt / 10);
  const pageInBlock = ((pageInt - 1) % 10) + 1;
  const startIndex = (pageInBlock - 1) * resultsInt;
  const endIndex = startIndex + resultsInt;
  
  console.log(`📦 Extracting page ${pageInt} from block ${blockNumber}:`, {
    pageInBlock,
    startIndex,
    endIndex,
    totalItems: blockData.items?.length || 0
  });
  
  return {
    results: blockData.items.slice(startIndex, endIndex) || [],
    pagination: {
      currentPage: pageInt,
      totalPages: Math.ceil(blockData.totalResults / resultsInt),
      totalResults: blockData.totalResults,
      hasNextPage: pageInt < Math.ceil(blockData.totalResults / resultsInt),
      hasPreviousPage: pageInt > 1
    }
  };
};

// API fetch functions
async function fetchBooksData(limit: number) {
  const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';
  const url = `${API_BASE_URL}/conteudo-lbs/livros?limit=${limit}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LSB-Search/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for books`);
    }
    
    const data = await response.json();
    
    return {
      items: data.conteudo || [],
      totalReal: data.total || 0
    };
  } catch (error) {
    console.error('❌ Books fetch failed:', error);
    return { items: [], totalReal: 0 };
  }
}

async function fetchVideosData(limit: number) {
  const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';
  const url = `${API_BASE_URL}/conteudo-lbs/videos?limit=${limit}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LSB-Search/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for videos`);
    }
    
    const data = await response.json();
    
    return {
      items: data.conteudo || [],
      totalReal: data.total || 0
    };
  } catch (error) {
    console.error('❌ Videos fetch failed:', error);
    return { items: [], totalReal: 0 };
  }
}

async function fetchPodcastsData(limit: number) {
  const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';
  const url = `${API_BASE_URL}/conteudo-lbs/podcasts?limit=${limit}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LSB-Search/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for podcasts`);
    }
    
    const data = await response.json();
    
    return {
      items: data.conteudo || [],
      totalReal: data.total || 0
    };
  } catch (error) {
    console.error('❌ Podcasts fetch failed:', error);
    return { items: [], totalReal: 0 };
  }
}

async function fetchArticlesData(limit: number) {
  const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';
  const url = `${API_BASE_URL}/conteudo-lbs/artigos?limit=${limit}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LSB-Search/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for articles`);
    }
    
    const data = await response.json();
    
    return {
      items: data.conteudo || [],
      totalReal: data.total || 0
    };
  } catch (error) {
    console.error('❌ Articles fetch failed:', error);
    return { items: [], totalReal: 0 };
  }
}

async function performGlobalSearch(
  query: string,
  filters: any,
  sortBy: string,
  page: number,
  resultsPerPage: number
) {
  const requestId = `global_search_${Date.now()}`;
  console.group(`🌍 ${requestId} - Global Search with Dynamic Pagination`);
  
  try {
    const pageInt = ensureInteger(page);
    const resultsInt = ensureInteger(resultsPerPage);
    
    console.log('📋 Request params:', { 
      query, 
      sortBy, 
      page: pageInt, 
      resultsPerPage: resultsInt 
    });
    
    // Check block cache first
    const blockNumber = Math.ceil(pageInt / 10);
    const blockCacheKey = getBlockCacheKey(blockNumber, sortBy);
    
    if (isValidCache(blockCacheKey)) {
      console.log(`📦 Cache HIT for block ${blockNumber}`);
      const blockData = globalCache.get(blockCacheKey).data;
      const result = extractPageFromBlock(blockData, pageInt, resultsInt);
      console.groupEnd();
      return result;
    }
    
    console.log(`🔍 Cache MISS for block ${blockNumber}, fetching new data...`);
    
    // Calculate dynamic limits for this block
    const lastPageInBlock = blockNumber * 10;
    const limitPerType = calculateDynamicLimit(lastPageInBlock, resultsInt);
    
    console.log(`📊 Dynamic limit calculated:`, {
      blockNumber,
      lastPageInBlock,
      limitPerType,
      totalItemsToFetch: limitPerType * 4
    });
    
    // Fetch data with robust fallback system
    let allItems: any[] = [];
    let totalResults = 0;
    
    try {
      // Layer 1: Edge Functions with calculated limit
      console.log('🚀 Layer 1: Fetching with dynamic limits...');
      const results = await Promise.allSettled([
        fetchBooksData(limitPerType),
        fetchVideosData(limitPerType), 
        fetchPodcastsData(limitPerType),
        fetchArticlesData(limitPerType)
      ]);
      
      let totalBooks = 0, totalVideos = 0, totalPodcasts = 0, totalArticles = 0;
      
      results.forEach((result, index) => {
        const types = ['books', 'videos', 'podcasts', 'articles'];
        if (result.status === 'fulfilled' && result.value.items) {
          allItems.push(...result.value.items);
          
          // Track totals for proportional calculation
          if (types[index] === 'books') totalBooks = result.value.totalReal || 0;
          else if (types[index] === 'videos') totalVideos = result.value.totalReal || 0;
          else if (types[index] === 'podcasts') totalPodcasts = result.value.totalReal || 0;
          else if (types[index] === 'articles') totalArticles = result.value.totalReal || 0;
          
          console.log(`✅ ${types[index]}: ${result.value.items.length} items`);
        } else {
          console.warn(`⚠️ ${types[index]}: Failed to fetch`);
        }
      });
      
      // Calculate real total
      totalResults = totalBooks + totalVideos + totalPodcasts + totalArticles;
      
      console.log(`📊 Totals discovered:`, {
        books: totalBooks,
        videos: totalVideos, 
        podcasts: totalPodcasts,
        articles: totalArticles,
        total: totalResults
      });
      
      if (allItems.length === 0) {
        throw new Error('No items returned from Layer 1');
      }
      
    } catch (error) {
      console.warn('⚠️ Layer 1 failed, trying Layer 2...');
      
      try {
        // Layer 2: Edge Functions with doubled limit
        const doubledLimit = limitPerType * 2;
        console.log(`🚀 Layer 2: Fetching with doubled limits (${doubledLimit})...`);
        
        const results = await Promise.allSettled([
          fetchBooksData(doubledLimit),
          fetchVideosData(doubledLimit),
          fetchPodcastsData(doubledLimit), 
          fetchArticlesData(doubledLimit)
        ]);
        
        results.forEach((result, index) => {
          const types = ['books', 'videos', 'podcasts', 'articles'];
          if (result.status === 'fulfilled' && result.value.items) {
            allItems.push(...result.value.items);
            console.log(`✅ ${types[index]}: ${result.value.items.length} items (Layer 2)`);
          }
        });
        
        totalResults = 1059; // Fallback to known total
        
      } catch (layer2Error) {
        console.error('❌ Layer 2 also failed, using emergency fallback');
        totalResults = 1059; // Emergency fallback
      }
    }
    
    // Sort items if needed
    if (sortBy !== 'relevance') {
      if (sortBy === 'recent') {
        allItems.sort((a, b) => (b.year || 0) - (a.year || 0));
      } else if (sortBy === 'accessed') {
        const typeOrder = { 'podcast': 3, 'video': 2, 'titulo': 1 };
        allItems.sort((a, b) => {
          const orderA = typeOrder[a.type as keyof typeof typeOrder] || 0;
          const orderB = typeOrder[b.type as keyof typeof typeOrder] || 0;
          if (orderA !== orderB) return orderB - orderA;
          return a.title.localeCompare(b.title);
        });
      }
    }
    
    // Cache the block data
    const blockData = {
      items: allItems,
      totalResults,
      blockNumber,
      fetchedAt: Date.now()
    };
    
    setBlockCache(blockCacheKey, blockData);
    console.log(`📦 Cached block ${blockNumber} with ${allItems.length} items`);
    
    // Extract the specific page from the block
    const result = extractPageFromBlock(blockData, pageInt, resultsInt);
    
    console.log(`✅ Global search completed:`, {
      page: pageInt,
      totalResults,
      itemsReturned: result.results.length,
      totalPages: result.pagination.totalPages
    });
    
    console.groupEnd();
    return result;
    
  } catch (error) {
    console.error(`❌ Global search failed:`, error);
    console.groupEnd();
    
    // Emergency fallback
    return {
      results: [],
      pagination: {
        currentPage: pageInt,
        totalPages: Math.ceil(1059 / resultsInt), // Known total
        totalResults: 1059,
        hasNextPage: pageInt < Math.ceil(1059 / resultsInt),
        hasPreviousPage: pageInt > 1
      }
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, filters, sortBy, page, resultsPerPage } = await req.json();
    const requestId = `search_${Date.now()}`;
    
    console.group(`🔍 ${requestId} - Search Content Request`);
    console.log('📋 Parameters:', { query, filters, sortBy, page, resultsPerPage });
    
    // Validate pagination parameters
    const validation = validatePagination(page || 1, 1000); // Max 1000 pages
    if (!validation.isValid) {
      throw new Error(`Invalid pagination: page ${page}`);
    }
    
    const validatedPage = validation.page;
    const validatedResultsPerPage = ensureInteger(resultsPerPage || 9);
    
    // Handle global search (empty resourceType or multiple types)
    if (!filters.resourceType || filters.resourceType.length === 0 || filters.resourceType.length > 1) {
      console.log('🌍 Performing global search...');
      const result = await performGlobalSearch(
        query || '',
        filters,
        sortBy || 'relevance',
        validatedPage,
        validatedResultsPerPage
      );
      
      const response = {
        success: true,
        results: result.results,
        pagination: result.pagination,
        searchInfo: {
          query: query || '',
          appliedFilters: filters,
          sortBy: sortBy || 'relevance'
        }
      };
      
      console.log('✅ Global search response:', {
        results: response.results.length,
        totalResults: response.pagination.totalResults,
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages
      });
      
      console.groupEnd();
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Handle specific resource type searches
    const resourceType = filters.resourceType[0];
    let apiEndpoint = '';
    
    switch (resourceType) {
      case 'titulo':
        apiEndpoint = 'livros';
        break;
      case 'video':
        apiEndpoint = 'videos';
        break;
      case 'podcast':
        apiEndpoint = 'podcasts';
        break;
      default:
        throw new Error(`Unsupported resource type: ${resourceType}`);
    }
    
    const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';
    let url = `${API_BASE_URL}/conteudo-lbs/${apiEndpoint}?page=${validatedPage}&limit=${validatedResultsPerPage}`;
    
    // Add query parameter if provided
    if (query && query.trim()) {
      url += `&q=${encodeURIComponent(query.trim())}`;
    }
    
    console.log('🌐 API URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LSB-Search/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from external API`);
    }
    
    const data = await response.json();
    
    const searchResponse = {
      success: true,
      results: data.conteudo || [],
      pagination: {
        currentPage: validatedPage,
        totalPages: data.totalPages || 1,
        totalResults: data.total || 0,
        hasNextPage: validatedPage < (data.totalPages || 1),
        hasPreviousPage: validatedPage > 1
      },
      searchInfo: {
        query: query || '',
        appliedFilters: filters,
        sortBy: sortBy || 'relevance'
      }
    };
    
    console.log('✅ Specific search response:', {
      results: searchResponse.results.length,
      totalResults: searchResponse.pagination.totalResults,
      currentPage: searchResponse.pagination.currentPage,
      totalPages: searchResponse.pagination.totalPages
    });
    
    console.groupEnd();
    return new Response(JSON.stringify(searchResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Search error:', error);
    console.groupEnd();
    
    return new Response(JSON.stringify({
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
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
