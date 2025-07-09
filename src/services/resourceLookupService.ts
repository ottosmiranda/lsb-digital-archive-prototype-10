
interface ResourceTypeMapping {
  [id: string]: 'video' | 'titulo' | 'podcast';
}

interface CachedResource {
  resource: any;
  timestamp: number;
  ttl: number;
}

export class ResourceLookupService {
  private static readonly TYPE_MAPPING_KEY = 'resource_type_mapping';
  private static readonly RESOURCE_CACHE_PREFIX = 'cached_resource_';
  private static readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

  static saveTypeMapping(id: string, type: 'video' | 'titulo' | 'podcast'): void {
    try {
      const currentMapping = this.getTypeMapping();
      currentMapping[id] = type;
      sessionStorage.setItem(this.TYPE_MAPPING_KEY, JSON.stringify(currentMapping));
      console.log(`💾 Tipo salvo: ${id} → ${type}`);
    } catch (error) {
      console.warn('Falha ao salvar mapeamento de tipo:', error);
    }
  }

  static getResourceType(id: string): 'video' | 'titulo' | 'podcast' | null {
    try {
      const mapping = this.getTypeMapping();
      const type = mapping[id] || null;
      console.log(`🔍 Tipo encontrado: ${id} → ${type || 'não encontrado'}`);
      return type;
    } catch (error) {
      console.warn('Falha ao buscar tipo do recurso:', error);
      return null;
    }
  }

  static saveResourceCache(id: string, resource: any): void {
    try {
      const cached: CachedResource = {
        resource,
        timestamp: Date.now(),
        ttl: this.DEFAULT_TTL
      };
      sessionStorage.setItem(`${this.RESOURCE_CACHE_PREFIX}${id}`, JSON.stringify(cached));
      console.log(`💾 Recurso cacheado: ${id}`);
    } catch (error) {
      console.warn('Falha ao cachear recurso:', error);
    }
  }

  static getCachedResource(id: string): any | null {
    try {
      const cached = sessionStorage.getItem(`${this.RESOURCE_CACHE_PREFIX}${id}`);
      if (!cached) {
        console.log(`📦 Cache MISS: ${id}`);
        return null;
      }

      const cachedResource: CachedResource = JSON.parse(cached);
      const now = Date.now();
      
      if (now - cachedResource.timestamp > cachedResource.ttl) {
        sessionStorage.removeItem(`${this.RESOURCE_CACHE_PREFIX}${id}`);
        console.log(`📦 Cache EXPIRADO: ${id}`);
        return null;
      }

      console.log(`📦 Cache HIT: ${id}`);
      return cachedResource.resource;
    } catch (error) {
      console.warn('Falha ao buscar cache:', error);
      return null;
    }
  }

  static batchSaveTypeMapping(resources: Array<{ id: string; type: 'video' | 'titulo' | 'podcast' }>): void {
    try {
      const currentMapping = this.getTypeMapping();
      resources.forEach(({ id, type }) => {
        currentMapping[id] = type;
      });
      sessionStorage.setItem(this.TYPE_MAPPING_KEY, JSON.stringify(currentMapping));
      console.log(`💾 Mapeamento em lote salvo: ${resources.length} itens`);
    } catch (error) {
      console.warn('Falha ao salvar mapeamento em lote:', error);
    }
  }

  static clearCache(): void {
    try {
      // Clear type mapping
      sessionStorage.removeItem(this.TYPE_MAPPING_KEY);
      
      // Clear all cached resources
      const keys = Object.keys(sessionStorage).filter(key => 
        key.startsWith(this.RESOURCE_CACHE_PREFIX)
      );
      keys.forEach(key => sessionStorage.removeItem(key));
      
      console.log('🧹 Cache limpo completamente');
    } catch (error) {
      console.warn('Falha ao limpar cache:', error);
    }
  }

  private static getTypeMapping(): ResourceTypeMapping {
    try {
      const mapping = sessionStorage.getItem(this.TYPE_MAPPING_KEY);
      return mapping ? JSON.parse(mapping) : {};
    } catch (error) {
      console.warn('Falha ao buscar mapeamento:', error);
      return {};
    }
  }

  static getCacheStats() {
    try {
      const typeMapping = this.getTypeMapping();
      const resourceKeys = Object.keys(sessionStorage).filter(key => 
        key.startsWith(this.RESOURCE_CACHE_PREFIX)
      );
      
      return {
        typeMappingCount: Object.keys(typeMapping).length,
        cachedResourcesCount: resourceKeys.length,
        totalStorageKeys: Object.keys(sessionStorage).length
      };
    } catch (error) {
      console.warn('Falha ao obter estatísticas do cache:', error);
      return { typeMappingCount: 0, cachedResourcesCount: 0, totalStorageKeys: 0 };
    }
  }
}
