
import { useState, useCallback } from 'react';
import { SearchFilters } from '@/types/searchTypes';
import { SearchResponse, UseApiSearchProps } from './types';
import { SearchCache } from './searchCache';
import { SearchService } from './searchService';

export const useApiSearch = ({ resultsPerPage = 9 }: UseApiSearchProps = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCache] = useState(() => new SearchCache());
  const [searchService] = useState(() => new SearchService());

  const search = useCallback(async (
    query: string,
    filters: SearchFilters,
    sortBy: string,
    page: number = 1
  ): Promise<SearchResponse> => {
    const cacheKey = searchCache.getCacheKey(query, filters, sortBy, page);
    
    // Verificar cache válido
    if (searchCache.isValidCache(cacheKey)) {
      const cached = searchCache.getCache(cacheKey);
      if (cached) {
        console.log('📦 Cache HIT:', { 
          results: cached.results.length,
          totalResults: cached.pagination.totalResults 
        });
        return cached;
      }
    }

    console.log('🌐 Making API request to edge function...');
    setLoading(true);
    setError(null);

    try {
      const response = await searchService.executeSearch(
        query,
        filters,
        sortBy,
        page,
        resultsPerPage
      );

      searchCache.setCache(cacheKey, response);
      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      
      // Retornar resposta vazia em caso de erro
      const errorResponse: SearchResponse = {
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
      setLoading(false);
    }
  }, [resultsPerPage, searchCache, searchService]);

  const clearCache = useCallback(() => {
    searchCache.clearCache();
  }, [searchCache]);

  const prefetchNextPage = useCallback(async (
    query: string,
    filters: SearchFilters,
    sortBy: string,
    currentPage: number
  ) => {
    const nextPage = currentPage + 1;
    const cacheKey = searchCache.getCacheKey(query, filters, sortBy, nextPage);
    
    if (!searchCache.isValidCache(cacheKey)) {
      console.log('🔮 Prefetching page:', nextPage);
      search(query, filters, sortBy, nextPage).catch(err => {
        console.warn('⚠️ Prefetch failed:', err);
      });
    }
  }, [search, searchCache]);

  return {
    search,
    loading,
    error,
    clearCache,
    prefetchNextPage
  };
};

// Re-export types for convenience
export type { SearchResponse, UseApiSearchProps } from './types';
