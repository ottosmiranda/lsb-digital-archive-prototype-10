
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
import SearchDebugInfo from '@/components/SearchDebugInfo';
import Footer from '@/components/Footer';
import { SearchResult, SearchFilters as SearchFiltersType } from '@/types/searchTypes';
import { useHomepageContentContext } from '@/contexts/HomepageContentContext';
import { useSearchParams } from 'react-router-dom';

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
  const [activeContentType, setActiveContentType] = useState('all'); // ✅ NOVO: Padrão é 'all'
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams] = useSearchParams();
  
  // ✅ NOVO: Obter contentCounts do contexto para badges corretas
  const { contentCounts } = useHomepageContentContext();

  // ✅ CORRIGIDO: Sync activeContentType com filters.resourceType PRESERVANDO contexto da URL
  useEffect(() => {
    console.group('🔄 SearchLayout - Sync activeContentType');
    console.log('📋 Current filters.resourceType:', filters.resourceType);
    console.log('📋 Current activeContentType:', activeContentType);
    console.log('📋 URL params:', Object.fromEntries(searchParams.entries()));
    
    // Verificar se há filtros ativos na URL
    const urlFilters = searchParams.getAll('filtros');
    console.log('📋 URL filtros:', urlFilters);
    
    if (filters.resourceType.length === 1) {
      const resourceType = filters.resourceType[0];
      if (['all', 'titulo', 'video', 'podcast'].includes(resourceType)) {
        console.log(`✅ Setting activeContentType to: ${resourceType}`);
        setActiveContentType(resourceType);
      }
    } else if (filters.resourceType.length === 0 && urlFilters.length === 0) {
      // ✅ NOVO: Definir 'all' como padrão
      console.log('✅ No filters - setting default to all (todos)');
      setActiveContentType('all');
      onFiltersChange({ ...filters, resourceType: ['all'] });
    } else if (urlFilters.length > 0) {
      // ✅ NOVO: Respeitar filtros da URL sem forçar 'titulo'
      console.log('🔗 URL has filters - preserving navigation context');
    }
    
    console.groupEnd();
  }, [filters.resourceType, searchParams]);
  
  const hasResults = currentResults.length > 0;
  
  const shouldShowSearch = true;
  const showEmptyState = !loading && !hasResults && (query || hasActiveFilters);
  const showWelcomeState = false;
  const showPagination = hasResults && totalPages > 1;

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
        newFilters.author = newFilters.author.filter(author => author !== value);
        break;
      case 'program':
        newFilters.program = newFilters.program.filter(program => program !== value);
        break;
      case 'channel':
        newFilters.channel = newFilters.channel.filter(channel => channel !== value);
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
    console.group('🎯 SearchLayout - Content type change');
    console.log('📋 From:', activeContentType, 'To:', type);
    console.log('📋 Current URL params:', Object.fromEntries(searchParams.entries()));
    
    // Reset página para 1 quando mudar tipo de conteúdo
    console.log('🔄 Resetando página para 1 devido à mudança de tipo');
    onPageChange(1);
    
    setActiveContentType(type); 
    const newFilters = { ...filters };
    
    // Para filtros específicos
    newFilters.resourceType = [type];
    
    console.log('🔄 Calling onFiltersChange with:', newFilters);
    console.groupEnd();
    onFiltersChange(newFilters);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="lsb-container">
        <div className="lsb-content">
          <div className="py-4 md:py-8">
            {onRefreshData && (
              <DataRefreshButton
                onRefresh={onRefreshData}
                loading={loading}
                usingFallback={usingFallback}
              />
            )}

            {/* Debug Info - apenas em desenvolvimento */}
            <SearchDebugInfo
              filters={filters}
              totalResults={totalResults}
              loading={loading}
              hasActiveFilters={hasActiveFilters}
              usingFallback={usingFallback}
              query={query}
            />

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
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
              />
            )}
            
            {/* Mobile Layout - Stack vertically */}
            <div className="block lg:hidden">
              {!showWelcomeState && (
                <>
                  {/* Mobile Filter Toggle - Always visible but collapsible */}
                  <div className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="bg-lsb-section rounded-lg p-4 mb-4">
                      <StreamlinedSearchFilters 
                        filters={filters}
                        onFiltersChange={onFiltersChange}
                        currentResults={currentResults}
                        activeContentType={activeContentType}
                        globalContentCounts={contentCounts}
                        isMobile={true}
                      />
                    </div>
                  </div>

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
                      
                      {/* Mobile Pagination */}
                      {showPagination && (
                        <div className="mt-6">
                          <SearchPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={onPageChange}
                            isMobile={true}
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Desktop Layout - Side by side */}
            <div className="hidden lg:flex lg:gap-8 mt-8">
              {!showWelcomeState && (
                <div className="w-80 flex-shrink-0">
                  <StreamlinedSearchFilters 
                    filters={filters}
                    onFiltersChange={onFiltersChange}
                    currentResults={currentResults}
                    activeContentType={activeContentType}
                    globalContentCounts={contentCounts}
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
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
                        
                        {/* Desktop Pagination */}
                        {showPagination && (
                          <SearchPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={onPageChange}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SearchLayout;
