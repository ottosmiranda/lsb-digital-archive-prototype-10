
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
import { isShowingAllResourceTypes } from '@/utils/searchUtils';

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
  const [activeContentType, setActiveContentType] = useState('all');

  // CORRIGIDO: Sincronizar activeContentType com filters.resourceType
  useEffect(() => {
    console.log('🔄 Syncing activeContentType with filters:', { 
      resourceType: filters.resourceType,
      currentActiveContentType: activeContentType,
      isShowingAll: isShowingAllResourceTypes(filters.resourceType)
    });
    
    if (isShowingAllResourceTypes(filters.resourceType)) {
      setActiveContentType('all');
      console.log('📍 Set activeContentType to "all" (showing all resources)');
    } else if (filters.resourceType.length === 1) {
      const resourceType = filters.resourceType[0];
      if (['titulo', 'video', 'podcast'].includes(resourceType)) {
        setActiveContentType(resourceType);
        console.log('📍 Set activeContentType to:', resourceType);
      }
    } else if (filters.resourceType.length > 1) {
      // Multiple specific resourceTypes selected
      setActiveContentType('all'); 
      console.log('📍 Set activeContentType to "all" (multiple specific filters)');
    }
  }, [filters.resourceType]);
  
  const hasResults = currentResults.length > 0;
  
  const showEmptyState = !loading && !hasResults && (query || hasActiveFilters);
  const showWelcomeState = !loading && !query && !hasActiveFilters && !hasResults;

  const handleRemoveFilter = (filterType: keyof SearchFiltersType, value?: string) => {
    const newFilters = { ...filters };
    
    switch (filterType) {
      case 'resourceType':
        if (value === 'all') {
          // Se removendo "all", volta para estado sem filtros
          newFilters.resourceType = [];
        } else if (value) {
          newFilters.resourceType = newFilters.resourceType.filter(type => type !== value);
          // Se não há mais filtros específicos, volta para "all"
          if (newFilters.resourceType.length === 0) {
            newFilters.resourceType = ['all'];
          }
        }
        break;
      case 'subject':
        newFilters.subject = newFilters.subject.filter(subject => subject !== value);
        break;
      case 'author':
        if (value) {
          newFilters.author = newFilters.author.filter(author => author !== value);
        } else {
          newFilters.author = [];
        }
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
    console.log('🎯 Content type changed to:', type);
    setActiveContentType(type); 
    const newFilters = { ...filters };
    
    if (type === 'all') {
      // Para "Todos", usar estado especial
      newFilters.resourceType = ['all'];
      // Aplicar ordenação alfabética automaticamente
      onSortChange('title');
      console.log('📍 Setting resourceType to ["all"] and sort to "title"');
    } else if (['titulo', 'video', 'podcast'].includes(type)) {
      // Para tipos específicos
      newFilters.resourceType = [type]; 
      console.log('📍 Setting resourceType to:', [type]);
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
            activeContentType={activeContentType}
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
              currentResults={currentResults}
              activeContentType={activeContentType}
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
