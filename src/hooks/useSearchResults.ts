
import { useEffect, useCallback, useMemo } from 'react';
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

  // Gerenciar resposta da busca
  const { 
    searchResponse, 
    usingFallback, 
    hasActiveFilters, 
    updateSearchResponse, 
    clearResults, 
    setUsingFallback 
  } = useSearchResponse();

  // Gerenciar paginação - usar página da resposta como fonte da verdade
  const { currentPage, handlePageChange, resetToFirstPage } = usePagination({
    initialPage: 1,
    externalCurrentPage: searchResponse.pagination.currentPage,
    onPageChange: (page) => {
      // A página será atualizada via nova busca
    }
  });

  // Callbacks estáveis para o useSearchExecution
  const onSearchComplete = useCallback((response: any) => {
    updateSearchResponse(response);
  }, [updateSearchResponse]);

  const onSearchError = useCallback((errorQuery: string, errorFilters: SearchFilters, errorSortBy: string, errorCurrentPage: number) => {
    clearResults(errorFilters, errorSortBy, errorCurrentPage);
  }, [clearResults]);

  const onUsingFallback = useCallback((fallback: boolean) => {
    setUsingFallback(fallback);
  }, [setUsingFallback]);

  // Gerenciar execução da busca
  const { performSearch, forceRefresh, loading } = useSearchExecution({
    resultsPerPage,
    onSearchComplete,
    onSearchError,
    onUsingFallback
  });

  // Memoizar chave de busca para evitar buscas desnecessárias
  const searchKey = useMemo(() => {
    return JSON.stringify({ query, filters, sortBy, currentPage });
  }, [query, filters, sortBy, currentPage]);

  // Executar busca quando parâmetros mudarem
  useEffect(() => {
    performSearch(query, filters, sortBy, currentPage);
  }, [searchKey, performSearch]); // Usar searchKey memoizada

  // Handlers
  const handleFilterChange = useCallback((newFilters: SearchFilters, options?: { authorTyping?: boolean }) => {
    setFilters(newFilters);
    // Resetar página apenas se não for digitação no autor
    if (!options?.authorTyping) {
      // A página será resetada na próxima busca
    }
  }, [setFilters]);

  const handleSortChange = useCallback((newSort: string) => {
    console.log('📊 Sort changed to:', newSort);
    setSortBy(newSort);
    // A página será resetada na próxima busca
  }, [setSortBy]);

  const handlePageChangeInternal = useCallback((page: number) => {
    handlePageChange(page);
  }, [handlePageChange]);

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
    handlePageChange: handlePageChangeInternal,
    setFilters,
    setQuery,
    forceRefresh: handleForceRefresh
  };
};
