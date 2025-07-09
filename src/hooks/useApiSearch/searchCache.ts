
import { SearchFilters } from '@/types/searchTypes';
import { SearchResponse, CacheItem } from './types';

export class SearchCache {
  private cache = new Map<string, CacheItem>();
  private readonly cacheLimit = 2 * 60 * 1000; // 2 minutes

  getCacheKey(query: string, filters: SearchFilters, sortBy: string, page: number): string {
    return JSON.stringify({ query, filters, sortBy, page });
  }

  isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    const cacheAge = now - cached.timestamp;
    const isValid = cacheAge < this.cacheLimit;
    
    // VALIDAÇÃO CRÍTICA: Cache corrompido com resultados vazios
    if (isValid && cached.data.results.length === 0 && cached.data.pagination.totalResults > 0) {
      console.warn('🚨 CACHE CORROMPIDO detectado - removendo:', cacheKey);
      this.cache.delete(cacheKey);
      return false;
    }
    
    return isValid;
  }

  setCache(cacheKey: string, data: SearchResponse): void {
    // CORREÇÃO CRÍTICA: Permitir cache de páginas válidas vazias e respostas com erro
    const isValidForCache = 
      data.results.length > 0 || // Tem resultados
      data.pagination.totalResults === 0 || // Busca realmente vazia
      (data.pagination.totalPages > 0 && data.pagination.currentPage <= data.pagination.totalPages); // Página válida
    
    if (isValidForCache) {
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      console.log(`📦 Cache UPDATED:`, {
        page: data.pagination.currentPage,
        results: data.results.length,
        totalResults: data.pagination.totalResults,
        success: data.success
      });
      
      // Limitar cache a 20 entradas
      if (this.cache.size > 20) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
    } else {
      console.warn(`🚫 Cache REJECTED - dados inválidos:`, {
        results: data.results.length,
        totalResults: data.pagination.totalResults,
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages
      });
    }
  }

  getCache(cacheKey: string): SearchResponse | null {
    const cached = this.cache.get(cacheKey);
    return cached?.data || null;
  }

  clearCache(): void {
    console.log('🧹 Clearing search cache completely');
    this.cache.clear();
  }
}
