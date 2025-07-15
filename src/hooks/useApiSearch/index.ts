
import { useState, useCallback, useRef } from 'react';
import { SearchFilters } from '@/types/searchTypes';
import { SearchResponse, UseApiSearchProps } from './types';
import { SearchCache } from './searchCache';
import { SearchService } from './searchService';

export const useApiSearch = ({ resultsPerPage = 9 }: UseApiSearchProps = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCache] = useState(() => new SearchCache());
  const [searchService] = useState(() => new SearchService());
  
  // ✅ NOVO: AbortController para cancelar requisições anteriores
  const activeControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(async (
    query: string,
    filters: SearchFilters,
    sortBy: string,
    page: number = 1
  ): Promise<SearchResponse> => {
    const requestId = `search_${Date.now()}_${Math.random()}`;
    console.group(`🔍 ${requestId} - Nova Busca com AbortController`);
    
    // ✅ CORREÇÃO 1: Cancelar requisição anterior para evitar race conditions
    if (activeControllerRef.current) {
      console.log('🛑 Cancelando requisição anterior para evitar race condition');
      activeControllerRef.current.abort();
    }

    // Criar novo AbortController para esta requisição
    const controller = new AbortController();
    activeControllerRef.current = controller;

    // ✅ CORREÇÃO 2: Cache key melhorada com tipo de filtro
    const activeFilterType = filters.resourceType[0] || 'none';
    const cacheKey = searchCache.getCacheKey(query, filters, sortBy, page, activeFilterType);
    
    console.log('📋 Parâmetros da busca:', { 
      query, 
      activeFilterType, 
      filters: filters.resourceType, 
      page, 
      requestId 
    });

    // Verificar cache válido
    if (searchCache.isValidCache(cacheKey)) {
      const cached = searchCache.getCache(cacheKey);
      if (cached) {
        console.log('📦 Cache HIT para tipo:', activeFilterType, { 
          results: cached.results.length,
          totalResults: cached.pagination.totalResults 
        });
        console.groupEnd();
        return cached;
      }
    }

    console.log('🌐 Fazendo requisição para filtro tipo:', activeFilterType);
    setLoading(true);
    setError(null);

    try {
      // ✅ CORREÇÃO 3: Passar AbortController para o SearchService
      const response = await searchService.executeSearch(
        query,
        filters,
        sortBy,
        page,
        resultsPerPage,
        controller.signal
      );

      // ✅ CORREÇÃO 4: Verificar se a requisição não foi cancelada antes de processar
      if (controller.signal.aborted) {
        console.log('🛑 Requisição foi cancelada, ignorando resposta');
        console.groupEnd();
        return {
          success: false,
          results: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalResults: 0,
            hasNextPage: false,
            hasPreviousPage: false
          },
          searchInfo: { query, appliedFilters: filters, sortBy },
          error: 'Request cancelled'
        };
      }

      // ✅ VALIDAÇÃO: Garantir que a resposta corresponde ao filtro ativo
      const responseFilterType = response.searchInfo?.appliedFilters?.resourceType?.[0] || 'unknown';
      if (responseFilterType !== 'unknown' && responseFilterType !== activeFilterType) {
        console.warn('⚠️ INCONSISTÊNCIA: Resposta para filtro diferente!', {
          esperado: activeFilterType,
          recebido: responseFilterType
        });
      }

      searchCache.setCache(cacheKey, response);
      
      console.log('✅ Busca bem-sucedida para tipo:', activeFilterType, {
        results: response.results.length,
        totalResults: response.pagination.totalResults,
        requestId
      });
      
      console.groupEnd();
      return response;

    } catch (err) {
      // ✅ CORREÇÃO 5: Tratar AbortError de forma especial
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('✅ Requisição cancelada com sucesso (AbortError)');
        console.groupEnd();
        throw err; // Re-throw para ser tratado pelo caller
      }

      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      console.error('❌ Busca falhou para tipo:', activeFilterType, errorMessage);
      setError(errorMessage);
      
      const errorResponse: SearchResponse = {
        success: false,
        results: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalResults: 0,
          hasNextPage: false,
          hasPreviousPage: false
        },
        searchInfo: {
          query,
          appliedFilters: filters,
          sortBy
        },
        error: errorMessage
      };
      
      console.groupEnd();
      return errorResponse;
    } finally {
      setLoading(false);
    }
  }, [resultsPerPage, searchCache, searchService]);

  const clearCache = useCallback(() => {
    searchCache.clearCache();
  }, [searchCache]);

  const prefetchNextPage = useCallback(async (
    query: string,
    filters: SearchFilters,
    sortBy: string,
    currentPage: number
  ) => {
    const nextPage = currentPage + 1;
    const activeFilterType = filters.resourceType[0] || 'none';
    const cacheKey = searchCache.getCacheKey(query, filters, sortBy, nextPage, activeFilterType);
    
    if (!searchCache.isValidCache(cacheKey)) {
      console.log('🔮 Prefetching page:', nextPage, 'para tipo:', activeFilterType);
      search(query, filters, sortBy, nextPage).catch(err => {
        if (err.name !== 'AbortError') {
          console.warn('⚠️ Prefetch failed:', err);
        }
      });
    }
  }, [search, searchCache]);

  return {
    search,
    loading,
    error,
    clearCache,
    prefetchNextPage
  };
};

// Re-export types for convenience
export type { SearchResponse, UseApiSearchProps } from './types';
