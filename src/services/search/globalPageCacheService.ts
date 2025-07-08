
export interface CachedPageData {
  data: any;
  timestamp: number;
  ttl: number;
}

export class GlobalPageCacheService {
  private static readonly PAGE_CACHE_TTL = 10 * 60 * 1000; // 10 minutos
  private static readonly MAX_CACHED_PAGES = 20;
  private static cache = new Map<string, CachedPageData>();

  static generatePageCacheKey(page: number, limit: number, sortBy?: string): string {
    return `global-page-${page}-limit${limit}-sort${sortBy || 'default'}`;
  }

  static isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;

    const isValid = (Date.now() - cached.timestamp) < cached.ttl;
    
    if (!isValid) {
      this.cache.delete(cacheKey);
      return false;
    }

    // Validação de integridade: verificar se dados não estão corrompidos
    if (!cached.data || (Array.isArray(cached.data.items) && cached.data.items.length === 0)) {
      console.warn(`🚨 Cache corrompido detectado: ${cacheKey}`);
      this.cache.delete(cacheKey);
      return false;
    }

    return true;
  }

  static setPageCache(cacheKey: string, data: any): void {
    // Não cachear resultados vazios ou inválidos
    if (!data || (Array.isArray(data.items) && data.items.length === 0)) {
      console.warn(`⚠️ Não cacheando resultado vazio: ${cacheKey}`);
      return;
    }

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: this.PAGE_CACHE_TTL
    });

    console.log(`📦 Cache SET página: ${cacheKey} (${data.items?.length || 'N/A'} itens)`);

    // Limitar tamanho do cache
    if (this.cache.size > this.MAX_CACHED_PAGES) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      console.log(`🧹 Cache limitado: removido ${firstKey}`);
    }
  }

  static getPageCache(cacheKey: string): any | null {
    const cached = this.cache.get(cacheKey);
    return cached?.data || null;
  }

  static clearPageCache(): void {
    console.log(`🧹 Limpando cache de páginas: ${this.cache.size} entradas removidas`);
    this.cache.clear();
  }

  static prefetchNextPage(currentPage: number, limit: number, sortBy?: string): void {
    const nextPage = currentPage + 1;
    const nextPageKey = this.generatePageCacheKey(nextPage, limit, sortBy);
    
    if (!this.isValidCache(nextPageKey)) {
      console.log(`🔮 Prefetch próxima página: ${nextPage}`);
      // Aqui poderia implementar prefetch em background
      // Por simplicidade, apenas logamos a intenção
    }
  }

  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
