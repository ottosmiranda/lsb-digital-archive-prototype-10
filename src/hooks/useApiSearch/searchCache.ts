
import { SearchFilters } from '@/types/searchTypes';
import { SearchResponse, CacheItem } from './types';

export class SearchCache {
  private cache = new Map<string, CacheItem>();
  private readonly cacheLimit = 2 * 60 * 1000; // 2 minutes

  // ✅ CORREÇÃO: Cache key melhorada com activeFilterType obrigatório
  getCacheKey(
    query: string, 
    filters: SearchFilters, 
    sortBy: string, 
    page: number, 
    activeFilterType: string
  ): string {
    // ✅ NOVO: Incluir activeFilterType na chave para diferenciação clara
    const baseKey = {
      query: query.trim(),
      activeFilterType,
      resourceType: filters.resourceType,
      sortBy,
      page,
      // Incluir outros filtros apenas se ativos
      ...(filters.subject.length > 0 && { subject: filters.subject }),
      ...(filters.author.length > 0 && { author: filters.author }),
      ...(filters.year && { year: filters.year }),
      ...(filters.duration && { duration: filters.duration }),
      ...(filters.language.length > 0 && { language: filters.language }),
      ...(filters.documentType.length > 0 && { documentType: filters.documentType }),
      ...(filters.program.length > 0 && { program: filters.program }),
      ...(filters.channel.length > 0 && { channel: filters.channel })
    };
    
    const keyString = JSON.stringify(baseKey);
    
    // Debug cache buster para Warren (se necessário)
    if (query.toLowerCase().includes('warren')) {
      const timestamp = Date.now();
      console.log('🔥 WARREN CACHE BUSTER - Chave única gerada:', timestamp);
      return keyString + `_warren_${timestamp}`;
    }
    
    return keyString;
  }

  isValidCache(cacheKey: string): boolean {
    // Cache buster para Warren
    if (cacheKey.toLowerCase().includes('warren')) {
      console.log('🔥 WARREN SEARCH CACHE BUSTER ATIVO - Forçando refresh');
      return false;
    }
    
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    const cacheAge = now - cached.timestamp;
    const isValid = cacheAge < this.cacheLimit;
    
    // ✅ VALIDAÇÃO: Cache corrompido com resultados vazios
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
    
    // ✅ VALIDAÇÃO: Apenas cachear respostas válidas e consistentes
    if (data.success && (data.results.length > 0 || data.pagination.totalResults === 0)) {
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      // Limitar cache a 30 entradas (aumentado devido às chaves mais específicas)
      if (this.cache.size > 30) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      console.log('💾 Cache salvo para:', {
        activeFilterType: data.searchInfo?.appliedFilters?.resourceType?.[0] || 'unknown',
        results: data.results.length,
        totalResults: data.pagination.totalResults
      });
    } else {
      console.warn('⚠️ Não cacheando resposta inválida:', {
        success: data.success,
        results: data.results?.length || 0,
        totalResults: data.pagination?.totalResults || 0
      });
    }
  }

  getCache(cacheKey: string): SearchResponse | null {
    const cached = this.cache.get(cacheKey);
    return cached?.data || null;
  }

  clearCache(): void {
    console.log('🧹 Limpando cache de busca completo');
    this.cache.clear();
  }

  // ✅ NOVO: Invalidar cache específico por tipo de filtro
  invalidateFilterCache(filterType: string): void {
    console.log(`🗑️ Invalidando cache para filtro: ${filterType}`);
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(`"activeFilterType":"${filterType}"`)
    );
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      console.log(`🗑️ Cache removido: ${key.substring(0, 100)}...`);
    });
  }

  // ✅ NOVO: Método para debug do estado do cache
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()).map(key => {
        try {
          const parsed = JSON.parse(key);
          return `${parsed.activeFilterType || 'unknown'}_p${parsed.page || 1}`;
        } catch {
          return key.substring(0, 50);
        }
      })
    };
  }
}
