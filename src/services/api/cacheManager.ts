
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private cache = new Map<string, CacheItem>();

  getCacheKey(tipo: string, page: number, limit: number, loadAll?: boolean): string {
    const prefix = loadAll ? 'exact_numbers' : 'scalable';
    // 🔥 CACHE BUSTER: Adicionar timestamp para forçar invalidação
    const cacheBuster = Date.now();
    return `${prefix}_${tipo}_${page}_${limit}_${cacheBuster}`;
  }

  isValidCache(cacheKey: string): boolean {
    // 🔥 CACHE BUSTER TEMPORÁRIO: Sempre retornar false para forçar refresh
    console.log('🔥 CACHE BUSTER ATIVO - Forçando refresh de todos os dados');
    return false;
    
    // const cached = this.cache.get(cacheKey);
    // if (!cached) {
    //   console.log(`📦 Cache MISS para ${cacheKey}`);
    //   return false;
    // }
    
    // const now = Date.now();
    // const isValid = (now - cached.timestamp) < cached.ttl;
    // console.log(`📦 Cache ${isValid ? 'HIT' : 'EXPIRADO'} para ${cacheKey}:`, {
    //   idade: Math.round((now - cached.timestamp) / 1000),
    //   ttl: Math.round(cached.ttl / 1000),
    //   itens: cached.data?.length || 0
    // });
    // return isValid;
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

  // 🔥 NOVO: Método para limpeza total forçada
  forceFullCacheClear(): void {
    console.log('🔥 LIMPEZA TOTAL FORÇADA - Todos os caches serão limpos');
    this.cache.clear();
    
    // Limpar também sessionStorage se houver
    try {
      sessionStorage.clear();
      console.log('🧹 SessionStorage limpo');
    } catch (e) {
      console.warn('⚠️ Erro ao limpar sessionStorage:', e);
    }
    
    // Limpar localStorage relacionado a cache
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('cache') || key.includes('thumbnail') || key.includes('api')) {
          localStorage.removeItem(key);
          console.log('🧹 LocalStorage key removida:', key);
        }
      });
    } catch (e) {
      console.warn('⚠️ Erro ao limpar localStorage:', e);
    }
  }

  // Novo método para invalidar cache específico
  invalidateCache(pattern: string): void {
    console.log(`🗑️ Invalidando cache com padrão: ${pattern}`);
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      console.log(`🗑️ Cache removido: ${key}`);
    });
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}
