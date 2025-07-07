
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private cache = new Map<string, CacheItem>();

  getCacheKey(tipo: string, page: number, limit: number, loadAll?: boolean): string {
    const prefix = loadAll ? 'exact_numbers' : 'scalable';
    return `${prefix}_${tipo}_${page}_${limit}`;
  }

  isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      console.log(`📦 Cache MISS para ${cacheKey}`);
      return false;
    }
    
    const now = Date.now();
    const isValid = (now - cached.timestamp) < cached.ttl;
    console.log(`📦 Cache ${isValid ? 'HIT' : 'EXPIRADO'} para ${cacheKey}:`, {
      idade: Math.round((now - cached.timestamp) / 1000),
      ttl: Math.round(cached.ttl / 1000),
      itens: cached.data?.length || 0
    });
    return isValid;
  }

  setCache(cacheKey: string, data: any, ttl: number = 15 * 60 * 1000): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
    console.log(`📦 Cache SET: ${cacheKey}`, {
      itens: data.length,
      ttlMinutos: Math.round(ttl / 60000)
    });
  }

  getCache(cacheKey: string): any | null {
    const cached = this.cache.get(cacheKey);
    return cached?.data || null;
  }

  clearCache(): void {
    console.log('🧹 Limpando cache');
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}
