
import { SearchResult } from '@/types/searchTypes';
import { UnifiedPaginationService, UnifiedPageRequest } from './unifiedPaginationService';
import { GlobalPageCacheService } from './globalPageCacheService';

export interface GlobalContentStats {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

export class GlobalContentService {
  private static readonly DEFAULT_ITEMS_PER_PAGE = 9;

  // Busca paginada específica por tipo
  static async fetchSpecificTypePage(
    type: string,
    page: number, 
    limit: number = this.DEFAULT_ITEMS_PER_PAGE,
    sortBy?: string
  ): Promise<{ items: SearchResult[]; stats: GlobalContentStats }> {
    
    const requestId = `specific_${type}_page_${page}_${Date.now()}`;
    console.group(`🎯 ${requestId} - Busca Específica`);
    
    const cacheKey = GlobalPageCacheService.generatePageCacheKey(page, limit, `${type}_${sortBy}`);
    
    if (GlobalPageCacheService.isValidCache(cacheKey)) {
      const cached = GlobalPageCacheService.getPageCache(cacheKey);
      console.log(`📦 Cache HIT: ${cached.items.length} itens da página ${page} (${type})`);
      console.groupEnd();
      return cached;
    }
    
    try {
      const request: UnifiedPageRequest = { page, limit, sortBy };
      const response = await UnifiedPaginationService.fetchUnifiedPage(request);
      
      const result = {
        items: response.items,
        stats: {
          totalItems: response.totalResults,
          totalPages: response.totalPages,
          currentPage: response.currentPage,
          itemsPerPage: limit
        }
      };
      
      GlobalPageCacheService.setPageCache(cacheKey, result);
      
      console.log(`✅ Página específica ${type} ${page}: ${response.items.length} itens carregados`);
      console.groupEnd();
      
      return result;
      
    } catch (error) {
      console.error(`❌ Erro carregando página específica ${type} ${page}:`, error);
      console.groupEnd();
      throw error;
    }
  }

  static getTotalPages(itemsPerPage: number = this.DEFAULT_ITEMS_PER_PAGE): number {
    return UnifiedPaginationService.getTotalPages(itemsPerPage);
  }

  static getTotalItems(): number {
    return UnifiedPaginationService.getTotalItems();
  }

  static clearCache(): void {
    GlobalPageCacheService.clearPageCache();
  }

  static getCacheStats() {
    return GlobalPageCacheService.getCacheStats();
  }
}
