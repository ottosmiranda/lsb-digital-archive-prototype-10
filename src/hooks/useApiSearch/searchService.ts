
import { supabase } from '@/integrations/supabase/client';
import { SearchFilters } from '@/types/searchTypes';
import { SearchResponse } from './types';
import { AllContentService } from '@/services/allContentService';

export class SearchService {
  async executeSearch(
    query: string,
    filters: SearchFilters,
    sortBy: string,
    page: number,
    resultsPerPage: number
  ): Promise<SearchResponse> {
    // ✅ NOVO: Detectar se é busca no filtro "Todos"
    if (filters.resourceType.includes('all')) {
      return this.executeAllContentSearch(page, resultsPerPage);
    }
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

  // ✅ NOVA FUNÇÃO: Busca por query usando o novo endpoint
  async searchByQuery(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    const requestId = `query_search_${Date.now()}`;
    console.group(`🔍 ${requestId} - Query-Based Search`);
    console.log('📋 Query Parameters:', { query, page, limit });
    
    try {
      const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';
      const url = `${API_BASE_URL}/conteudo-lbs/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
      
      console.log('🌐 Query API URL:', url);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Query search timeout after 15 seconds`)), 15000);
      });
      
      const fetchPromise = fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LSB-Query-Search/1.0'
        }
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} para query search: ${query}`);
      }

      const data = await response.json();
      
      if (!data.conteudo || !Array.isArray(data.conteudo)) {
        console.warn('⚠️ Query search returned no content:', data);
        console.groupEnd();
        return {
          results: [],
          total: 0,
          totalPages: 0,
          currentPage: page
        };
      }
      
      console.log(`✅ Query search success: ${data.conteudo.length} items found`);
      console.groupEnd();
      
      return {
        results: data.conteudo,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
        currentPage: data.page || page
      };
      
    } catch (error) {
      console.error(`❌ Query search failed for "${query}":`, error);
      console.groupEnd();
      throw error;
    }
  }

  // ✅ NOVO: Busca para o filtro "Todos" usando AllContentService
  async executeAllContentSearch(page: number, resultsPerPage: number): Promise<SearchResponse> {
    const requestId = `all_search_${Date.now()}`;
    console.group(`🔍 ${requestId} - All Content Search`);
    console.log('📋 Parameters:', { page, resultsPerPage });
    
    try {
      const response = await AllContentService.fetchAllContent(page, resultsPerPage);
      
      // Transformar itens para SearchResult
      let results = response.conteudo.map(item => 
        AllContentService.transformToSearchResult(item)
      );
      
      // ✅ CORREÇÃO: Garantir que apenas resultsPerPage itens sejam retornados
      // Fallback para quando a API externa não respeita o parâmetro limit
      if (results.length > resultsPerPage) {
        console.warn(`⚠️ API retornou ${results.length} itens, limitando para ${resultsPerPage}`);
        results = results.slice(0, resultsPerPage);
      }
      
      const searchResponse: SearchResponse = {
        success: true,
        results: results,
        pagination: {
          currentPage: response.page,
          totalPages: response.totalPages,
          totalResults: response.total,
          hasNextPage: response.page < response.totalPages,
          hasPreviousPage: response.page > 1
        },
        searchInfo: {
          query: '',
          appliedFilters: { resourceType: ['all'], subject: [], author: [], year: '', duration: '', language: [], documentType: [], program: [], channel: [] },
          sortBy: 'relevance'
        }
      };
      
      console.log('✅ All content search successful:', {
        results: searchResponse.results.length,
        totalResults: searchResponse.pagination.totalResults,
        currentPage: searchResponse.pagination.currentPage,
        totalPages: searchResponse.pagination.totalPages
      });
      
      console.groupEnd();
      return searchResponse;
      
    } catch (error) {
      console.error('❌ All content search failed:', error);
      
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
          query: '',
          appliedFilters: { resourceType: ['all'], subject: [], author: [], year: '', duration: '', language: [], documentType: [], program: [], channel: [] },
          sortBy: 'relevance'
        },
        error: error instanceof Error ? error.message : 'All content search failed'
      };
      
      console.groupEnd();
      throw error;
    }
  }
}
