
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
  const [activeContentType, setActiveContentType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams] = useSearchParams();
  
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
    
    onPageChange(1);
    setActiveContentType(type); 
    const newFilters = { ...filters };
    newFilters.resourceType = [type];
    
    console.log('⚡ Calling onFiltersChange with ATOMIC loading for type:', type);
    console.groupEnd();
    
    // ✅ CHAMADA ATÔMICA: O handleFilterChange já ativa o loading imediatamente
    onFiltersChange(newFilters);
    
    if (onRefreshData && type !== activeContentType) {
      setTimeout(() => {
        console.log('🔄 Forcing refresh due to content type change');
        onRefreshData();
      }, 50);
    }
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
                  
                  {/* ✅ RENDERIZAÇÃO BLINDADA ATÔMICA - Loading tem prioridade máxima absoluta */}
                  {loading ? (
                    <SearchResultsGrid 
                      results={[]}
                      loading={true}
                    />
                  ) : showEmptyState ? (
                    <EmptySearchState 
                      query={query} 
                      onClearFilters={onClearFilters} 
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
                      
                      {/* Mobile Pagination - só aparece se não estiver carregando */}
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
                    
                    {/* ✅ RENDERIZAÇÃO BLINDADA ATÔMICA - Loading tem prioridade máxima absoluta */}
                    {loading ? (
                      <SearchResultsGrid 
                        results={[]}
                        loading={true}
                      />
                    ) : showEmptyState ? (
                      <EmptySearchState 
                        query={query} 
                        onClearFilters={onClearFilters} 
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
                        
                        {/* Desktop Pagination - só aparece se não estiver carregando */}
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
