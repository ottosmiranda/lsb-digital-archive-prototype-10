import { useState, useEffect, useMemo, useCallback } from 'react';
import { SearchFilters, SearchResult } from '@/types/searchTypes';
import { useSearchState } from '@/hooks/useSearchState';
import { useApiSearch } from '@/hooks/useApiSearch';
import { useFilteredSearch } from '@/hooks/useFilteredSearch';
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

  // Use both regular and filtered search hooks
  const { search: regularSearch, loading: regularLoading, error: regularError, clearCache: clearRegularCache } = useApiSearch({ resultsPerPage });
  const { search: filteredSearch, loading: filteredLoading, error: filteredError, clearCache: clearFilteredCache, cancelSearch } = useFilteredSearch({ resultsPerPage });
  
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

  // CORRIGIDA: Lógica para detectar filtro "Todos" (all)
  const isGlobalFilter = useMemo((): boolean => {
    return filters.resourceType.length === 1 && filters.resourceType[0] === 'all';
  }, [filters.resourceType]);

  const hasComplexFilters = useMemo((): boolean => {
    return Boolean(
      filters.subject.length > 0 || 
      filters.author.length > 0 || 
      filters.year || 
      filters.duration || 
      filters.language.length > 0 ||
      filters.documentType.length > 0 || 
      filters.program.length > 0 || 
      filters.channel.length > 0
    );
  }, [filters]);

  const hasSimpleTypeFilter = useMemo((): boolean => {
    return Boolean(
      filters.resourceType.length > 0 && 
      !filters.resourceType.includes('all') && 
      !hasComplexFilters
    );
  }, [filters.resourceType, hasComplexFilters]);

  // CORRIGIDA: Usar busca otimizada APENAS para filtros complexos
  const shouldUseOptimizedSearch = useMemo((): boolean => {
    // Se é filtro global "Todos", SEMPRE usar busca otimizada para aproveitar o cache
    if (isGlobalFilter) return true;
    
    // Se tem filtros complexos, usar busca otimizada paginada
    if (hasComplexFilters) return true;
    
    // Se é filtro simples por tipo e não está na primeira página, usar paginação
    if (hasSimpleTypeFilter && currentPage > 1) return true;
    
    // Caso contrário, usar busca regular para carregar todos os resultados
    return false;
  }, [hasComplexFilters, hasSimpleTypeFilter, currentPage, isGlobalFilter]);

  const hasActiveFilters = useMemo((): boolean => {
    return checkHasActiveFilters(filters);
  }, [filters]);

  // CORRIGIDA: Lógica para determinar quando buscar
  const shouldSearch = useMemo((): boolean => {
    const hasQuery = query.trim() !== '';
    const hasResourceTypeFilters = filters.resourceType.length > 0;
    const hasOtherFilters = hasActiveFilters;
    
    // CORREÇÃO: Para filtro "all" (Todos), sempre buscar (busca global)
    if (isGlobalFilter) return true;
    
    return hasQuery || hasResourceTypeFilters || hasOtherFilters;
  }, [query, filters.resourceType, hasActiveFilters, isGlobalFilter]);

  // Get current loading state based on which service is being used
  const loading = shouldUseOptimizedSearch ? filteredLoading : regularLoading;
  const error = shouldUseOptimizedSearch ? filteredError : regularError;

  const performSearch = useCallback(async () => {
    const requestId = `search_${Date.now()}`;
    console.group(`🔍 ${requestId} - Search Decision (CORRIGIDA - Filtro Todos)`);
    console.log('📋 Search params:', { 
      query, 
      filters, 
      sortBy, 
      currentPage, 
      shouldSearch,
      isGlobalFilter,
      hasSimpleTypeFilter,
      hasComplexFilters,
      shouldUseOptimizedSearch
    });

    // Cancel any ongoing filtered search
    cancelSearch();

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
      let response;

      // CORRIGIDA: Tratamento especial para filtro "Todos" (all)
      if (isGlobalFilter) {
        console.log('🌐 Using OPTIMIZED search for GLOBAL filter (Todos) - ALL RESULTS');
        // Para filtro "Todos", usar busca otimizada que implementa global search
        response = await filteredSearch(query, filters, sortBy, currentPage);
      } else if (shouldUseOptimizedSearch) {
        console.log('🚀 Using OPTIMIZED search for complex filters or pagination');
        response = await filteredSearch(query, filters, sortBy, currentPage);
      } else {
        console.log('📡 Using REGULAR search for simple type filters (ALL RESULTS)');
        // Para filtros simples por tipo, usar página 1 para carregar TODOS os resultados
        const searchPage = hasSimpleTypeFilter ? 1 : currentPage;
        response = await regularSearch(query, filters, sortBy, searchPage);
      }
      
      if (!response.results || !Array.isArray(response.results)) {
        console.error('❌ Invalid search response:', response);
        throw new Error('Invalid search response structure');
      }
      
      // CORRIGIDA: Para filtros simples por tipo (não globais), aplicar paginação no frontend
      let finalResponse = response;
      if (hasSimpleTypeFilter && !shouldUseOptimizedSearch && !isGlobalFilter) {
        const totalResults = response.results.length;
        const totalPages = Math.ceil(totalResults / resultsPerPage);
        const startIndex = (currentPage - 1) * resultsPerPage;
        const paginatedResults = response.results.slice(startIndex, startIndex + resultsPerPage);
        
        finalResponse = {
          ...response,
          results: paginatedResults,
          pagination: {
            currentPage,
            totalPages,
            totalResults,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1
          }
        };
        
        console.log(`📄 Frontend pagination applied: showing ${paginatedResults.length} of ${totalResults} results (page ${currentPage}/${totalPages})`);
      }
      
      // CORRIGIDA: Para filtro "Todos", aplicar paginação no frontend SE necessário
      if (isGlobalFilter && response.pagination.totalPages === 1 && response.results.length > resultsPerPage) {
        const totalResults = response.results.length;
        const totalPages = Math.ceil(totalResults / resultsPerPage);
        const startIndex = (currentPage - 1) * resultsPerPage;
        const paginatedResults = response.results.slice(startIndex, startIndex + resultsPerPage);
        
        finalResponse = {
          ...response,
          results: paginatedResults,
          pagination: {
            currentPage,
            totalPages,
            totalResults,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1
          }
        };
        
        console.log(`🌐 Global filter pagination: showing ${paginatedResults.length} of ${totalResults} results (page ${currentPage}/${totalPages})`);
      }
      
      setSearchResponse({
        results: finalResponse.results,
        pagination: finalResponse.pagination,
        searchInfo: finalResponse.searchInfo
      });

      setUsingFallback(!finalResponse.success);

      if (response.error) {
        console.warn('⚠️ Search completed with errors:', response.error);
      } else {
        console.log('✅ Search successful:', {
          results: finalResponse.results.length,
          totalResults: finalResponse.pagination.totalResults,
          currentPage: finalResponse.pagination.currentPage,
          totalPages: finalResponse.pagination.totalPages,
          searchType: shouldUseOptimizedSearch ? '🚀 OPTIMIZED' : '📡 REGULAR (ALL RESULTS)',
          filterType: isGlobalFilter ? '🌐 GLOBAL (TODOS)' : 
                     hasSimpleTypeFilter ? '🏷️ SIMPLE TYPE' : 
                     hasComplexFilters ? '🔧 COMPLEX' : '📄 DEFAULT'
        });
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('🚫 Search was cancelled');
        console.groupEnd();
        return;
      }
      
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
  }, [query, filters, sortBy, currentPage, shouldSearch, shouldUseOptimizedSearch, hasSimpleTypeFilter, hasComplexFilters, isGlobalFilter, regularSearch, filteredSearch, cancelSearch, resultsPerPage]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

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
    console.log('🔄 Force refresh requested - clearing all caches');
    clearRegularCache();
    clearFilteredCache();
    await performSearch();
  }, [clearRegularCache, clearFilteredCache, performSearch]);

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
