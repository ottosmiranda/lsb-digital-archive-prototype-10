
import { SearchFilters } from '@/types/searchTypes';
import { FilteredSearchResponse } from './index';

interface CacheItem {
  data: FilteredSearchResponse;
  timestamp: number;
}

export class FilteredSearchCache {
  private cache = new Map<string, CacheItem>();
  private readonly cacheLimit = 5 * 60 * 1000; // 5 minutes for filter results

  getCacheKey(query: string, filters: SearchFilters, sortBy: string, page: number): string {
    // Create specific cache key for filter combinations
    const filterKey = this.createFilterKey(filters);
    return JSON.stringify({ 
      query: query.trim(), 
      filters: filterKey, 
      sortBy, 
      page 
    });
  }

  private createFilterKey(filters: SearchFilters): string {
    // Create normalized filter key for consistent caching
    return JSON.stringify({
      resourceType: [...filters.resourceType].sort(),
      subject: [...filters.subject].sort(),
      author: [...filters.author].sort(),
      year: filters.year,
      duration: filters.duration,
      language: [...filters.language].sort(),
      documentType: [...filters.documentType].sort(),
      program: [...filters.program].sort(),
      channel: [...filters.channel].sort()
    });
  }

  isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    const cacheAge = now - cached.timestamp;
    const isValid = cacheAge < this.cacheLimit;
    
    // Additional validation: ensure results are not corrupted
    if (isValid && cached.data.results.length === 0 && cached.data.pagination.totalResults > 0) {
      console.warn('🚨 Corrupted filter cache detected - removing:', cacheKey);
      this.cache.delete(cacheKey);
      return false;
    }
    
    return isValid;
  }

  setCache(cacheKey: string, data: FilteredSearchResponse): void {
    // Only cache successful responses with valid data
    if (data.success && (data.results.length > 0 || data.pagination.totalResults === 0)) {
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      console.log('📦 Filter cache SET:', {
        key: cacheKey.substring(0, 50) + '...',
        results: data.results.length,
        totalResults: data.pagination.totalResults,
        page: data.pagination.currentPage
      });
      
      // Limit cache size to prevent memory issues
      if (this.cache.size > 50) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
    }
  }

  getCache(cacheKey: string): FilteredSearchResponse | null {
    const cached = this.cache.get(cacheKey);
    return cached?.data || null;
  }

  clearCache(): void {
    console.log('🧹 Clearing filtered search cache');
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()).map(k => k.substring(0, 50) + '...')
    };
  }
}
