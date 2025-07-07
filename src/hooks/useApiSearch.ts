
import { useState, useCallback } from 'react';
import { SearchResult, SearchFilters } from '@/types/searchTypes';
import { supabase } from '@/integrations/supabase/client';

interface SearchResponse {
  success: boolean;
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
  error?: string;
}

interface UseApiSearchProps {
  resultsPerPage?: number;
}

export const useApiSearch = ({ resultsPerPage = 9 }: UseApiSearchProps = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCache, setSearchCache] = useState<Map<string, { data: SearchResponse; timestamp: number }>>(new Map());

  const getCacheKey = (query: string, filters: SearchFilters, sortBy: string, page: number): string => {
    return JSON.stringify({ query, filters, sortBy, page });
  };

  const isValidCache = (cacheKey: string): boolean => {
    const cached = searchCache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    const cacheAge = now - cached.timestamp;
    const cacheLimit = 2 * 60 * 1000; // Reduzir para 2 minutos para debugging
    
    const isValid = cacheAge < cacheLimit;
    
    // VALIDAÇÃO CRÍTICA: Cache corrompido com resultados vazios
    if (isValid && cached.data.results.length === 0 && cached.data.pagination.totalResults > 0) {
      console.warn('🚨 CACHE CORROMPIDO detectado - removendo:', cacheKey);
      searchCache.delete(cacheKey);
      return false;
    }
    
    return isValid;
  };

  const search = useCallback(async (
    query: string,
    filters: SearchFilters,
    sortBy: string,
    page: number = 1
  ): Promise<SearchResponse> => {
    const requestId = `search_${Date.now()}`;
    console.group(`🔍 ${requestId} - API Search Request`);
    console.log('📋 Parameters:', { query, filters, sortBy, page, resultsPerPage });
    
    const cacheKey = getCacheKey(query, filters, sortBy, page);
    
    // Verificar cache válido
    if (isValidCache(cacheKey)) {
      const cached = searchCache.get(cacheKey);
      console.log('📦 Cache HIT:', { 
        results: cached!.data.results.length,
        totalResults: cached!.data.pagination.totalResults 
      });
      console.groupEnd();
      return cached!.data;
    }

    console.log('🌐 Making API request to edge function...');
    setLoading(true);
    setError(null);

    try {
      // CORREÇÃO CRÍTICA: Enviar parâmetro correto para edge function
      const requestBody = {
        query: query.trim() || '',
        filters, 
        sortBy,
        page,
        resultsPerPage // CORRIGIDO: estava enviando 'limit'
      };
      
      console.log('📡 Edge function body:', requestBody);
      
      // Timeout de 30 segundos para evitar hangs
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Search timeout after 30 seconds')), 30000);
      });
      
      const searchPromise = supabase.functions.invoke('search-content', {
        body: requestBody
      });
      
      const { data, error: searchError } = await Promise.race([searchPromise, timeoutPromise]);

      if (searchError) {
        console.error('❌ Edge function error:', searchError);
        throw new Error(`Search function error: ${searchError.message}`);
      }

      if (!data || !data.success) {
        console.error('❌ Edge function returned error:', data);
        throw new Error(data?.error || 'Search failed - no data returned');
      }

      const response: SearchResponse = data;
      
      // VALIDAÇÃO CRÍTICA: Verificar se resposta é válida
      if (!response.results || !Array.isArray(response.results)) {
        console.error('❌ Invalid response structure:', response);
        throw new Error('Invalid response structure from search function');
      }
      
      // VALIDAÇÃO: Alertar sobre inconsistências
      if (response.results.length === 0 && response.pagination.totalResults > 0) {
        console.warn('⚠️ INCONSISTÊNCIA: 0 results mas totalResults > 0');
      }
      
      // Atualizar cache apenas com respostas válidas
      if (response.results.length > 0 || response.pagination.totalResults === 0) {
        setSearchCache(prev => {
          const newCache = new Map(prev);
          newCache.set(cacheKey, {
            data: response,
            timestamp: Date.now()
          });
          
          // Limitar cache a 20 entradas
          if (newCache.size > 20) {
            const firstKey = newCache.keys().next().value;
            newCache.delete(firstKey);
          }
          
          return newCache;
        });
      }

      console.log('✅ Search successful:', {
        results: response.results.length,
        totalResults: response.pagination.totalResults,
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages
      });

      console.groupEnd();
      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      console.error('❌ Search complete failure:', errorMessage);
      setError(errorMessage);
      
      // Retornar resposta vazia em caso de erro
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
  }, [resultsPerPage]);

  const clearCache = useCallback(() => {
    console.log('🧹 Clearing search cache completely');
    setSearchCache(new Map());
  }, []);

  const prefetchNextPage = useCallback(async (
    query: string,
    filters: SearchFilters,
    sortBy: string,
    currentPage: number
  ) => {
    const nextPage = currentPage + 1;
    const cacheKey = getCacheKey(query, filters, sortBy, nextPage);
    
    if (!isValidCache(cacheKey)) {
      console.log('🔮 Prefetching page:', nextPage);
      search(query, filters, sortBy, nextPage).catch(err => {
        console.warn('⚠️ Prefetch failed:', err);
      });
    }
  }, [search]);

  return {
    search,
    loading,
    error,
    clearCache,
    prefetchNextPage
  };
};
