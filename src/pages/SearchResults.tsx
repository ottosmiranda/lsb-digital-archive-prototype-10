
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
    setFilters,
    setQuery,
    forceRefresh
  } = useSearchResults();

  const handleClearFilters = () => {
    setFilters({
      resourceType: [],
      subject: [],
      author: '',
      year: '',
      duration: ''
    });
  };

  const handleQuickSearch = (searchQuery: string) => {
    setQuery(searchQuery);
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
