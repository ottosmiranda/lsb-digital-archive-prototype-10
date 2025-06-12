
import Navigation from '@/components/Navigation';
import SearchHeader from '@/components/SearchHeader';
import SearchFilters from '@/components/SearchFilters';
import SearchResultsGrid from '@/components/SearchResultsGrid';
import EmptySearchState from '@/components/EmptySearchState';
import SearchWelcomeState from '@/components/SearchWelcomeState';
import SearchPagination from '@/components/SearchPagination';
import Footer from '@/components/Footer';

interface SearchResult {
  id: number;
  title: string;
  type: 'video' | 'titulo' | 'podcast';
  author: string;
  duration?: string;
  pages?: number;
  thumbnail?: string;
  description: string;
  year: number;
  subject: string;
}

interface SearchFilters {
  resourceType: string[];
  subject: string[];
  author: string;
  year: string;
  duration: string;
}

interface SearchLayoutProps {
  query: string;
  filters: SearchFilters;
  sortBy: string;
  currentResults: SearchResult[];
  totalResults: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  hasActiveFilters: boolean;
  onFiltersChange: (filters: SearchFilters) => void;
  onSortChange: (sort: string) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  onQuickSearch?: (query: string) => void;
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
  onFiltersChange,
  onSortChange,
  onPageChange,
  onClearFilters,
  onQuickSearch
}: SearchLayoutProps) => {
  const hasResults = currentResults.length > 0;
  const showEmptyState = !loading && !hasResults && (query || hasActiveFilters);
  const showWelcomeState = !loading && !query && !hasActiveFilters && !hasResults;

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showWelcomeState && (
          <SearchHeader 
            query={query}
            resultCount={totalResults}
            sortBy={sortBy}
            onSortChange={onSortChange}
          />
        )}
        
        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          {!showWelcomeState && (
            <SearchFilters 
              filters={filters}
              onFiltersChange={onFiltersChange}
            />
          )}
          
          <div className="flex-1">
            {showWelcomeState ? (
              <SearchWelcomeState onQuickSearch={onQuickSearch || (() => {})} />
            ) : showEmptyState ? (
              <EmptySearchState 
                query={query} 
                onClearFilters={onClearFilters} 
              />
            ) : (
              <>
                <SearchResultsGrid 
                  results={currentResults}
                  loading={loading}
                />
                
                <SearchPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={onPageChange}
                />
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
