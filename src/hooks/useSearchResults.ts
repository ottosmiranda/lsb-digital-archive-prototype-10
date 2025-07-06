
import { useEffect, useCallback } from 'react';
import { SearchFilters } from '@/types/searchTypes';
import { useSearchState } from '@/hooks/useSearchState';
import { usePagination } from '@/hooks/usePagination';
import { useSearchResponse } from '@/hooks/useSearchResponse';
import { useSearchExecution } from '@/hooks/useSearchExecution';

export const useSearchResults = () => {
  const resultsPerPage = 9;
  
  // Gerenciar estado de busca e URL params
  const {
    query,
    filters,
    sortBy,
    setFilters,
    setSortBy,
    setQuery
  } = useSearchState();

  // Gerenciar paginação
  const { currentPage, handlePageChange, resetToFirstPage, setCurrentPage } = usePagination();

  // Gerenciar resposta da busca
  const { 
    searchResponse, 
    usingFallback, 
    hasActiveFilters, 
    updateSearchResponse, 
    clearResults, 
    setUsingFallback 
  } = useSearchResponse();

  // Gerenciar execução da busca
  const { performSearch, forceRefresh, loading } = useSearchExecution({
    resultsPerPage,
    onSearchComplete: updateSearchResponse,
    onSearchError: (errorQuery, errorFilters, errorSortBy, errorCurrentPage) => {
      clearResults(errorFilters, errorSortBy, errorCurrentPage);
    },
    onUsingFallback: setUsingFallback
  });

  // Executar busca quando parâmetros mudarem
  useEffect(() => {
    performSearch(query, filters, sortBy, currentPage);
  }, [query, filters, sortBy, currentPage, performSearch]);

  // Handlers
  const handleFilterChange = useCallback((newFilters: SearchFilters, options?: { authorTyping?: boolean }) => {
    setFilters(newFilters);
    // Resetar página apenas se não for digitação no autor
    if (!options?.authorTyping) {
      resetToFirstPage();
    }
  }, [setFilters, resetToFirstPage]);

  const handleSortChange = useCallback((newSort: string) => {
    console.log('📊 Sort changed to:', newSort);
    setSortBy(newSort);
    resetToFirstPage();
  }, [setSortBy, resetToFirstPage]);

  const handleForceRefresh = useCallback(async () => {
    await forceRefresh(query, filters, sortBy, currentPage);
  }, [forceRefresh, query, filters, sortBy, currentPage]);

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
    forceRefresh: handleForceRefresh
  };
};
