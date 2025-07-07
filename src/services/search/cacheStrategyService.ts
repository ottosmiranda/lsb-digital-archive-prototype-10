
export type CacheStrategy = 'paginated' | 'global' | 'filtered';

export interface CacheConfig {
  ttl: number;
  keyPrefix: string;
  description: string;
}

export class CacheStrategyService {
  private static readonly STRATEGIES: Record<CacheStrategy, CacheConfig> = {
    paginated: {
      ttl: 10 * 60 * 1000, // 10 minutos
      keyPrefix: 'paginated',
      description: 'Cache específico por página'
    },
    global: {
      ttl: 15 * 60 * 1000, // 15 minutos
      keyPrefix: 'global',
      description: 'Cache global de longa duração'
    },
    filtered: {
      ttl: 2 * 60 * 1000, // 2 minutos
      keyPrefix: 'filtered',
      description: 'Cache temporário para buscas filtradas'
    }
  };

  static getConfig(strategy: CacheStrategy): CacheConfig {
    return this.STRATEGIES[strategy];
  }

  static generateCacheKey(
    strategy: CacheStrategy,
    contentType: string,
    page: number,
    additionalParams?: Record<string, any>
  ): string {
    const config = this.getConfig(strategy);
    const baseKey = `${config.keyPrefix}_${contentType}_page${page}`;
    
    if (additionalParams && Object.keys(additionalParams).length > 0) {
      const paramString = Object.entries(additionalParams)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${value}`)
        .join('_');
      return `${baseKey}_${paramString}`;
    }
    
    return baseKey;
  }

  static shouldUseCache(strategy: CacheStrategy): boolean {
    // Strategies que sempre usam cache
    return ['paginated', 'global'].includes(strategy);
  }

  static getDescription(strategy: CacheStrategy): string {
    return this.getConfig(strategy).description;
  }
}
