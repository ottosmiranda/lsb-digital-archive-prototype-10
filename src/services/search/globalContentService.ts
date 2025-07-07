
import { SearchResult } from '@/types/searchTypes';
import { ApiPaginationService } from './apiPaginationService';
import { CacheStrategyService } from './cacheStrategyService';

export interface GlobalContentStats {
  totalItems: number;
  itemsByType: {
    podcasts: number;
    videos: number;
    books: number;
  };
  loadedPages: {
    podcasts: number;
    videos: number;
    books: number;
  };
}

export class GlobalContentService {
  private static readonly MAX_CONCURRENT_REQUESTS = 3;
  private static readonly BATCH_SIZE = 100; // Items per batch
  
  // NÚMEROS EXATOS CONHECIDOS DA API
  private static readonly EXPECTED_TOTALS = {
    podcasts: 2512,
    videos: 300,
    books: 30
  };

  static async fetchAllContentByType(
    contentType: 'podcast' | 'aula' | 'livro',
    maxItems?: number
  ): Promise<{ items: SearchResult[]; actualTotal: number }> {
    const allItems: SearchResult[] = [];
    let currentPage = 1;
    let totalFromApi = 0;
    let hasMore = true;
    
    const expectedTotal = this.EXPECTED_TOTALS[
      contentType === 'aula' ? 'videos' : 
      contentType === 'livro' ? 'books' : 'podcasts'
    ];
    
    const effectiveMaxItems = maxItems || expectedTotal;
    
    console.log(`🔍 Carregando TODO o conteúdo ${contentType}. Esperado: ${expectedTotal} itens`);
    
    while (hasMore && allItems.length < effectiveMaxItems) {
      try {
        const batchSize = Math.min(this.BATCH_SIZE, effectiveMaxItems - allItems.length);
        const { items, total } = await ApiPaginationService.fetchPaginatedContent(
          contentType, 
          currentPage, 
          batchSize
        );
        
        totalFromApi = total;
        
        if (items.length === 0) {
          console.log(`📄 ${contentType} página ${currentPage}: Sem mais itens`);
          hasMore = false;
          break;
        }
        
        allItems.push(...items);
        
        console.log(`📄 ${contentType} página ${currentPage}: +${items.length} itens (total: ${allItems.length}/${totalFromApi})`);
        
        // Continuar se ainda há itens e não atingimos o limite
        hasMore = items.length === batchSize && allItems.length < totalFromApi;
        currentPage++;
        
        // Limite de segurança
        if (currentPage > 100) {
          console.warn(`⚠️ Limite de páginas atingido para ${contentType}`);
          break;
        }
        
      } catch (error) {
        console.error(`❌ Erro carregando ${contentType} página ${currentPage}:`, error);
        hasMore = false;
      }
    }
    
    console.log(`✅ ${contentType} completo: ${allItems.length} itens carregados`);
    return { items: allItems, actualTotal: totalFromApi };
  }

  static async aggregateAllContent(): Promise<{
    items: SearchResult[];
    stats: GlobalContentStats;
  }> {
    const aggregationId = `global_aggregation_${Date.now()}`;
    console.group(`🌍 ${aggregationId} - Agregação Global Completa`);
    
    try {
      // Carregar todos os tipos em paralelo
      const [podcastsResult, videosResult, booksResult] = await Promise.allSettled([
        this.fetchAllContentByType('podcast'),
        this.fetchAllContentByType('aula'),
        this.fetchAllContentByType('livro')
      ]);

      const podcasts = podcastsResult.status === 'fulfilled' ? podcastsResult.value.items : [];
      const videos = videosResult.status === 'fulfilled' ? videosResult.value.items : [];
      const books = booksResult.status === 'fulfilled' ? booksResult.value.items : [];

      // Agregar todos os itens
      const allItems = [...podcasts, ...videos, ...books];
      
      const stats: GlobalContentStats = {
        totalItems: allItems.length,
        itemsByType: {
          podcasts: podcasts.length,
          videos: videos.length,
          books: books.length
        },
        loadedPages: {
          podcasts: Math.ceil(podcasts.length / this.BATCH_SIZE),
          videos: Math.ceil(videos.length / this.BATCH_SIZE),
          books: Math.ceil(books.length / this.BATCH_SIZE)
        }
      };

      console.group('📊 ESTATÍSTICAS FINAIS');
      console.log(`📚 Livros: ${stats.itemsByType.books}`);
      console.log(`🎬 Vídeos: ${stats.itemsByType.videos}`);
      console.log(`🎧 Podcasts: ${stats.itemsByType.podcasts}`);
      console.log(`🎯 TOTAL: ${stats.totalItems} itens`);
      console.groupEnd();

      console.groupEnd();
      return { items: allItems, stats };
      
    } catch (error) {
      console.error(`❌ ${aggregationId} - Erro na agregação:`, error);
      console.groupEnd();
      throw error;
    }
  }

  static async cacheGlobalDataset(
    items: SearchResult[],
    stats: GlobalContentStats
  ): Promise<void> {
    const cacheKey = CacheStrategyService.generateCacheKey(
      'global',
      'all_content',
      1,
      { totalItems: stats.totalItems }
    );
    
    // Cache por 20 minutos (mais tempo devido ao esforço de agregação)
    const cacheData = { items, stats, timestamp: Date.now() };
    
    console.log(`📦 Cacheando dataset global: ${items.length} itens por 20min`);
    
    // Aqui você implementaria o cache real
    // Por simplicidade, vamos usar o sessionStorage como demonstração
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('⚠️ Falha ao cachear dataset global:', error);
    }
  }

  static getCachedGlobalDataset(): {
    items: SearchResult[];
    stats: GlobalContentStats;
  } | null {
    const cacheKey = CacheStrategyService.generateCacheKey(
      'global',
      'all_content',
      1,
      {}
    );
    
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      const cacheAge = Date.now() - cacheData.timestamp;
      
      // Cache válido por 20 minutos
      if (cacheAge < 20 * 60 * 1000) {
        console.log(`📦 Cache HIT global: ${cacheData.items.length} itens`);
        return { items: cacheData.items, stats: cacheData.stats };
      }
      
      // Cache expirado
      sessionStorage.removeItem(cacheKey);
      return null;
      
    } catch (error) {
      console.warn('⚠️ Erro ao recuperar cache global:', error);
      return null;
    }
  }
}
