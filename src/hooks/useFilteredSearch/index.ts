
import { useState, useCallback, useRef } from 'react';
import { SearchFilters, SearchResult } from '@/types/searchTypes';
import { FilteredSearchCache } from './filteredSearchCache';
import { FilteredSearchService } from './filteredSearchService';

export interface FilteredSearchResponse {
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

export interface UseFilteredSearchProps {
  resultsPerPage?: number;
}

export const useFilteredSearch = ({ resultsPerPage = 9 }: UseFilteredSearchProps = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCache] = useState(() => new FilteredSearchCache());
  const [searchService] = useState(() => new FilteredSearchService());
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(async (
    query: string,
    filters: SearchFilters,
    sortBy: string,
    page: number = 1
  ): Promise<FilteredSearchResponse> => {
    // Cancel previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    const cacheKey = searchCache.getCacheKey(query, filters, sortBy, page);
    
    // Check cache first for instant response
    if (searchCache.isValidCache(cacheKey)) {
      const cached = searchCache.getCache(cacheKey);
      if (cached) {
        console.log('📦 Filter Cache HIT:', { 
          results: cached.results.length,
          totalResults: cached.pagination.totalResults,
          page: cached.pagination.currentPage
        });
        return cached;
      }
    }

    console.log('🔍 Filter search request:', { query, filters, sortBy, page });
    setLoading(true);
    setError(null);

    try {
      const response = await searchService.executeFilteredSearch(
        query,
        filters,
        sortBy,
        page,
        resultsPerPage,
        abortController.signal
      );

      // Only cache if request wasn't aborted
      if (!abortController.signal.aborted) {
        searchCache.setCache(cacheKey, response);
        
        // Prefetch next page in background if exists
        if (response.pagination.hasNextPage) {
          setTimeout(() => {
            searchService.prefetchPage(query, filters, sortBy, page + 1, resultsPerPage)
              .then(prefetchResponse => {
                const nextPageKey = searchCache.getCacheKey(query, filters, sortBy, page + 1);
                searchCache.setCache(nextPageKey, prefetchResponse);
                console.log('🔮 Prefetched page:', page + 1);
              })
              .catch(err => console.warn('⚠️ Prefetch failed:', err));
          }, 100);
        }
      }

      return response;

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('🚫 Filter search aborted');
        throw err;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Filter search failed';
      setError(errorMessage);
      
      const errorResponse: FilteredSearchResponse = {
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
          query,
          appliedFilters: filters,
          sortBy
        },
        error: errorMessage
      };
      
      return errorResponse;
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
      abortControllerRef.current = null;
    }
  }, [resultsPerPage, searchCache, searchService]);

  const clearCache = useCallback(() => {
    searchCache.clearCache();
  }, [searchCache]);

  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  }, []);

  return {
    search,
    loading,
    error,
    clearCache,
    cancelSearch
  };
};
