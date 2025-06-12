
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
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    setFilters
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
      onFiltersChange={handleFilterChange}
      onSortChange={handleSortChange}
      onPageChange={handlePageChange}
      onClearFilters={handleClearFilters}
    />
  );
};

export default SearchResults;
