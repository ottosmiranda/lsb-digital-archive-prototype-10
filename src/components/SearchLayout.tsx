
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
  const [activeContentType, setActiveContentType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams] = useSearchParams();
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);
  
  const { contentCounts } = useHomepageContentContext();

  // Sync activeContentType with filters.resourceType
  useEffect(() => {
    console.group('🔄 SearchLayout - Sync activeContentType');
    console.log('📋 Current filters.resourceType:', filters.resourceType);
    console.log('📋 Current activeContentType:', activeContentType);
    console.log('📋 Loading:', loading);
    
    if (filters.resourceType.length === 1) {
      const resourceType = filters.resourceType[0];
      if (['all', 'titulo', 'video', 'podcast'].includes(resourceType)) {
        console.log(`✅ Setting activeContentType to: ${resourceType}`);
        setActiveContentType(resourceType);
      }
    } else if (filters.resourceType.length === 0) {
      console.log('✅ No filters - setting default to all (todos)');
      setActiveContentType('all');
      onFiltersChange({ ...filters, resourceType: ['all'] });
    }
    
    console.groupEnd();
  }, [filters.resourceType, searchParams, onFiltersChange]);
  
  const hasResults = currentResults.length > 0;
  
  // ✅ LÓGICA DE RENDERIZAÇÃO BLINDADA COM LOADING ATÔMICO
  const shouldShowSearch = true;
  
  // ✅ CORREÇÃO CRÍTICA: Estado vazio só aparece se NÃO estiver carregando (loading atômico)
  const showEmptyState = !loading && !hasResults && (query || hasActiveFilters);
  const showWelcomeState = false;
  
  // ✅ Paginação só aparece se NÃO estiver carregando E houver resultados
  const showPagination = !loading && hasResults && totalPages > 1;

  console.group('🛡️ SearchLayout - RENDERING GUARDS ATÔMICOS');
  console.log('📋 Loading (atômico):', loading);
  console.log('📋 HasResults:', hasResults);
  console.log('📋 ShowEmptyState:', showEmptyState);
  console.log('📋 ShowPagination:', showPagination);
  console.log('🛡️ Loading atômico impede renderização prematura de estados vazios');
  console.groupEnd();

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
    console.group('🎯 SearchLayout - Content type change ATÔMICO');
    console.log('📋 From:', activeContentType, 'To:', type);
    
    setIsFilterTransitioning(true);
    
    onPageChange(1);
    setActiveContentType(type); 
    const newFilters = { ...filters };
    newFilters.resourceType = [type];
    
    console.log('⚡ Calling onFiltersChange with ATOMIC loading for type:', type);
    console.groupEnd();
    
    onFiltersChange(newFilters);
    
    if (onRefreshData && type !== activeContentType) {
      setTimeout(() => {
        console.log('🔄 Forcing refresh due to content type change');
        onRefreshData();
      }, 50);
    }
  };

  // Reset transitioning state when loading finishes
  useEffect(() => {
    if (!loading) {
      setIsFilterTransitioning(false);
    }
  }, [loading]);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* ✅ Container com overflow-x-hidden para prevenir scroll horizontal */}
      <div className="lsb-container overflow-x-hidden">
        <div className="lsb-content">
          <div className="py-4 md:py-8">
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
            
            {/* ✅ Mobile Layout - Stack vertically com widths controladas */}
            <div className="block lg:hidden">
              {!showWelcomeState && (
                <>
                  {/* ✅ Mobile Filters - SEMPRE visível como component */}
                  <div className="mb-4">
                    <StreamlinedSearchFilters 
                      filters={filters}
                      onFiltersChange={onFiltersChange}
                      currentResults={currentResults}
                      activeContentType={activeContentType}
                      globalContentCounts={contentCounts}
                      isMobile={true}
                    />
                  </div>

                  {/* ✅ Filter Chips com width controlada */}
                  <div className="w-full overflow-x-auto mb-4">
                    <FilterChips
                      filters={filters}
                      onRemoveFilter={handleRemoveFilter}
                      onClearAll={onClearFilters}
                    />
                  </div>
                  
                  {/* ✅ Results container com width 100% */}
                  <div className="w-full">
                    {loading ? (
                      <SearchResultsGrid 
                        results={[]}
                        loading={true}
                      />
                    ) : showEmptyState ? (
                      <EmptySearchState 
                        query={query} 
                        onClearFilters={onClearFilters} 
                        isTransitioning={isFilterTransitioning}
                      />
                    ) : (
                      <>
                        {view === 'grid' ? (
                          <SearchResultsGrid 
                            results={currentResults}
                            loading={false}
                          />
                        ) : (
                          <SearchResultsList 
                            results={currentResults}
                            loading={false}
                          />
                        )}
                        
                        {showPagination && (
                          <div className="mt-6 w-full">
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
                  </div>
                </>
              )}
            </div>

            {/* ✅ Desktop Layout - Side by side com gaps controlados */}
            <div className="hidden lg:flex lg:gap-6 xl:gap-8 mt-8">
              {!showWelcomeState && (
                <div className="w-72 xl:w-80 flex-shrink-0">
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
                    
                    {loading ? (
                      <SearchResultsGrid 
                        results={[]}
                        loading={true}
                      />
                    ) : showEmptyState ? (
                      <EmptySearchState 
                        query={query} 
                        onClearFilters={onClearFilters} 
                        isTransitioning={isFilterTransitioning}
                      />
                    ) : (
                      <>
                        {view === 'grid' ? (
                          <SearchResultsGrid 
                            results={currentResults}
                            loading={false}
                          />
                        ) : (
                          <SearchResultsList 
                            results={currentResults}
                            loading={false}
                          />
                        )}
                        
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
