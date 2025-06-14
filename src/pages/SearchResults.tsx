import { useSearchResults } from '@/hooks/useSearchResults';
import SearchLayout from '@/components/SearchLayout';

const SearchResults = () => {
  const {
    query,
    filters,
    sortBy,
    currentResults,
    totalResults,
    totalPages,
    currentPage,
    loading,
    hasActiveFilters,
    usingFallback,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    setQuery,
    forceRefresh
  } = useSearchResults();

  const handleClearFilters = () => {
    handleFilterChange({
      resourceType: [], // For "Tipo de Item"
      subject: [],
      author: '',
      year: '',
      duration: '',
      language: [], // Clear language filter
    });
  };

  const handleQuickSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    handlePageChange(1); 
  };

  return (
    <SearchLayout
      query={query}
      filters={filters}
      sortBy={sortBy}
      currentResults={currentResults}
      totalResults={totalResults}
      totalPages={totalPages}
      currentPage={currentPage}
      loading={loading}
      hasActiveFilters={hasActiveFilters}
      usingFallback={usingFallback}
      onFiltersChange={handleFilterChange}
      onSortChange={handleSortChange}
      onPageChange={handlePageChange}
      onClearFilters={handleClearFilters}
      onQuickSearch={handleQuickSearch}
      onRefreshData={forceRefresh}
    />
  );
};

export default SearchResults;
