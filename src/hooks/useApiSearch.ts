
import { useState, useCallback } from 'react';
import { SearchResult, SearchFilters } from '@/types/searchTypes';
import { supabase } from '@/integrations/supabase/client';

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

interface UseApiSearchProps {
  resultsPerPage?: number;
}

export const useApiSearch = ({ resultsPerPage = 9 }: UseApiSearchProps = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCache, setSearchCache] = useState<Map<string, { data: SearchResponse; timestamp: number }>>(new Map());

  const getCacheKey = (query: string, filters: SearchFilters, sortBy: string, page: number): string => {
    return JSON.stringify({ query, filters, sortBy, page });
  };

  const isValidCache = (cacheKey: string): boolean => {
    const cached = searchCache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    const cacheAge = now - cached.timestamp;
    const cacheLimit = 5 * 60 * 1000; // 5 minutos
    
    return cacheAge < cacheLimit;
  };

  const search = useCallback(async (
    query: string,
    filters: SearchFilters,
    sortBy: string,
    page: number = 1
  ): Promise<SearchResponse> => {
    const cacheKey = getCacheKey(query, filters, sortBy, page);
    
    // Verificar cache
    if (isValidCache(cacheKey)) {
      const cached = searchCache.get(cacheKey);
      console.log('🎯 Cache hit for search:', { query, page });
      return cached!.data;
    }

    console.log('🔍 API search request:', { query, filters, sortBy, page });
    setLoading(true);
    setError(null);

    try {
      const { data, error: searchError } = await supabase.functions.invoke('search-content', {
        body: {
          query: query.trim() || undefined,
          filters,
          sortBy,
          page,
          limit: resultsPerPage
        }
      });

      if (searchError) {
        throw new Error(`Search function error: ${searchError.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      const response: SearchResponse = data;
      
      // Atualizar cache
      setSearchCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, {
          data: response,
          timestamp: Date.now()
        });
        return newCache;
      });

      console.log('✅ Search completed:', {
        query,
        page,
        totalResults: response.pagination.totalResults,
        currentResults: response.results.length
      });

      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      console.error('❌ Search error:', errorMessage);
      setError(errorMessage);
      
      // Retornar resposta vazia em caso de erro
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
          query,
          appliedFilters: filters,
          sortBy
        },
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [resultsPerPage]);

  const clearCache = useCallback(() => {
    setSearchCache(new Map());
    console.log('🧹 Search cache cleared');
  }, []);

  return {
    search,
    loading,
    error,
    clearCache
  };
};
