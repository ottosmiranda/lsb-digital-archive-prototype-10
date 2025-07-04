
import { useState, useEffect, useCallback, useRef } from 'react';
import { SearchResult } from '@/types/searchTypes';
import { supabase } from '@/integrations/supabase/client';
import { useCacheManager } from './useCacheManager';

interface InfiniteContentState {
  [key: string]: {
    items: SearchResult[];
    currentPage: number;
    totalPages: number;
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    loadingPages: Set<number>;
  };
}

interface UseInfiniteContentLoaderOptions {
  preloadThreshold?: number; // Percentage of scroll to trigger preload (default: 70)
  pageSize?: number; // Items per page (default: 10)
  enablePreloading?: boolean; // Enable preloading next page (default: true)
}

export const useInfiniteContentLoader = (options: UseInfiniteContentLoaderOptions = {}) => {
  const { preloadThreshold = 70, pageSize = 10, enablePreloading = true } = options;
  
  const cache = useCacheManager<SearchResult>('infinite_content', { ttl: 30 * 60 * 1000 }); // 30 min cache
  const [state, setState] = useState<InfiniteContentState>({});
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Refs to track loading states and prevent duplicate requests
  const loadingRef = useRef<Set<string>>(new Set());
  const preloadingRef = useRef<Set<string>>(new Set());

  const initializeType = useCallback((type: string) => {
    if (!state[type]) {
      setState(prev => ({
        ...prev,
        [type]: {
          items: [],
          currentPage: 0,
          totalPages: 1,
          loading: false,
          error: null,
          hasMore: true,
          loadingPages: new Set()
        }
      }));
    }
  }, [state]);

  const fetchPage = useCallback(async (type: string, page: number, isPreload = false): Promise<SearchResult[]> => {
    const requestKey = `${type}_${page}`;
    
    // Prevent duplicate requests
    if (loadingRef.current.has(requestKey)) {
      console.log(`🔄 Request already in progress: ${requestKey}`);
      return [];
    }

    // Check cache first
    const cachedData = cache.getCache(type, page);
    if (cachedData && cachedData.length > 0) {
      console.log(`📦 Using cached data for ${type} page ${page}`);
      return cachedData;
    }

    loadingRef.current.add(requestKey);
    
    try {
      console.log(`🚀 Fetching ${type} page ${page}${isPreload ? ' (preload)' : ''}`);
      
      let functionName: string;
      switch (type) {
        case 'video':
          functionName = 'fetch-videos';
          break;
        case 'titulo':
          functionName = 'fetch-books';
          break;
        case 'podcast':
          functionName = 'fetch-podcasts';
          break;
        default:
          throw new Error(`Unknown content type: ${type}`);
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { page, limit: pageSize }
      });

      if (error) {
        console.error(`❌ Error fetching ${type} page ${page}:`, error);
        throw error;
      }

      if (!data.success) {
        console.error(`❌ API error for ${type} page ${page}:`, data.error);
        throw new Error(data.error);
      }

      const items = data[type === 'titulo' ? 'books' : type === 'video' ? 'videos' : 'podcasts'] || [];
      
      // Cache the results
      cache.setCache(type, page, items, {
        totalPages: data.totalPages || 1,
        totalItems: data.total || items.length
      });

      console.log(`✅ Fetched ${items.length} ${type} items for page ${page}`);
      return items;
      
    } catch (error) {
      console.error(`❌ Failed to fetch ${type} page ${page}:`, error);
      throw error;
    } finally {
      loadingRef.current.delete(requestKey);
    }
  }, [cache, pageSize]);

  const loadNextPage = useCallback(async (type: string, isPreload = false) => {
    initializeType(type);
    
    const currentState = state[type];
    if (!currentState || currentState.loading || !currentState.hasMore) {
      return;
    }

    const nextPage = currentState.currentPage + 1;
    
    setState(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        loading: !isPreload,
        loadingPages: new Set([...prev[type].loadingPages, nextPage])
      }
    }));

    try {
      const newItems = await fetchPage(type, nextPage, isPreload);
      
      setState(prev => {
        const updatedLoadingPages = new Set(prev[type].loadingPages);
        updatedLoadingPages.delete(nextPage);
        
        return {
          ...prev,
          [type]: {
            ...prev[type],
            items: [...prev[type].items, ...newItems],
            currentPage: nextPage,
            loading: false,
            error: null,
            hasMore: newItems.length === pageSize,
            loadingPages: updatedLoadingPages
          }
        };
      });

      // Preload next page if enabled and not already preloading
      if (enablePreloading && !isPreload && newItems.length === pageSize) {
        const preloadKey = `${type}_${nextPage + 1}`;
        if (!preloadingRef.current.has(preloadKey)) {
          preloadingRef.current.add(preloadKey);
          setTimeout(() => {
            fetchPage(type, nextPage + 1, true).finally(() => {
              preloadingRef.current.delete(preloadKey);
            });
          }, 1000); // Delay preload by 1 second
        }
      }
      
    } catch (error) {
      setState(prev => {
        const updatedLoadingPages = new Set(prev[type].loadingPages);
        updatedLoadingPages.delete(nextPage);
        
        return {
          ...prev,
          [type]: {
            ...prev[type],
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load content',
            loadingPages: updatedLoadingPages
          }
        };
      });
    }
  }, [state, initializeType, fetchPage, enablePreloading, pageSize]);

  const retryPage = useCallback(async (type: string, page: number) => {
    console.log(`🔄 Retrying ${type} page ${page}`);
    
    setState(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        error: null,
        loadingPages: new Set([...prev[type].loadingPages, page])
      }
    }));

    try {
      const items = await fetchPage(type, page);
      
      setState(prev => {
        const updatedLoadingPages = new Set(prev[type].loadingPages);
        updatedLoadingPages.delete(page);
        
        // If this is page 1, replace items; otherwise append
        const newItems = page === 1 ? items : [...prev[type].items, ...items];
        
        return {
          ...prev,
          [type]: {
            ...prev[type],
            items: newItems,
            currentPage: Math.max(prev[type].currentPage, page),
            error: null,
            hasMore: items.length === pageSize,
            loadingPages: updatedLoadingPages
          }
        };
      });
      
    } catch (error) {
      setState(prev => {
        const updatedLoadingPages = new Set(prev[type].loadingPages);
        updatedLoadingPages.delete(page);
        
        return {
          ...prev,
          [type]: {
            ...prev[type],
            error: error instanceof Error ? error.message : 'Failed to retry loading',
            loadingPages: updatedLoadingPages
          }
        };
      });
    }
  }, [fetchPage, pageSize]);

  const loadInitialData = useCallback(async () => {
    console.log('🚀 Loading initial data for all content types...');
    setInitialLoading(true);
    
    const types = ['video', 'titulo', 'podcast'];
    const promises = types.map(async (type) => {
      initializeType(type);
      try {
        const items = await fetchPage(type, 1);
        setState(prev => ({
          ...prev,
          [type]: {
            items,
            currentPage: 1,
            totalPages: 1, // Will be updated by cache meta
            loading: false,
            error: null,
            hasMore: items.length === pageSize,
            loadingPages: new Set()
          }
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          [type]: {
            items: [],
            currentPage: 0,
            totalPages: 1,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load initial data',
            hasMore: false,
            loadingPages: new Set()
          }
        }));
      }
    });

    await Promise.allSettled(promises);
    setInitialLoading(false);
    console.log('✅ Initial data loading completed');
  }, [initializeType, fetchPage, pageSize]);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const getAllItems = useCallback(() => {
    const allItems: SearchResult[] = [];
    Object.values(state).forEach(typeState => {
      allItems.push(...typeState.items);
    });
    return allItems;
  }, [state]);

  const getItemsByType = useCallback((type: string) => {
    return state[type]?.items || [];
  }, [state]);

  const getLoadingState = useCallback((type?: string) => {
    if (type) {
      return state[type]?.loading || false;
    }
    return Object.values(state).some(typeState => typeState.loading) || initialLoading;
  }, [state, initialLoading]);

  const hasError = useCallback((type?: string) => {
    if (type) {
      return state[type]?.error || null;
    }
    return Object.values(state).find(typeState => typeState.error)?.error || null;
  }, [state]);

  return {
    // Data
    getAllItems,
    getItemsByType,
    
    // Loading states
    loading: initialLoading,
    getLoadingState,
    hasError,
    
    // Actions
    loadNextPage,
    retryPage,
    
    // State
    state,
    
    // Cache management
    clearCache: cache.clearCache,
    getCacheStats: cache.getCacheStats
  };
};
