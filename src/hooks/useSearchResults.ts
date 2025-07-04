

import { useMemo } from 'react';
import { SearchFilters } from '@/types/searchTypes';
import { useProgressiveDataLoader } from '@/hooks/useProgressiveDataLoader';
import { useSearchState } from '@/hooks/useSearchState';
import { useSearchOperations } from '@/hooks/useSearchOperations';
import { checkHasActiveFilters } from '@/utils/searchUtils';

export const useSearchResults = () => {
  const resultsPerPage = 9;
  
  // Load initial data using progressive loader
  const { 
    allData, 
    loading, 
    dataLoaded, 
    forceRefresh
  } = useProgressiveDataLoader();
  
  // Manage search state and URL params
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

  // Perform search operations
  const { searchResults } = useSearchOperations({
    allData,
    query,
    filters,
    sortBy,
    dataLoaded,
    setLoading: () => {} // Progressive loader manages its own loading state
  });

  // Calculate pagination values
  const totalResults = searchResults.length;
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = searchResults.slice(startIndex, endIndex);

  // Check if any filters are active
  const hasActiveFilters = useMemo((): boolean => {
    return checkHasActiveFilters(filters);
  }, [filters]);

  const handleFilterChange = (newFilters: SearchFilters, options?: { authorTyping?: boolean }) => {
    setFilters(newFilters);
    // Only reset pagination if it's a "major" filter change, not just typing in the author field.
    if (!options?.authorTyping) {
      setCurrentPage(1);
    }
  };

  const handleSortChange = (newSort: string) => {
    console.log('Sort changed to:', newSort);
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    query,
    filters,
    sortBy,
    currentResults,
    totalResults,
    totalPages,
    currentPage,
    loading,
    hasActiveFilters,
    usingFallback: false, // Progressive loader doesn't use fallback data
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    setFilters,
    setQuery,
    forceRefresh
  };
};

