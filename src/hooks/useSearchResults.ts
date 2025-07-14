
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  
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

  // Verificação de filtros ativos
  const hasActiveFilters = useMemo((): boolean => {
    return checkHasActiveFilters(filters);
  }, [filters]);

  // LÓGICA CORRIGIDA: Verificar se deve executar busca - incluindo filtro "all"
  const shouldSearch = useMemo((): boolean => {
    const hasQuery = query.trim() !== '';
    const hasResourceTypeFilters = filters.resourceType.length > 0;
    const hasOtherFilters = hasActiveFilters;
    
    // CORREÇÃO: Detectar se filtro "all" está ativo na URL
    const currentFilters = searchParams.getAll('filtros');
    const hasAllFilter = currentFilters.includes('all');
    
    console.log('🔍 Lógica shouldSearch CORRIGIDA:', { 
      hasQuery, 
      hasResourceTypeFilters, 
      hasOtherFilters,
      hasAllFilter,
      currentUrlFilters: currentFilters,
      resourceType: filters.resourceType,
      result: hasQuery || hasResourceTypeFilters || hasOtherFilters || hasAllFilter
    });
    
    // CORREÇÃO: Se filtro "all" está ativo, deve executar busca global
    return hasQuery || hasResourceTypeFilters || hasOtherFilters || hasAllFilter;
  }, [query, filters.resourceType, hasActiveFilters, searchParams]);

  // NOVA IMPLEMENTAÇÃO: Busca com paginação real
  const performSearch = useCallback(async () => {
    const requestId = `search_${Date.now()}`;
    console.group(`🔍 ${requestId} - Nova Arquitetura de Busca`);
    console.log('📋 Parâmetros:', { query, filters, sortBy, currentPage, shouldSearch });

    // Se não deve buscar, limpar resultados
    if (!shouldSearch) {
      console.log('❌ Não deve buscar - limpando resultados');
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
      console.log('🚀 Executando busca com paginação real via Nova API...');
      const response = await search(query, filters, sortBy, currentPage);
      
      // Validação da resposta
      if (!response.results || !Array.isArray(response.results)) {
        console.error('❌ Resposta inválida da Nova API:', response);
        throw new Error('Estrutura de resposta inválida da Nova API');
      }
      
      setSearchResponse({
        results: response.results,
        pagination: response.pagination,
        searchInfo: response.searchInfo
      });

      setUsingFallback(!response.success);

      if (response.error) {
        console.warn('⚠️ Nova API com erros:', response.error);
      } else {
        console.log('✅ Nova API bem-sucedida:', {
          results: response.results.length,
          totalResults: response.pagination.totalResults,
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          paginaçãoReal: '🎯 SIM'
        });
        
        // Prefetch da próxima página se disponível
        if (response.pagination.hasNextPage) {
          console.log('🔮 Prefetching próxima página...');
          prefetchNextPage(query, filters, sortBy, currentPage);
        }
      }

    } catch (err) {
      console.error('❌ Nova API falhou:', err);
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

  // Effect para executar busca quando parâmetros mudarem
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Handlers otimizados
  const handleFilterChange = useCallback((newFilters: SearchFilters, options?: { authorTyping?: boolean }) => {
    console.log('🔄 Mudança de filtro (Nova API):', { newFilters, options });
    setFilters(newFilters);
    
    if (!options?.authorTyping) {
      setCurrentPage(1); // Reset para página 1 em nova busca
    }
  }, [setFilters, setCurrentPage]);

  const handleSortChange = useCallback((newSort: string) => {
    console.log('📊 Mudança de ordenação (Nova API):', newSort);
    setSortBy(newSort);
    setCurrentPage(1); // Reset para página 1
  }, [setSortBy, setCurrentPage]);

  const handlePageChange = useCallback((page: number) => {
    console.log('📄 Mudança de página (PAGINAÇÃO REAL):', page);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setCurrentPage]);

  const forceRefresh = useCallback(async () => {
    console.log('🔄 Refresh forçado (Nova API) - limpando cache');
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
