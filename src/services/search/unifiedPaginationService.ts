
import { SearchResult } from '@/types/searchTypes';
import { ApiPaginationService } from './apiPaginationService';

export interface UnifiedPageRequest {
  page: number;
  limit: number;
  sortBy?: string;
}

export interface ContentTypeDistribution {
  podcasts: { page: number; limit: number };
  videos: { page: number; limit: number };
  books: { page: number; limit: number };
}

export interface UnifiedPageResponse {
  items: SearchResult[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  distribution: ContentTypeDistribution;
}

export class UnifiedPaginationService {
  // TOTAIS CONHECIDOS DA API
  private static readonly CONTENT_TOTALS = {
    podcasts: 2512,
    videos: 300,
    books: 30
  };

  private static readonly TOTAL_ITEMS = 
    this.CONTENT_TOTALS.podcasts + 
    this.CONTENT_TOTALS.videos + 
    this.CONTENT_TOTALS.books; // 2842

  static calculatePageDistribution(page: number, limit: number): ContentTypeDistribution {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    console.log(`📊 Calculando distribuição para página ${page} (índices ${startIndex}-${endIndex})`);
    
    // Calcular proporções baseadas nos totais reais
    const podcastRatio = this.CONTENT_TOTALS.podcasts / this.TOTAL_ITEMS; // ~0.88
    const videoRatio = this.CONTENT_TOTALS.videos / this.TOTAL_ITEMS; // ~0.11
    const bookRatio = this.CONTENT_TOTALS.books / this.TOTAL_ITEMS; // ~0.01
    
    // Distribuir itens proporcionalmente
    const podcastsNeeded = Math.round(limit * podcastRatio);
    const videosNeeded = Math.round(limit * videoRatio);
    const booksNeeded = limit - podcastsNeeded - videosNeeded; // Resto para livros
    
    // Calcular páginas correspondentes para cada tipo
    const podcastPage = Math.ceil((startIndex * podcastRatio + 1) / podcastsNeeded) || 1;
    const videoPage = Math.ceil((startIndex * videoRatio + 1) / videosNeeded) || 1;
    const bookPage = Math.ceil((startIndex * bookRatio + 1) / booksNeeded) || 1;
    
    const distribution = {
      podcasts: { 
        page: Math.max(1, podcastPage), 
        limit: Math.max(1, podcastsNeeded) 
      },
      videos: { 
        page: Math.max(1, videoPage), 
        limit: Math.max(1, videosNeeded) 
      },
      books: { 
        page: Math.max(1, bookPage), 
        limit: Math.max(1, booksNeeded) 
      }
    };
    
    console.log(`📋 Distribuição calculada:`, distribution);
    return distribution;
  }

  static async fetchUnifiedPage(request: UnifiedPageRequest): Promise<UnifiedPageResponse> {
    const { page, limit } = request;
    const requestId = `unified_page_${page}_${Date.now()}`;
    
    console.group(`🎯 ${requestId} - Busca Unificada Página ${page}`);
    
    try {
      const distribution = this.calculatePageDistribution(page, limit);
      
      // Requisições paralelas para cada tipo
      const fetchPromises = await Promise.allSettled([
        ApiPaginationService.fetchPaginatedContent('podcast', distribution.podcasts.page, distribution.podcasts.limit),
        ApiPaginationService.fetchPaginatedContent('aula', distribution.videos.page, distribution.videos.limit),
        ApiPaginationService.fetchPaginatedContent('livro', distribution.books.page, distribution.books.limit)
      ]);
      
      const allItems: SearchResult[] = [];
      
      // Processar resultados
      fetchPromises.forEach((result, index) => {
        const types = ['podcasts', 'videos', 'books'];
        const typeName = types[index];
        
        if (result.status === 'fulfilled') {
          allItems.push(...result.value.items);
          console.log(`✅ ${typeName}: ${result.value.items.length} itens carregados`);
        } else {
          console.warn(`⚠️ ${typeName}: Falha ao carregar -`, result.reason);
        }
      });
      
      // Ordenar itens se necessário
      const sortedItems = this.sortUnifiedItems(allItems, request.sortBy);
      
      // Limitar aos itens necessários (garantia adicional)
      const finalItems = sortedItems.slice(0, limit);
      
      const totalPages = Math.ceil(this.TOTAL_ITEMS / limit);
      
      const response: UnifiedPageResponse = {
        items: finalItems,
        totalResults: this.TOTAL_ITEMS,
        currentPage: page,
        totalPages,
        distribution
      };
      
      console.log(`✅ Página unificada ${page}: ${finalItems.length} itens de ${this.TOTAL_ITEMS} totais`);
      console.groupEnd();
      
      return response;
      
    } catch (error) {
      console.error(`❌ Erro na busca unificada página ${page}:`, error);
      console.groupEnd();
      throw error;
    }
  }

  private static sortUnifiedItems(items: SearchResult[], sortBy?: string): SearchResult[] {
    if (!sortBy || sortBy === 'relevance') {
      // Ordenação padrão: intercalar tipos para diversidade
      const podcasts = items.filter(item => item.type === 'podcast');
      const videos = items.filter(item => item.type === 'video');
      const books = items.filter(item => item.type === 'titulo');
      
      const interlaced: SearchResult[] = [];
      const maxLength = Math.max(podcasts.length, videos.length, books.length);
      
      for (let i = 0; i < maxLength; i++) {
        if (podcasts[i]) interlaced.push(podcasts[i]);
        if (videos[i]) interlaced.push(videos[i]);
        if (books[i]) interlaced.push(books[i]);
      }
      
      return interlaced;
    }
    
    // Outras ordenações
    switch (sortBy) {
      case 'title':
        return items.sort((a, b) => a.title.localeCompare(b.title));
      case 'recent':
        return items.sort((a, b) => (b.year || 0) - (a.year || 0));
      case 'accessed':
        const typeOrder = { 'podcast': 3, 'video': 2, 'titulo': 1 };
        return items.sort((a, b) => {
          const orderA = typeOrder[a.type as keyof typeof typeOrder] || 0;
          const orderB = typeOrder[b.type as keyof typeof typeOrder] || 0;
          if (orderA !== orderB) return orderB - orderA;
          return a.title.localeCompare(b.title);
        });
      default:
        return items;
    }
  }

  static getTotalPages(limit: number): number {
    return Math.ceil(this.TOTAL_ITEMS / limit);
  }

  static getTotalItems(): number {
    return this.TOTAL_ITEMS;
  }
}
