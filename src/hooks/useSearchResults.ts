
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  
  // CORREÇÃO: Debouncing para prevenir race conditions
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const instanceId = useRef(`search_instance_${Date.now()}_${Math.random()}`);
  
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

  // LÓGICA SIMPLIFICADA: Verificar se deve executar busca
  const shouldSearch = useMemo((): boolean => {
    const hasQuery = query.trim() !== '';
    const hasResourceTypeFilters = filters.resourceType.length > 0;
    const hasOtherFilters = hasActiveFilters;
    
    // ✅ NOVO: Verificar se há filtro "Todos"
    const hasAllFilter = filters.resourceType.includes('all');
    
    console.log('🔍 Lógica shouldSearch com suporte ALL:', { 
      hasQuery, 
      hasResourceTypeFilters, 
      hasOtherFilters,
      hasAllFilter,
      resourceType: filters.resourceType,
      result: hasQuery || hasResourceTypeFilters || hasOtherFilters || hasAllFilter
    });
    
    // Se há query, filtros específicos, ou filtro "Todos", executar busca
    return hasQuery || hasResourceTypeFilters || hasOtherFilters || hasAllFilter;
  }, [query, filters.resourceType, hasActiveFilters]);

  // NOVA IMPLEMENTAÇÃO: Busca com paginação real e debouncing
  const performSearch = useCallback(async () => {
    const requestId = `search_${Date.now()}`;
    console.group(`🔍 ${requestId} - Nova Arquitetura de Busca [${instanceId.current}]`);
    console.log('📋 Parâmetros:', { query, filters, sortBy, currentPage, shouldSearch });
    
    // CORREÇÃO: Cancelar busca anterior se existir
    if (abortControllerRef.current) {
      console.log('🛑 Cancelando busca anterior...');
      abortControllerRef.current.abort();
    }
    
    // Criar novo AbortController para esta busca
    abortControllerRef.current = new AbortController();

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
      
      // CORREÇÃO: Verificar se a requisição foi cancelada
      if (abortControllerRef.current?.signal.aborted) {
        console.log('🛑 Busca cancelada antes da execução');
        console.groupEnd();
        return;
      }
      
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

  // CORREÇÃO: Effect com debouncing para prevenir múltiplas buscas simultâneas
  useEffect(() => {
    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // CORREÇÃO: Debouncing de 300ms para múltiplas mudanças rápidas
    searchTimeoutRef.current = setTimeout(() => {
      console.log(`🎯 [${instanceId.current}] Executando busca após debouncing...`);
      performSearch();
    }, 300);
    
    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [performSearch]);

  // Handlers otimizados
  const handleFilterChange = useCallback((newFilters: SearchFilters, options?: { authorTyping?: boolean }) => {
    console.log('🔄 Mudança de filtro (Nova API):', { newFilters, options });
    
    // ✅ CORREÇÃO: Detectar mudança de resourceType e resetar página
    const resourceTypeChanged = 
      newFilters.resourceType.length !== filters.resourceType.length ||
      newFilters.resourceType.some((type, index) => type !== filters.resourceType[index]);

    if (resourceTypeChanged) {
      console.log('🔄 ResourceType mudou, resetando página para 1');
      setCurrentPage(1);
    }
    
    setFilters(newFilters);
    
    if (!options?.authorTyping && !resourceTypeChanged) {
      setCurrentPage(1); // Reset para página 1 em nova busca (exceto mudança de tipo)
    }
  }, [setFilters, setCurrentPage, filters.resourceType]);

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
