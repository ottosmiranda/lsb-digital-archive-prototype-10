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
  onClearQuery?: () => void;
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
  onRefreshData,
  onClearQuery
}: SearchLayoutProps) => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeContentType, setActiveContentType] = useState('all');
  
  // ✅ NOVO: Obter contentCounts do contexto para badges corretas
  const { contentCounts } = useHomepageContentContext();

  // CORREÇÃO: Detectar estado "all" (sem query específica)
  const isAllState = !query && filters.resourceType.length === 0;

  console.log('🔍 SearchLayout: Estado atual:', {
    query,
    hasQuery: !!query,
    onClearQuery: !!onClearQuery,
    isAllState,
    resourceTypeFilters: filters.resourceType
  });

  // Sync activeContentType with filters.resourceType
  useEffect(() => {
    if (filters.resourceType.length === 1) {
      if (['titulo', 'video', 'podcast'].includes(filters.resourceType[0])) {
        setActiveContentType(filters.resourceType[0]);
      } else if (filters.resourceType[0] === 'all') {
        setActiveContentType('all');
      }
    } else if (filters.resourceType.length === 0) {
      setActiveContentType('all');
    } else {
      setActiveContentType('all'); 
    }
  }, [filters.resourceType]);
  
  const hasResults = currentResults.length > 0;
  
  // NOVA LÓGICA: Estados de exibição otimizados
  const shouldShowSearch = true; // Sempre mostrar interface de busca
  const showEmptyState = !loading && !hasResults && (query || hasActiveFilters);
  const showWelcomeState = false; // Nunca mostrar estado de boas-vindas
  const showPagination = hasResults && totalPages > 1; // CRÍTICO: Sempre mostrar quando há páginas

  console.log('🎭 SearchLayout render:', {
    hasResults,
    totalPages,
    showPagination,
    shouldShowSearch,
    showEmptyState,
    showWelcomeState,
    isAllState
  });

  const handleRemoveFilter = (filterType: keyof SearchFiltersType, value?: string) => {
    const newFilters = { ...filters };
    
    switch (filterType) {
      case 'resourceType':
        if (value === 'all') {
          newFilters.resourceType = [];
        } else {
          newFilters.resourceType = newFilters.resourceType.filter(type => type !== value);
        }
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
    console.log('🏷️ Mudança de tipo de conteúdo (Nova API):', type);
    
    setActiveContentType(type); 
    const newFilters = { ...filters };
    
    if (type === 'all') {
      newFilters.resourceType = ['all'];
      onSortChange('title');
      console.log('📋 "Todos" selecionado - aplicando ordenação alfabética');
    } else {
      newFilters.resourceType = [type]; 
    }
    
    console.log('🔄 Chamando onFiltersChange com:', newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="lsb-container">
        <div className="lsb-content">
          <div className="py-8">
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
                onClearQuery={onClearQuery}
              />
            )}
            
            <div className="flex flex-col lg:flex-row gap-8 mt-8">
              {!showWelcomeState && (
                <StreamlinedSearchFilters 
                  filters={filters}
                  onFiltersChange={onFiltersChange}
                  currentResults={currentResults}
                  activeContentType={activeContentType}
                  globalContentCounts={contentCounts}
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
                        
                        {/* CRÍTICO: Paginação sempre mostrada quando há resultados paginados */}
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
