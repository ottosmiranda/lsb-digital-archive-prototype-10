
import { useMemo } from 'react';
import { SearchFilters } from '@/types/searchTypes';
import { useDataLoader } from '@/hooks/useDataLoader';
import { useSearchState } from '@/hooks/useSearchState';
import { useSearchOperations } from '@/hooks/useSearchOperations';
import { checkHasActiveFilters } from '@/utils/searchUtils';

export const useSearchResults = () => {
  const resultsPerPage = 9;
  
  // Load initial data
  const { allData, loading, dataLoaded, setLoading } = useDataLoader();
  
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
    setLoading
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

  const handleFilterChange = (newFilters: SearchFilters) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
    setCurrentPage(1);
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
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    setFilters,
    setQuery
  };
};
