
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
  
  // ✅ NOVO: Controle melhorado de instância e race conditions
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const instanceId = useRef(`search_instance_${Date.now()}_${Math.random()}`);
  const lastSearchParamsRef = useRef<string>('');
  const lastActiveFilterRef = useRef<string>('');
  
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

  // ✅ LÓGICA: Verificar se deve executar busca
  const shouldSearch = useMemo((): boolean => {
    const hasQuery = query.trim() !== '';
    const hasResourceTypeFilters = filters.resourceType.length > 0;
    const hasOtherFilters = hasActiveFilters;
    const hasAllFilter = filters.resourceType.includes('all');
    
    const result = hasQuery || hasResourceTypeFilters || hasOtherFilters || hasAllFilter;
    
    console.log('🔍 shouldSearch logic:', { 
      hasQuery, 
      hasResourceTypeFilters, 
      hasOtherFilters,
      hasAllFilter,
      resourceType: filters.resourceType,
      result
    });
    
    return result;
  }, [query, filters.resourceType, hasActiveFilters]);

  // ✅ CORREÇÃO: Busca com validação de consistência
  const performSearch = useCallback(async () => {
    const requestId = `search_${Date.now()}`;
    const currentFilterType = filters.resourceType[0] || 'none';
    const currentSearchParams = searchParams.toString();
    
    console.group(`🔍 ${requestId} - performSearch [${instanceId.current}]`);
    console.log('📋 Parâmetros atuais:', { 
      query, 
      currentFilterType, 
      currentPage, 
      shouldSearch,
      searchParams: currentSearchParams
    });
    
    // ✅ VALIDAÇÃO: Detectar mudança de filtro e invalidar cache específico
    if (currentFilterType !== lastActiveFilterRef.current && lastActiveFilterRef.current !== '') {
      console.log(`🔄 Mudança de filtro detectada: ${lastActiveFilterRef.current} → ${currentFilterType}`);
      clearCache(); // Limpa todo o cache ao mudar tipo de filtro
    }
    lastActiveFilterRef.current = currentFilterType;
    lastSearchParamsRef.current = currentSearchParams;

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
      console.log('🚀 Executando busca com validação de consistência...');
      
      const response = await search(query, filters, sortBy, currentPage);
      
      // ✅ VALIDAÇÃO CRÍTICA: Verificar se resposta corresponde ao estado atual
      const responseFilterType = response.searchInfo?.appliedFilters?.resourceType?.[0] || 'unknown';
      const currentStateFilter = filters.resourceType[0] || 'none';
      
      if (responseFilterType !== 'unknown' && responseFilterType !== currentStateFilter) {
        console.warn('⚠️ INCONSISTÊNCIA DETECTADA - IGNORANDO RESPOSTA:', {
          estadoAtual: currentStateFilter,
          respostaRecebida: responseFilterType,
          requestId: requestId,
          ignorandoResposta: true
        });
        console.groupEnd();
        return; // Ignorar resposta inconsistente
      }
      
      // ✅ VALIDAÇÃO DA ESTRUTURA E FILTRO DE NULLS
      if (!response.results || !Array.isArray(response.results)) {
        console.error('❌ Estrutura de resposta inválida:', response);
        throw new Error('Estrutura de resposta inválida');
      }
      
      // ✅ FILTRO CRÍTICO: Remover qualquer null/undefined que possa ter passado
      const validResults = response.results.filter(result => 
        result !== null && 
        result !== undefined && 
        result.id && 
        String(result.id).trim() !== '' &&
        !['0', 'undefined', 'null', 'missing-id'].includes(String(result.id))
      );
      
      if (validResults.length < response.results.length) {
        console.warn(`⚠️ FILTERED OUT ${response.results.length - validResults.length} invalid results in useSearchResults`);
      }
      
      setSearchResponse({
        results: validResults, // Usar apenas resultados válidos
        pagination: {
          ...response.pagination,
          totalResults: Math.max(validResults.length, response.pagination.totalResults) // Ajustar total se necessário
        },
        searchInfo: response.searchInfo
      });

      setUsingFallback(!response.success);

      if (response.error) {
        console.warn('⚠️ Busca com erros:', response.error);
      } else {
        console.log('✅ Busca bem-sucedida:', {
          results: response.results.length,
          totalResults: response.pagination.totalResults,
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          filterType: currentFilterType,
          consistente: responseFilterType === currentStateFilter
        });
        
        // Prefetch da próxima página se disponível
        if (response.pagination.hasNextPage) {
          console.log('🔮 Prefetching próxima página...');
          prefetchNextPage(query, filters, sortBy, currentPage);
        }
      }

    } catch (err) {
      // ✅ TRATAMENTO: Ignorar erros de cancelamento
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('✅ Busca cancelada (ignorando)');
        console.groupEnd();
        return;
      }
      
      console.error('❌ Busca falhou:', err);
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
  }, [query, filters, sortBy, currentPage, shouldSearch, search, prefetchNextPage, clearCache, searchParams]);

  // ✅ CORREÇÃO: Effect com debouncing ultra-agressivo para mudanças de filtro
  useEffect(() => {
    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // ✅ DEBOUNCING AGRESSIVO: 50ms para filtros, 200ms para queries
    const currentFilterType = filters.resourceType[0] || 'none';
    const isFilterChange = currentFilterType !== lastActiveFilterRef.current;
    const isQueryChange = query.trim() !== '';
    
    let debounceTime: number;
    if (isFilterChange) {
      debounceTime = 50; // Super rápido para mudanças de filtro
    } else if (isQueryChange) {
      debounceTime = 200; // Rápido para digitação
    } else {
      debounceTime = 100; // Default
    }
    
    console.log(`🎯 [${instanceId.current}] Agendando busca - Filtro: ${isFilterChange}, Query: ${isQueryChange}, Debounce: ${debounceTime}ms`);
    
    // ✅ LOADING IMEDIATO: Mostrar loading na mudança de filtro
    if (isFilterChange && shouldSearch) {
      console.log('⚡ LOADING IMEDIATO para mudança de filtro');
      // O hook useApiSearch já gerencia o loading state internamente
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      console.log(`🎯 [${instanceId.current}] Executando busca após debouncing (${debounceTime}ms)...`);
      performSearch();
    }, debounceTime);
    
    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [performSearch, query, filters.resourceType, shouldSearch]);

  // Handlers otimizados
  const handleFilterChange = useCallback((newFilters: SearchFilters, options?: { authorTyping?: boolean }) => {
    console.log('🔄 handleFilterChange:', { newFilters, options });
    
    // ✅ CORREÇÃO: Detectar mudança de resourceType e resetar página
    const resourceTypeChanged = 
      newFilters.resourceType.length !== filters.resourceType.length ||
      newFilters.resourceType.some((type, index) => type !== filters.resourceType[index]);

    if (resourceTypeChanged) {
      console.log('🔄 ResourceType mudou, resetando página e limpando cache');
      setCurrentPage(1);
      clearCache();
    }
    
    setFilters(newFilters);
    
    if (!options?.authorTyping && !resourceTypeChanged) {
      setCurrentPage(1); // Reset para página 1 em nova busca
    }
  }, [setFilters, setCurrentPage, filters.resourceType, clearCache]);

  const handleSortChange = useCallback((newSort: string) => {
    console.log('📊 handleSortChange:', newSort);
    setSortBy(newSort);
    setCurrentPage(1);
  }, [setSortBy, setCurrentPage]);

  const handlePageChange = useCallback((page: number) => {
    console.log('📄 handlePageChange:', page);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setCurrentPage]);

  const forceRefresh = useCallback(async () => {
    console.log('🔄 forceRefresh - limpando cache e re-executando');
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
