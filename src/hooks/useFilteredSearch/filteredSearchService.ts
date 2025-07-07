
import { supabase } from '@/integrations/supabase/client';
import { SearchFilters } from '@/types/searchTypes';
import { FilteredSearchResponse } from './index';

export class FilteredSearchService {
  private readonly FILTER_TIMEOUT = 5000; // 5 seconds for filter operations
  private readonly PREFETCH_TIMEOUT = 3000; // 3 seconds for prefetch operations

  async executeFilteredSearch(
    query: string,
    filters: SearchFilters,
    sortBy: string,
    page: number,
    resultsPerPage: number,
    signal?: AbortSignal
  ): Promise<FilteredSearchResponse> {
    const requestId = `filter_search_${Date.now()}`;
    console.group(`🔍 ${requestId} - Filtered Search (Optimized)`);
    console.log('📋 Parameters:', { query, filters, sortBy, page, resultsPerPage });
    
    try {
      const requestBody = {
        query: query.trim() || '',
        filters, 
        sortBy,
        page,
        resultsPerPage,
        optimized: true // Flag for optimized search
      };
      
      console.log('📡 Optimized search request:', requestBody);
      
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Filter search timeout after ${this.FILTER_TIMEOUT}ms`));
        }, this.FILTER_TIMEOUT);
        
        // Clear timeout if request is aborted
        signal?.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('Filter search aborted'));
        });
      });
      
      const searchPromise = supabase.functions.invoke('search-content', {
        body: requestBody
      });
      
      const { data, error: searchError } = await Promise.race([searchPromise, timeoutPromise]);

      if (searchError) {
        console.error('❌ Filter search error:', searchError);
        throw new Error(`Filter search error: ${searchError.message}`);
      }

      if (!data || !data.success) {
        console.error('❌ Filter search returned error:', data);
        throw new Error(data?.error || 'Filter search failed');
      }

      const response: FilteredSearchResponse = data;
      
      // Validate response structure
      if (!response.results || !Array.isArray(response.results)) {
        console.error('❌ Invalid filter response structure:', response);
        throw new Error('Invalid filter response structure');
      }

      console.log('✅ Filter search successful:', {
        results: response.results.length,
        totalResults: response.pagination.totalResults,
        currentPage: response.pagination.currentPage,
        totalPages: response.pagination.totalPages,
        responseTime: Date.now() - parseInt(requestId.split('_')[2])
      });

      console.groupEnd();
      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Filter search failed';
      console.error('❌ Filter search failed:', errorMessage);
      console.groupEnd();
      throw new Error(errorMessage);
    }
  }

  async prefetchPage(
    query: string,
    filters: SearchFilters,
    sortBy: string,
    page: number,
    resultsPerPage: number
  ): Promise<FilteredSearchResponse> {
    console.log('🔮 Prefetching page:', page);
    
    try {
      const requestBody = {
        query: query.trim() || '',
        filters, 
        sortBy,
        page,
        resultsPerPage,
        optimized: true,
        prefetch: true
      };
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Prefetch timeout')), this.PREFETCH_TIMEOUT);
      });
      
      const searchPromise = supabase.functions.invoke('search-content', {
        body: requestBody
      });
      
      const { data, error } = await Promise.race([searchPromise, timeoutPromise]);
      
      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Prefetch failed');
      }
      
      return data;
      
    } catch (err) {
      console.warn('⚠️ Prefetch failed:', err);
      throw err;
    }
  }
}
