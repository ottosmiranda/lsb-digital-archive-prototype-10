
import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import SearchHeaderWithTabs from '@/components/SearchHeaderWithTabs';
import StreamlinedSearchFilters from '@/components/StreamlinedSearchFilters';
import SearchResultsGrid from '@/components/SearchResultsGrid';
import SearchResultsList from '@/components/SearchResultsList';
import EmptySearchState from '@/components/EmptySearchState';
import SearchWelcomeState from '@/components/SearchWelcomeState';
import SearchPagination from '@/components/SearchPagination';
import FilterChips from '@/components/FilterChips';
import DataRefreshButton from '@/components/DataRefreshButton';
import Footer from '@/components/Footer';
import { SearchResult, SearchFilters as SearchFiltersType } from '@/types/searchTypes';

interface SearchLayoutProps {
  query: string;
  filters: SearchFiltersType;
  sortBy: string;
  currentResults: SearchResult[];
  totalResults: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  hasActiveFilters: boolean;
  usingFallback?: boolean;
  onFiltersChange: (filters: SearchFiltersType, options?: { authorTyping?: boolean }) => void;
  onSortChange: (sort: string) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  onQuickSearch?: (query: string) => void;
  onRefreshData?: () => Promise<void>;
}

const SearchLayout = ({
  query,
  filters,
  sortBy,
  currentResults,
  totalResults,
  totalPages,
  currentPage,
  loading,
  hasActiveFilters,
  usingFallback = false,
  onFiltersChange,
  onSortChange,
  onPageChange,
  onClearFilters,
  onQuickSearch,
  onRefreshData
}: SearchLayoutProps) => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  // activeContentType reflects the state of the resourceType filter driven by tabs
  const [activeContentType, setActiveContentType] = useState('all');
  const [showAllContent, setShowAllContent] = useState(false);

  // Sync activeContentType with filters.resourceType
  useEffect(() => {
    if (filters.resourceType.length === 1 && ['titulo', 'video', 'podcast'].includes(filters.resourceType[0])) {
      setActiveContentType(filters.resourceType[0]);
      setShowAllContent(false);
    } else if (filters.resourceType.length === 0) {
      setActiveContentType('all');
      // Don't automatically set showAllContent here - let it be controlled by user action
    } else {
      // Multiple resourceTypes selected, or an unknown one. Default to 'all'.
      // This scenario might occur if filters are set externally or if `resourceType` can hold more complex states.
      // For tab interaction, it's usually one type or 'all'.
      setActiveContentType('all'); 
      setShowAllContent(false);
    }
  }, [filters.resourceType]);
  
  const hasResults = currentResults.length > 0;
  
  // Modified logic: consider showAllContent as an active state
  const effectiveHasActiveFilters = hasActiveFilters || showAllContent;
  
  const showEmptyState = !loading && !hasResults && (query || effectiveHasActiveFilters);
  const showWelcomeState = !loading && !query && !effectiveHasActiveFilters && !hasResults;

  const handleRemoveFilter = (filterType: keyof SearchFiltersType, value?: string) => {
    const newFilters = { ...filters };
    
    switch (filterType) {
      case 'resourceType':
        newFilters.resourceType = newFilters.resourceType.filter(type => type !== value);
        break;
      case 'subject':
        newFilters.subject = newFilters.subject.filter(subject => subject !== value);
        break;
      case 'author':
        newFilters.author = '';
        break;
      case 'year':
        newFilters.year = '';
        break;
      case 'duration':
        newFilters.duration = '';
        break;
      case 'language':
        newFilters.language = newFilters.language.filter(lang => lang !== value);
        break;
      case 'documentType':
        newFilters.documentType = newFilters.documentType.filter(docType => docType !== value);
        break;
    }
    
    onFiltersChange(newFilters);
  };

  const handleContentTypeChange = (type: string) => {
    // This function is called when a tab is clicked (Todos, Livros, Vídeos, Podcasts)
    // It updates the `activeContentType` state for the tabs UI
    // And it updates the `filters.resourceType` for actual filtering.
    setActiveContentType(type); 
    const newFilters = { ...filters };
    
    if (type === 'all') {
      newFilters.resourceType = [];
      setShowAllContent(true); // Explicitly set showAllContent when "Todos" is selected
      // Automatically apply alphabetical sorting when "Todos" is selected
      onSortChange('title');
    } else {
      // Ensure only valid types are pushed. This assumes `type` is one of 'titulo', 'video', 'podcast'.
      newFilters.resourceType = [type]; 
      setShowAllContent(false);
    }
    
    onFiltersChange(newFilters);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {onRefreshData && (
          <DataRefreshButton
            onRefresh={onRefreshData}
            loading={loading}
            usingFallback={usingFallback}
          />
        )}

        {!showWelcomeState && (
          <SearchHeaderWithTabs 
            query={query}
            resultCount={totalResults}
            sortBy={sortBy}
            view={view}
            activeContentType={activeContentType} // Ensure this reflects current filter state
            onSortChange={onSortChange}
            onViewChange={setView}
            onContentTypeChange={handleContentTypeChange}
          />
        )}
        
        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          {!showWelcomeState && (
            <StreamlinedSearchFilters 
              filters={filters}
              onFiltersChange={onFiltersChange}
              currentResults={currentResults} // Pass current results to check for books
            />
          )}
          
          <div className="flex-1">
            {showWelcomeState ? (
              <SearchWelcomeState onQuickSearch={onQuickSearch || (() => {})} />
            ) : (
              <>
                <FilterChips
                  filters={filters}
                  onRemoveFilter={handleRemoveFilter}
                  onClearAll={onClearFilters}
                />
                
                {showEmptyState ? (
                  <EmptySearchState 
                    query={query} 
                    onClearFilters={onClearFilters} 
                  />
                ) : (
                  <>
                    {view === 'grid' ? (
                      <SearchResultsGrid 
                        results={currentResults}
                        loading={loading}
                      />
                    ) : (
                      <SearchResultsList 
                        results={currentResults}
                        loading={loading}
                      />
                    )}
                    
                    <SearchPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={onPageChange}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SearchLayout;
