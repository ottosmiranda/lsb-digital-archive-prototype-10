
import { useState, useEffect, useMemo, useCallback } from 'react';
import { SearchFilters, SearchResult } from '@/types/searchTypes';
import { useSearchState } from '@/hooks/useSearchState';
import { useApiSearch } from '@/hooks/useApiSearch';
import { useFilteredSearch } from '@/hooks/useFilteredSearch';
import { checkHasActiveFilters } from '@/utils/searchUtils';

interface SearchResponse {
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
}

export const useSearchResults = () => {
  const resultsPerPage = 9;
  
  const {
    query,
    filters,
    sortBy,
    currentPage,
    setFilters,
    setSortBy,
    setCurrentPage,
    setQuery
  } = useSearchState();

  // Use both regular and filtered search hooks
  const { search: regularSearch, loading: regularLoading, error: regularError, clearCache: clearRegularCache } = useApiSearch({ resultsPerPage });
  const { search: filteredSearch, loading: filteredLoading, error: filteredError, clearCache: clearFilteredCache, cancelSearch } = useFilteredSearch({ resultsPerPage });
  
  const [searchResponse, setSearchResponse] = useState<SearchResponse>({
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
      appliedFilters: {
        resourceType: [],
        subject: [],
        author: [],
        year: '',
        duration: '',
        language: [],
        documentType: [],
        program: [],
        channel: []
      },
      sortBy: 'relevance'
    }
  });

  const [usingFallback, setUsingFallback] = useState(false);

  // Determine if we should use optimized filtered search
  const shouldUseOptimizedSearch = useMemo((): boolean => {
    const hasSpecificFilters = filters.resourceType.length > 0 && !filters.resourceType.includes('all');
    const hasOtherFilters = filters.subject.length > 0 || filters.author.length > 0 || 
                           filters.year || filters.duration || filters.language.length > 0 ||
                           filters.documentType.length > 0 || filters.program.length > 0 || 
                           filters.channel.length > 0;
    
    return hasSpecificFilters || hasOtherFilters;
  }, [filters]);

  const hasActiveFilters = useMemo((): boolean => {
    return checkHasActiveFilters(filters);
  }, [filters]);

  const shouldSearch = useMemo((): boolean => {
    const hasQuery = query.trim() !== '';
    const hasResourceTypeFilters = filters.resourceType.length > 0;
    const hasOtherFilters = hasActiveFilters;
    
    return hasQuery || hasResourceTypeFilters || hasOtherFilters;
  }, [query, filters.resourceType, hasActiveFilters]);

  // Get current loading state based on which service is being used
  const loading = shouldUseOptimizedSearch ? filteredLoading : regularLoading;
  const error = shouldUseOptimizedSearch ? filteredError : regularError;

  const performSearch = useCallback(async () => {
    const requestId = `search_${Date.now()}`;
    console.group(`🔍 ${requestId} - Search Decision`);
    console.log('📋 Search params:', { 
      query, 
      filters, 
      sortBy, 
      currentPage, 
      shouldSearch,
      shouldUseOptimizedSearch,
      hasActiveFilters
    });

    // Cancel any ongoing filtered search
    cancelSearch();

    if (!shouldSearch) {
      console.log('❌ Should not search - clearing results');
      setSearchResponse({
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
          appliedFilters: filters,
          sortBy
        }
      });
      console.groupEnd();
      return;
    }

    try {
      let response;

      if (shouldUseOptimizedSearch) {
        console.log('🚀 Using OPTIMIZED filtered search for better performance');
        response = await filteredSearch(query, filters, sortBy, currentPage);
      } else {
        console.log('📡 Using regular search');
        response = await regularSearch(query, filters, sortBy, currentPage);
      }
      
      if (!response.results || !Array.isArray(response.results)) {
        console.error('❌ Invalid search response:', response);
        throw new Error('Invalid search response structure');
      }
      
      setSearchResponse({
        results: response.results,
        pagination: response.pagination,
        searchInfo: response.searchInfo
      });

      setUsingFallback(!response.success);

      if (response.error) {
        console.warn('⚠️ Search completed with errors:', response.error);
      } else {
        console.log('✅ Search successful:', {
          results: response.results.length,
          totalResults: response.pagination.totalResults,
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          optimized: shouldUseOptimizedSearch ? '🚀 YES' : '📡 NO'
        });
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('🚫 Search was cancelled');
        console.groupEnd();
        return;
      }
      
      console.error('❌ Search failed:', err);
      setUsingFallback(true);
      
      setSearchResponse({
        results: [],
        pagination: {
          currentPage,
          totalPages: 0,
          totalResults: 0,
          hasNextPage: false,
          hasPreviousPage: false
        },
        searchInfo: {
          query,
          appliedFilters: filters,
          sortBy
        }
      });
    }
    
    console.groupEnd();
  }, [query, filters, sortBy, currentPage, shouldSearch, shouldUseOptimizedSearch, regularSearch, filteredSearch, cancelSearch]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleFilterChange = useCallback((newFilters: SearchFilters, options?: { authorTyping?: boolean }) => {
    console.log('🔄 Filter change:', { newFilters, options });
    setFilters(newFilters);
    
    if (!options?.authorTyping) {
      setCurrentPage(1);
    }
  }, [setFilters, setCurrentPage]);

  const handleSortChange = useCallback((newSort: string) => {
    console.log('📊 Sort changed to:', newSort);
    setSortBy(newSort);
    setCurrentPage(1);
  }, [setSortBy, setCurrentPage]);

  const handlePageChange = useCallback((page: number) => {
    console.log('📄 Page changed to:', page);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setCurrentPage]);

  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refresh requested - clearing all caches');
    clearRegularCache();
    clearFilteredCache();
    await performSearch();
  }, [clearRegularCache, clearFilteredCache, performSearch]);

  return {
    query,
    filters,
    sortBy,
    currentResults: searchResponse.results,
    totalResults: searchResponse.pagination.totalResults,
    totalPages: searchResponse.pagination.totalPages,
    currentPage: searchResponse.pagination.currentPage,
    loading,
    hasActiveFilters,
    usingFallback,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    setFilters,
    setQuery,
    forceRefresh
  };
};
