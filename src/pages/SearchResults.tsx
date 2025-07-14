
import { useEffect } from "react";
import { useSearchResults } from '@/hooks/useSearchResults';
import { useQueryClear } from '@/hooks/useQueryClear';
import SearchLayout from '@/components/SearchLayout';
import { HomepageContentProvider } from '@/contexts/HomepageContentContext';

const SearchResultsContent = () => {
  const { clearQuery } = useQueryClear();
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
      resourceType: [],
      subject: [],
      author: [],
      year: '',
      duration: '',
      language: [],
      documentType: [],
      program: [],
      channel: [],
    });
  };

  const handleQuickSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    handlePageChange(1); 
  };

  const handleClearQuery = () => {
    console.log('🔍 SearchResults: handleClearQuery chamado');
    const success = clearQuery();
    if (success) {
      handlePageChange(1);
    }
  };

  // Scroll to top when the search results page is opened (only on mount)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

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
      onClearQuery={handleClearQuery}
    />
  );
};

const SearchResults = () => {
  return (
    <HomepageContentProvider>
      <SearchResultsContent />
    </HomepageContentProvider>
  );
};

export default SearchResults;
