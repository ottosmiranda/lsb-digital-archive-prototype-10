
import { useState, useEffect, useMemo, useCallback } from 'react';
import { SearchFilters, SearchResult } from '@/types/searchTypes';
import { useSearchState } from '@/hooks/useSearchState';
import { useApiSearch } from '@/hooks/useApiSearch';
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

  const { search, loading, error, clearCache, prefetchNextPage } = useApiSearch({ resultsPerPage });
  
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
        documentType: [],
        program: [],
        channel: []
      },
      sortBy: 'relevance'
    }
  });

  const [usingFallback, setUsingFallback] = useState(false);

  // Memoizar verificação de filtros ativos
  const hasActiveFilters = useMemo((): boolean => {
    return checkHasActiveFilters(filters);
  }, [filters]);

  // CORREÇÃO CRÍTICA: Verificar se deve executar busca
  const shouldSearch = useMemo((): boolean => {
    const hasQuery = query.trim() !== '';
    const hasResourceTypeFilters = filters.resourceType.length > 0;
    const hasOtherFilters = hasActiveFilters;
    
    console.log('🔍 Should search evaluation:', { 
      hasQuery, 
      hasResourceTypeFilters, 
      hasOtherFilters,
      resourceType: filters.resourceType,
      result: hasQuery || hasResourceTypeFilters || hasOtherFilters
    });
    
    return hasQuery || hasResourceTypeFilters || hasOtherFilters;
  }, [query, filters.resourceType, hasActiveFilters]);

  // Função memoizada para executar busca
  const performSearch = useCallback(async () => {
    const requestId = `search_${Date.now()}`;
    console.group(`🔍 ${requestId} - Performing search`);
    console.log('📋 Search params:', { query, filters, sortBy, currentPage, shouldSearch });

    // CORREÇÃO: Limpar resultados se não deve buscar
    if (!shouldSearch) {
      console.log('❌ Should not search - clearing results');
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
      console.groupEnd();
      return;
    }

    try {
      console.log('🚀 Executing search via API...');
      const response = await search(query, filters, sortBy, currentPage);
      
      // VALIDAÇÃO CRÍTICA: Verificar resposta
      if (!response.results || !Array.isArray(response.results)) {
        console.error('❌ Invalid search response:', response);
        throw new Error('Invalid search response structure');
      }
      
      setSearchResponse({
        results: response.results,
        pagination: response.pagination,
        searchInfo: response.searchInfo
      });

      setUsingFallback(!response.success);

      if (response.error) {
        console.warn('⚠️ Search completed with errors:', response.error);
      } else {
        console.log('✅ Search successful:', {
          results: response.results.length,
          totalResults: response.pagination.totalResults,
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages
        });
        
        // Prefetch se houver próxima página
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
    
    console.groupEnd();
  }, [query, filters, sortBy, currentPage, shouldSearch, search, prefetchNextPage]);

  // CORREÇÃO: useEffect com dependências estabilizadas
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Handlers memoizados
  const handleFilterChange = useCallback((newFilters: SearchFilters, options?: { authorTyping?: boolean }) => {
    console.log('🔄 Filter change:', { newFilters, options });
    setFilters(newFilters);
    
    if (!options?.authorTyping) {
      setCurrentPage(1);
    }
  }, [setFilters, setCurrentPage]);

  const handleSortChange = useCallback((newSort: string) => {
    console.log('📊 Sort changed to:', newSort);
    setSortBy(newSort);
    setCurrentPage(1);
  }, [setSortBy, setCurrentPage]);

  const handlePageChange = useCallback((page: number) => {
    console.log('📄 Page changed to:', page);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setCurrentPage]);

  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refresh requested - clearing cache');
    clearCache();
    await performSearch();
  }, [clearCache, performSearch]);

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
