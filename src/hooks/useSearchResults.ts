
import { useState, useEffect, useMemo } from 'react';
import { SearchFilters, SearchResult } from '@/types/searchTypes';
import { useSearchState } from '@/hooks/useSearchState';
import { useApiSearch } from '@/hooks/useApiSearch';
import { useDebounce } from '@/hooks/useDebounce';
import { checkHasActiveFilters } from '@/utils/searchUtils';

interface SearchResponse {
  results: SearchResult[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  searchInfo: {
    query: string;
    appliedFilters: SearchFilters;
    sortBy: string;
  };
}

export const useSearchResults = () => {
  const resultsPerPage = 9;
  
  // Gerenciar estado de busca e URL params
  const {
    query,
    filters,
    sortBy,
    currentPage,
    setFilters,
    setSortBy,
    setCurrentPage,
    setQuery
  } = useSearchState();

  // Hook para busca na API
  const { search, loading, error, clearCache, prefetchNextPage } = useApiSearch({ resultsPerPage });
  
  // Debounce dos filtros (exceto mudanças de tabs que são imediatas)
  const debouncedFilters = useDebounce(filters, 300);
  const debouncedQuery = useDebounce(query, 300);
  
  // Estado dos resultados
  const [searchResponse, setSearchResponse] = useState<SearchResponse>({
    results: [],
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalResults: 0,
      hasNextPage: false,
      hasPreviousPage: false
    },
    searchInfo: {
      query: '',
      appliedFilters: {
        resourceType: [],
        subject: [],
        author: '',
        year: '',
        duration: '',
        language: [],
        documentType: []
      },
      sortBy: 'relevance'
    }
  });

  const [usingFallback, setUsingFallback] = useState(false);

  // Verificar se há filtros ativos - incluindo estado "Todos"
  const hasActiveFilters = useMemo((): boolean => {
    return checkHasActiveFilters(debouncedFilters);
  }, [debouncedFilters]);

  // Função para executar busca
  const performSearch = async () => {
    // Buscar se houver query, filtros ativos (incluindo 'all' para "Todos")
    if (!debouncedQuery.trim() && !hasActiveFilters) {
      setSearchResponse({
        results: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalResults: 0,
          hasNextPage: false,
          hasPreviousPage: false
        },
        searchInfo: {
          query: '',
          appliedFilters: debouncedFilters,
          sortBy
        }
      });
      return;
    }

    console.log('🚀 Performing search:', { 
      query: debouncedQuery, 
      filters: debouncedFilters, 
      sortBy, 
      currentPage,
      hasActiveFilters
    });

    try {
      const response = await search(debouncedQuery, debouncedFilters, sortBy, currentPage);
      
      setSearchResponse({
        results: response.results,
        pagination: response.pagination,
        searchInfo: response.searchInfo
      });

      setUsingFallback(!response.success);

      if (response.error) {
        console.warn('⚠️ Search completed with errors:', response.error);
      } else {
        console.log('✅ Search results updated:', {
          totalResults: response.pagination.totalResults,
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          resultsInPage: response.results.length,
          isRealPagination: response.pagination.totalResults > 0
        });
        
        // Prefetch da próxima página se houver
        if (response.pagination.hasNextPage) {
          prefetchNextPage(debouncedQuery, debouncedFilters, sortBy, currentPage);
        }
      }

    } catch (err) {
      console.error('❌ Search failed:', err);
      setUsingFallback(true);
      
      setSearchResponse({
        results: [],
        pagination: {
          currentPage,
          totalPages: 0,
          totalResults: 0,
          hasNextPage: false,
          hasPreviousPage: false
        },
        searchInfo: {
          query: debouncedQuery,
          appliedFilters: debouncedFilters,
          sortBy
        }
      });
    }
  };

  // Executar busca quando parâmetros mudarem (usando debounced values)
  useEffect(() => {
    performSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, debouncedFilters, sortBy, currentPage]);

  // Handlers
  const handleFilterChange = (newFilters: SearchFilters, options?: { authorTyping?: boolean }) => {
    setFilters(newFilters);
    
    // Resetar página apenas se não for digitação no autor
    if (!options?.authorTyping) {
      setCurrentPage(1);
    }
  };

  const handleSortChange = (newSort: string) => {
    console.log('📊 Sort changed to:', newSort);
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    console.log('📄 Page changed to:', page);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const forceRefresh = async () => {
    console.log('🔄 Force refresh requested');
    clearCache();
    await performSearch();
  };

  return {
    query,
    filters,
    sortBy,
    currentResults: searchResponse.results,
    totalResults: searchResponse.pagination.totalResults,
    totalPages: searchResponse.pagination.totalPages,
    currentPage: searchResponse.pagination.currentPage,
    loading,
    hasActiveFilters,
    usingFallback,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    setFilters,
    setQuery,
    forceRefresh
  };
};
