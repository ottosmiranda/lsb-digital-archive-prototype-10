import { supabase } from '@/integrations/supabase/client';
import { SearchFilters } from '@/types/searchTypes';
import { SearchResponse } from './types';
import { AllContentService } from '@/services/allContentService';

export class SearchService {
  // ✅ CORREÇÃO: Método principal com AbortSignal obrigatório
  async executeSearch(
    query: string,
    filters: SearchFilters,
    sortBy: string,
    page: number,
    resultsPerPage: number,
    abortSignal?: AbortSignal
  ): Promise<SearchResponse> {
    const requestId = `search_${Date.now()}`;
    const activeFilterType = filters.resourceType[0] || 'none';
    
    console.group(`🔍 ${requestId} - SearchService Execution`);
    console.log('📋 Parâmetros recebidos:', { 
      activeFilterType, 
      query: query.trim(), 
      page, 
      resultsPerPage 
    });

    // ✅ CORREÇÃO CRÍTICA: Lógica de despacho baseada EXCLUSIVAMENTE no filtro atual
    if (activeFilterType === 'all') {
      console.log('🎯 DESPACHO: Usando AllContentService para filtro "all"');
      const result = await this.executeAllContentSearch(page, resultsPerPage, abortSignal);
      console.groupEnd();
      return result;
    } else {
      console.log('🎯 DESPACHO: Usando Edge Function para filtro:', activeFilterType);
      const result = await this.executeEdgeFunctionSearch(
        query, filters, sortBy, page, resultsPerPage, abortSignal
      );
      console.groupEnd();
      return result;
    }
  }

  // ✅ NOVO: Método separado para busca via Edge Function
  private async executeEdgeFunctionSearch(
    query: string,
    filters: SearchFilters,
    sortBy: string,
    page: number,
    resultsPerPage: number,
    abortSignal?: AbortSignal
  ): Promise<SearchResponse> {
    const requestId = `edge_${Date.now()}`;
    const activeFilterType = filters.resourceType[0] || 'none';
    
    console.group(`🚀 ${requestId} - Edge Function Search`);
    console.log('📋 Parâmetros Edge Function:', { 
      activeFilterType, 
      query: query.trim(), 
      filters, 
      sortBy, 
      page, 
      resultsPerPage 
    });
    
    try {
      const requestBody = {
        query: query.trim() || '',
        filters, 
        sortBy,
        page,
        resultsPerPage
      };
      
      console.log('📡 Edge function body:', requestBody);
      
      // ✅ CORREÇÃO: Timeout configurável - 30s para edge function
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timeoutId = setTimeout(() => {
          console.log('⏰ Edge Function timeout (30s)');
          reject(new Error('Edge Function timeout after 30 seconds'));
        }, 30000);
        
        // Limpar timeout se abortSignal for acionado
        if (abortSignal) {
          abortSignal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('Request aborted'));
          });
        }
      });
      
      const searchPromise = supabase.functions.invoke('search-content', {
        body: requestBody
      });
      
      const { data, error: searchError } = await Promise.race([searchPromise, timeoutPromise]);

      // ✅ VALIDAÇÃO: Verificar se foi cancelado
      if (abortSignal?.aborted) {
        console.log('🛑 Edge Function request foi cancelada');
        throw new Error('Request aborted');
      }

      if (searchError) {
        console.error('❌ Edge function error:', searchError);
        throw new Error(`Search function error: ${searchError.message}`);
      }

      if (!data || !data.success) {
        console.error('❌ Edge function returned error:', data);
        throw new Error(data?.error || 'Search failed - no data returned');
      }

      const response: SearchResponse = data;
      
      // ✅ VALIDAÇÃO: Verificar estrutura da resposta
      if (!response.results || !Array.isArray(response.results)) {
        console.error('❌ Invalid response structure:', response);
        throw new Error('Invalid response structure from search function');
      }
      
      // ✅ VALIDAÇÃO: Alertar sobre inconsistências
      if (response.results.length === 0 && response.pagination.totalResults > 0) {
        console.warn('⚠️ INCONSISTÊNCIA: 0 results mas totalResults > 0');
      }

      console.log('✅ Edge Function success:', {
        activeFilterType,
        results: response.results.length,
        totalResults: response.pagination.totalResults,
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages
      });

      console.groupEnd();
      return response;

    } catch (err) {
      if (err instanceof Error && err.message.includes('aborted')) {
        console.log('✅ Edge Function request cancelada');
        console.groupEnd();
        throw err;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Edge Function search failed';
      console.error('❌ Edge Function falhou:', errorMessage);
      console.groupEnd();
      throw new Error(errorMessage);
    }
  }

  // ✅ CORREÇÃO: AllContent com AbortSignal
  private async executeAllContentSearch(
    page: number, 
    resultsPerPage: number,
    abortSignal?: AbortSignal
  ): Promise<SearchResponse> {
    const requestId = `all_${Date.now()}`;
    
    console.group(`🌐 ${requestId} - All Content Search`);
    console.log('📋 Parâmetros All Content:', { page, resultsPerPage });
    
    try {
      // ✅ CORREÇÃO: Timeout configurável - 15s para API externa
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timeoutId = setTimeout(() => {
          console.log('⏰ All Content timeout (15s)');
          reject(new Error('All Content timeout after 15 seconds'));
        }, 15000);
        
        if (abortSignal) {
          abortSignal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('Request aborted'));
          });
        }
      });

      const fetchPromise = AllContentService.fetchAllContent(page, resultsPerPage);
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      // ✅ VALIDAÇÃO: Verificar se foi cancelado
      if (abortSignal?.aborted) {
        console.log('🛑 All Content request foi cancelada');
        throw new Error('Request aborted');
      }
      
      // ✅ INTEGRAÇÃO: response.conteudo já contém itens transformados e filtrados
      // AllContentService.fetchAllContent agora já faz a transformação e filtragem
      let results = response.conteudo; // Já são SearchResult[] válidos
      
      // ✅ LOG: Verificar qualidade dos resultados
      const originalCount = results.length;
      const validResults = results.filter(item => 
        item && 
        item.id && 
        String(item.id).trim() !== '' &&
        !['0', 'undefined', 'null', 'missing-id'].includes(String(item.id))
      );
      
      if (validResults.length < originalCount) {
        console.warn(`⚠️ FILTERED OUT ${originalCount - validResults.length} invalid items in SearchService`);
        results = validResults;
      }
      
      // ✅ LIMITE: Garantir que apenas resultsPerPage itens sejam retornados
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
          appliedFilters: { 
            resourceType: ['all'], 
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
      if (error instanceof Error && error.message.includes('aborted')) {
        console.log('✅ All Content request cancelada');
        console.groupEnd();
        throw error;
      }
      
      console.error('❌ All content search failed:', error);
      console.groupEnd();
      throw error;
    }
  }

  // ✅ LEGACY: Manter compatibilidade com métodos antigos
  async searchByQuery(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    console.warn('⚠️ searchByQuery é um método legacy, considere usar executeSearch');
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
}
