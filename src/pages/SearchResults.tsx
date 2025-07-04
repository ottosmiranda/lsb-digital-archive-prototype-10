

import { useEffect } from "react";
import { useSearchResults } from '@/hooks/useSearchResults';
import { useProgressiveDataLoader } from '@/hooks/useProgressiveDataLoader';
import SearchLayout from '@/components/SearchLayout';
import LoadingProgress from '@/components/LoadingProgress';

const SearchResults = () => {
  const {
    allData,
    videos,
    books,
    podcasts,
    loading,
    loadingStates,
    loadingProgress,
    dataLoaded,
    loadData,
    forceRefresh
  } = useProgressiveDataLoader();

  const {
    query,
    filters,
    sortBy,
    currentResults,
    totalResults,
    totalPages,
    currentPage,
    hasActiveFilters,
    usingFallback,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    setQuery,
  } = useSearchResults();

  // Load data on mount
  useEffect(() => {
    if (!dataLoaded && !loading) {
      console.log('🔄 SearchResults: Loading data on mount');
      loadData();
    }
  }, [dataLoaded, loading, loadData]);

  const handleClearFilters = () => {
    handleFilterChange({
      resourceType: [],
      subject: [],
      author: '',
      year: '',
      duration: '',
      language: [],
      documentType: [],
    });
  };

  const handleQuickSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    handlePageChange(1); 
  };

  // Scroll to top when the search results page is opened (only on mount)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // Show loading progress if data is loading
  if (loading && !dataLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingProgress
          progress={loadingProgress}
          loadingStates={loadingStates}
          showDetails={true}
        />
      </div>
    );
  }

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

