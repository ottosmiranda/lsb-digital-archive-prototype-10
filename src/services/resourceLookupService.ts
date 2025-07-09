
interface ResourceLookup {
  id: string;
  type: 'video' | 'titulo' | 'podcast';
  title: string;
}

class ResourceLookupService {
  private cache = new Map<string, ResourceLookup>();
  private typeCache = new Map<string, ResourceLookup[]>();
  
  // Cache resource mappings from homepage data
  cacheResources(resources: any[], type: 'video' | 'titulo' | 'podcast') {
    const lookups: ResourceLookup[] = resources.map(resource => ({
      id: String(resource.id),
      type,
      title: resource.title
    }));
    
    // Cache by individual ID
    lookups.forEach(lookup => {
      this.cache.set(lookup.id, lookup);
    });
    
    // Cache by type
    this.typeCache.set(type, lookups);
    
    // Persist to localStorage for quick recovery
    try {
      localStorage.setItem('resource-lookup-cache', JSON.stringify(Array.from(this.cache.entries())));
    } catch (error) {
      console.warn('Failed to persist resource lookup cache:', error);
    }
  }
  
  // Load cache from localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('resource-lookup-cache');
      if (stored) {
        const entries = JSON.parse(stored);
        this.cache = new Map(entries);
        console.log('📦 Resource lookup cache loaded from storage:', this.cache.size, 'items');
      }
    } catch (error) {
      console.warn('Failed to load resource lookup cache from storage:', error);
    }
  }
  
  // Get resource type by ID (fast lookup)
  getResourceType(id: string): 'video' | 'titulo' | 'podcast' | null {
    const lookup = this.cache.get(id);
    return lookup?.type || null;
  }
  
  // Check if resource exists in cache
  hasResource(id: string): boolean {
    return this.cache.has(id);
  }
  
  // Get all cached resource info
  getResourceInfo(id: string): ResourceLookup | null {
    return this.cache.get(id) || null;
  }
  
  // Clear cache
  clearCache() {
    this.cache.clear();
    this.typeCache.clear();
    localStorage.removeItem('resource-lookup-cache');
  }
  
  // Get cache stats for debugging
  getCacheStats() {
    return {
      totalResources: this.cache.size,
      byType: {
        video: Array.from(this.cache.values()).filter(r => r.type === 'video').length,
        titulo: Array.from(this.cache.values()).filter(r => r.type === 'titulo').length,
        podcast: Array.from(this.cache.values()).filter(r => r.type === 'podcast').length
      }
    };
  }
}

export const resourceLookupService = new ResourceLookupService();
