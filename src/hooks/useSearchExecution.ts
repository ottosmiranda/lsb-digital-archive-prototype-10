
import { useCallback } from 'react';
import { SearchFilters } from '@/types/searchTypes';
import { useApiSearch } from '@/hooks/useApiSearch';
import { checkHasActiveFilters } from '@/utils/searchUtils';

interface UseSearchExecutionProps {
  resultsPerPage?: number;
  onSearchComplete: (response: any) => void;
  onSearchError: (error: string, filters: SearchFilters, sortBy: string, currentPage: number) => void;
  onUsingFallback: (usingFallback: boolean) => void;
}

export const useSearchExecution = ({ 
  resultsPerPage = 9, 
  onSearchComplete, 
  onSearchError,
  onUsingFallback 
}: UseSearchExecutionProps) => {
  const { search, loading, error, clearCache, prefetchNextPage } = useApiSearch({ resultsPerPage });

  const performSearch = useCallback(async (
    query: string, 
    filters: SearchFilters, 
    sortBy: string, 
    currentPage: number
  ) => {
    const hasActiveFilters = checkHasActiveFilters(filters);
    
    // Só buscar se houver query ou filtros ativos
    if (!query.trim() && !hasActiveFilters) {
      onSearchError('', filters, sortBy, currentPage);
      return;
    }

    console.log('🚀 Performing search:', { 
      query, 
      filters, 
      sortBy, 
      currentPage,
      hasActiveFilters 
    });

    try {
      const response = await search(query, filters, sortBy, currentPage);
      
      onSearchComplete({
        results: response.results,
        pagination: response.pagination,
        searchInfo: response.searchInfo
      });

      onUsingFallback(!response.success);

      if (response.error) {
        console.warn('⚠️ Search completed with errors:', response.error);
      } else {
        console.log('✅ Search results updated:', {
          totalResults: response.pagination.totalResults,
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          resultsInPage: response.results.length,
          isRealPagination: response.pagination.totalResults > 0
        });
        
        // Prefetch da próxima página se houver
        if (response.pagination.hasNextPage) {
          prefetchNextPage(query, filters, sortBy, currentPage);
        }
      }

    } catch (err) {
      console.error('❌ Search failed:', err);
      onUsingFallback(true);
      onSearchError(query, filters, sortBy, currentPage);
    }
  }, [search, onSearchComplete, onSearchError, onUsingFallback, prefetchNextPage]);

  const forceRefresh = useCallback(async (
    query: string, 
    filters: SearchFilters, 
    sortBy: string, 
    currentPage: number
  ) => {
    console.log('🔄 Force refresh requested');
    clearCache();
    await performSearch(query, filters, sortBy, currentPage);
  }, [clearCache, performSearch]);

  return {
    performSearch,
    forceRefresh,
    loading,
    error
  };
};
