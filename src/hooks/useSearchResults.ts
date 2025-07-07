
import { useState, useEffect, useMemo } from 'react';
import { SearchFilters, SearchResult } from '@/types/searchTypes';
import { useSearchState } from '@/hooks/useSearchState';
import { useApiSearch } from '@/hooks/useApiSearch';
import { shouldPerformSearch, checkHasActiveFilters } from '@/utils/searchUtils';

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
        author: [],
        year: '',
        duration: '',
        language: [],
        documentType: []
      },
      sortBy: 'relevance'
    }
  });

  const [usingFallback, setUsingFallback] = useState(false);

  // CORRIGIDO: Usar nova função para verificar se há filtros ativos
  const hasActiveFilters = useMemo((): boolean => {
    const result = checkHasActiveFilters(filters);
    console.log('🔍 Checking active filters for UI:', { filters, hasActiveFilters: result });
    return result;
  }, [filters]);

  // CORRIGIDA: Função para executar busca
  const performSearch = async () => {
    const shouldSearch = shouldPerformSearch(query, filters);
    
    console.log('🚀 Performing search analysis:', { 
      query: query.trim(), 
      filters, 
      sortBy, 
      currentPage,
      hasActiveFilters,
      shouldSearch
    });
    
    if (!shouldSearch) {
      console.log('❌ No search needed - clearing results');
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
          appliedFilters: filters,
          sortBy
        }
      });
      return;
    }

    console.log('🚀 Executing search with params:', { 
      query, 
      filters, 
      sortBy, 
      currentPage,
      shouldSearch
    });

    try {
      const response = await search(query, filters, sortBy, currentPage);
      
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
          appliedFilters: response.searchInfo.appliedFilters
        });
        
        // Prefetch da próxima página se houver
        if (response.pagination.hasNextPage) {
          prefetchNextPage(query, filters, sortBy, currentPage);
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
          query,
          appliedFilters: filters,
          sortBy
        }
      });
    }
  };

  // Executar busca quando parâmetros mudarem
  useEffect(() => {
    console.log('🔄 Search params changed, triggering search:', { query, filters, sortBy, currentPage });
    performSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters, sortBy, currentPage]);

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
