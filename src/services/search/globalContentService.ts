
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

  // NOVA ABORDAGEM: Busca paginada real sem carregamento completo
  static async fetchGlobalPage(
    page: number, 
    limit: number = this.DEFAULT_ITEMS_PER_PAGE,
    sortBy?: string
  ): Promise<{ items: SearchResult[]; stats: GlobalContentStats }> {
    
    const requestId = `global_page_${page}_${Date.now()}`;
    console.group(`🎯 ${requestId} - Busca Global Página REAL`);
    
    const cacheKey = GlobalPageCacheService.generatePageCacheKey(page, limit, sortBy);
    
    // Verificar cache primeiro
    if (GlobalPageCacheService.isValidCache(cacheKey)) {
      const cached = GlobalPageCacheService.getPageCache(cacheKey);
      console.log(`📦 Cache HIT: ${cached.items.length} itens da página ${page}`);
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
      
      // Cache da página
      GlobalPageCacheService.setPageCache(cacheKey, result);
      
      // Prefetch próxima página
      if (response.currentPage < response.totalPages) {
        GlobalPageCacheService.prefetchNextPage(page, limit, sortBy);
      }
      
      console.log(`✅ Página global ${page}: ${response.items.length} itens carregados`);
      console.groupEnd();
      
      return result;
      
    } catch (error) {
      console.error(`❌ Erro carregando página global ${page}:`, error);
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

  static clearGlobalCache(): void {
    GlobalPageCacheService.clearPageCache();
  }

  static getCacheStats() {
    return GlobalPageCacheService.getCacheStats();
  }

  // REMOVIDAS: Funções de agregação completa (fetchAllContentByType, aggregateAllContent)
  // JUSTIFICATIVA: Violavam o princípio YAGNI e causavam overhead desnecessário
}
