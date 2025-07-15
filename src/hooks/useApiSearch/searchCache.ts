
import { SearchFilters } from '@/types/searchTypes';
import { SearchResponse, CacheItem } from './types';

export class SearchCache {
  private cache = new Map<string, CacheItem>();
  private readonly cacheLimit = 2 * 60 * 1000; // 2 minutes

  getCacheKey(query: string, filters: SearchFilters, sortBy: string, page: number): string {
    // ✅ NOVO: Incluir tipo de filtro ativo na chave do cache para diferenciação
    const activeFilterType = filters.resourceType[0] || 'none';
    
    // Cache buster para Warren: Forçar chave única para evitar cache
    if (query.toLowerCase().includes('warren')) {
      const timestamp = Date.now();
      console.log('🔥 WARREN CACHE BUSTER - Chave única gerada:', timestamp);
      return JSON.stringify({ query, filters, sortBy, page, activeFilterType, warrenBuster: timestamp });
    }
    
    return JSON.stringify({ query, filters, sortBy, page, activeFilterType });
  }

  isValidCache(cacheKey: string): boolean {
    // Cache buster para Warren: Sempre retornar false para forçar refresh
    if (cacheKey.toLowerCase().includes('warren')) {
      console.log('🔥 WARREN SEARCH CACHE BUSTER ATIVO - Forçando refresh');
      return false;
    }
    
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    const cacheAge = now - cached.timestamp;
    const isValid = cacheAge < this.cacheLimit;
    
    // Validação crítica: Cache corrompido com resultados vazios
    if (isValid && cached.data.results.length === 0 && cached.data.pagination.totalResults > 0) {
      console.warn('🚨 CACHE CORROMPIDO detectado - removendo:', cacheKey);
      this.cache.delete(cacheKey);
      return false;
    }
    
    return isValid;
  }

  setCache(cacheKey: string, data: SearchResponse): void {
    // Não cachear Warren durante debug
    if (cacheKey.toLowerCase().includes('warren')) {
      console.log('🔥 WARREN - NÃO CACHEANDO DURANTE DEBUG');
      return;
    }
    
    // Atualizar cache apenas com respostas válidas
    if (data.results.length > 0 || data.pagination.totalResults === 0) {
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      // Limitar cache a 20 entradas
      if (this.cache.size > 20) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
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

  // ✅ NOVO: Método para invalidar cache específico por tipo de filtro
  invalidateFilterCache(filterType: string): void {
    console.log(`🗑️ Invalidando cache para filtro: ${filterType}`);
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(`"activeFilterType":"${filterType}"`)
    );
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      console.log(`🗑️ Cache removido: ${key}`);
    });
  }

  // ✅ NOVO: Método para limpeza total forçada
  forceFullCacheClear(): void {
    console.log('🔥 SEARCH CACHE - LIMPEZA TOTAL FORÇADA');
    this.cache.clear();
  }
}
