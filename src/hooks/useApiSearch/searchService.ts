
import { supabase } from '@/integrations/supabase/client';
import { SearchFilters } from '@/types/searchTypes';
import { SearchResponse } from './types';

export class SearchService {
  async executeSearch(
    query: string,
    filters: SearchFilters,
    sortBy: string,
    page: number,
    resultsPerPage: number
  ): Promise<SearchResponse> {
    const requestId = `search_${Date.now()}`;
    console.group(`🔍 ${requestId} - API Search Request`);
    console.log('📋 Parameters:', { query, filters, sortBy, page, resultsPerPage });
    
    try {
      const requestBody = {
        query: query.trim() || '',
        filters, 
        sortBy,
        page,
        resultsPerPage
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
      throw new Error(errorMessage);
    }
  }
}
