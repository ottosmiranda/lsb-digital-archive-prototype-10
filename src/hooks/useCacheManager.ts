
interface CacheItem<T> {
  data: T[];
  timestamp: number;
  ttl: number;
  totalPages?: number;
  totalItems?: number;
}

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items to cache
}

export const useCacheManager = <T>(prefix: string, config: CacheConfig = {}) => {
  const { ttl = 30 * 60 * 1000, maxSize = 100 } = config; // Default: 30 minutes TTL

  const getCacheKey = (type: string, page: number) => `${prefix}_${type}_page_${page}`;
  const getMetaKey = (type: string) => `${prefix}_${type}_meta`;

  const setCache = (type: string, page: number, data: T[], meta?: { totalPages?: number; totalItems?: number }) => {
    try {
      const cacheKey = getCacheKey(type, page);
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        ...meta
      };
      
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      
      // Store metadata separately
      if (meta) {
        sessionStorage.setItem(getMetaKey(type), JSON.stringify(meta));
      }
      
      console.log(`📦 Cache SET: ${cacheKey} with ${data.length} items`);
    } catch (error) {
      console.warn('Failed to set cache:', error);
    }
  };

  const getCache = (type: string, page: number): T[] | null => {
    try {
      const cacheKey = getCacheKey(type, page);
      const cached = sessionStorage.getItem(cacheKey);
      
      if (!cached) {
        console.log(`📦 Cache MISS: ${cacheKey}`);
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - cacheItem.timestamp > cacheItem.ttl) {
        sessionStorage.removeItem(cacheKey);
        console.log(`📦 Cache EXPIRED: ${cacheKey}`);
        return null;
      }
      
      console.log(`📦 Cache HIT: ${cacheKey} with ${cacheItem.data.length} items`);
      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to get cache:', error);
      return null;
    }
  };

  const getCacheMeta = (type: string) => {
    try {
      const metaKey = getMetaKey(type);
      const cached = sessionStorage.getItem(metaKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Failed to get cache meta:', error);
      return null;
    }
  };

  const clearCache = (type?: string) => {
    try {
      if (type) {
        // Clear specific type
        const keys = Object.keys(sessionStorage).filter(key => key.startsWith(`${prefix}_${type}`));
        keys.forEach(key => sessionStorage.removeItem(key));
        console.log(`📦 Cache CLEARED for type: ${type}`);
      } else {
        // Clear all cache for this prefix
        const keys = Object.keys(sessionStorage).filter(key => key.startsWith(prefix));
        keys.forEach(key => sessionStorage.removeItem(key));
        console.log(`📦 Cache CLEARED for prefix: ${prefix}`);
      }
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  };

  const getCacheStats = () => {
    try {
      const keys = Object.keys(sessionStorage).filter(key => key.startsWith(prefix));
      const stats = {
        totalItems: keys.length,
        totalSize: keys.reduce((acc, key) => acc + (sessionStorage.getItem(key)?.length || 0), 0),
        keys: keys
      };
      return stats;
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return null;
    }
  };

  return {
    setCache,
    getCache,
    getCacheMeta,
    clearCache,
    getCacheStats
  };
};
