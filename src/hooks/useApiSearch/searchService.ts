
import { SearchFilters } from '@/types/searchTypes';
import { SearchResponse } from './types';

export class SearchService {
  // ✅ MIGRAÇÃO PARA GET: Nova implementação com parâmetros URL
  async executeSearch(
    query: string,
    filters: SearchFilters,
    sortBy: string,
    page: number,
    resultsPerPage: number
  ): Promise<SearchResponse> {
    const requestId = `search_${Date.now()}`;
    console.group(`🔍 ${requestId} - API Search GET Request`);
    console.log('📋 Parameters:', { query, filters, sortBy, page, resultsPerPage });
    
    try {
      // ✅ CONSTRUIR PARÂMETROS GET
      const params = new URLSearchParams();
      
      if (query.trim()) {
        params.set('q', query.trim());
      }
      
      params.set('page', page.toString());
      params.set('limit', resultsPerPage.toString());
      params.set('sort', sortBy);
      
      // Adicionar filtros de tipo
      if (filters.resourceType.length > 0) {
        filters.resourceType.forEach(type => {
          params.append('type', type);
        });
      }
      
      // ✅ CORREÇÃO: Usar URL base do Supabase Functions corretamente
      const SUPABASE_URL = "https://acnympbxfptajtxvmkqn.supabase.co";
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbnltcGJ4ZnB0YWp0eHZta3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDMzODcsImV4cCI6MjA2NjI3OTM4N30.7cAJTwzL28v0QyycI2wQyEotlQh34Nygfp4WnSZR66Q";
      
      const urlWithParams = `${SUPABASE_URL}/functions/v1/search-content?${params.toString()}`;
      console.log('🌐 GET URL:', urlWithParams);
      
      // ✅ REQUISIÇÃO GET COM TIMEOUT
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Search timeout after 25 seconds')), 25000);
      });
      
      const fetchPromise = fetch(urlWithParams, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        console.error('❌ GET request failed:', response.status, response.statusText);
        throw new Error(`GET request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.success) {
        console.error('❌ GET response invalid:', data);
        throw new Error(data?.error || 'Search failed - invalid response');
      }

      const searchResponse: SearchResponse = data;
      
      // Validação crítica
      if (!searchResponse.results || !Array.isArray(searchResponse.results)) {
        console.error('❌ Invalid response structure:', searchResponse);
        throw new Error('Invalid response structure from search function');
      }
      
      console.log('✅ GET Search successful:', {
        results: searchResponse.results.length,
        totalResults: searchResponse.pagination.totalResults,
        currentPage: searchResponse.pagination.currentPage,
        totalPages: searchResponse.pagination.totalPages
      });

      console.groupEnd();
      return searchResponse;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      console.error('❌ GET Search complete failure:', errorMessage);
      
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

  // ✅ MANTER MÉTODO EXISTENTE PARA COMPATIBILIDADE
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
}
