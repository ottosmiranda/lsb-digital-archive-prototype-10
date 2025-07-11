
import { useEffect } from "react";
import { useSearchResults } from '@/hooks/useSearchResults';
import { useSearchParams } from 'react-router-dom';
import SearchLayout from '@/components/SearchLayout';
import { HomepageContentProvider } from '@/contexts/HomepageContentContext';

const SearchResultsContent = () => {
  const [, setSearchParams] = useSearchParams();
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
      author: [], // CORRIGIDO: Array vazio para múltiplos autores
      year: '',
      duration: '',
      language: [],
      documentType: [],
      program: [], // Add program filter
      channel: [], // Add channel filter
    });
  };

  const handleQuickSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    handlePageChange(1); 
  };

  const handleClearQuery = () => {
    // Criar nova URL com apenas filtros=all, removendo q completamente
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('filtros', 'all');
    setSearchParams(newSearchParams);
    handlePageChange(1);
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
