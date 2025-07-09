import { SearchResult } from '@/types/searchTypes';
import { ApiPaginationService } from './apiPaginationService';
import { DataTransformer } from '../api/dataTransformer';
import { ApiTimeoutManager } from '../apiTimeoutManager';

export interface SequentialPaginationRequest {
  page: number;
  limit: number;
  sortBy?: string;
}

export interface SequentialPaginationResponse {
  items: SearchResult[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  distribution: ContentDistribution;
}

export interface ContentDistribution {
  podcasts: { startIndex: number; count: number; apiPage: number };
  videos: { startIndex: number; count: number; apiPage: number };
  books: { startIndex: number; count: number; apiPage: number };
}

export class SequentialPaginationService {
  // TOTAIS REAIS CONHECIDOS DA API
  private static readonly CONTENT_TOTALS = {
    podcasts: 2512,
    videos: 300,
    books: 30
  };

  private static readonly TOTAL_ITEMS = 
    this.CONTENT_TOTALS.podcasts + 
    this.CONTENT_TOTALS.videos + 
    this.CONTENT_TOTALS.books; // 2842

  private static dataTransformer = new DataTransformer();
  private static timeoutManager = new ApiTimeoutManager();

  static calculateSequentialDistribution(page: number, limit: number): ContentDistribution {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit - 1;
    
    console.log(`📊 Calculando distribuição sequencial - Página ${page}:`, {
      startIndex,
      endIndex,
      limit,
      totalItems: this.TOTAL_ITEMS
    });

    // Definir limites para cada tipo de conteúdo
    const podcastsEnd = this.CONTENT_TOTALS.podcasts - 1;
    const videosEnd = podcastsEnd + this.CONTENT_TOTALS.videos;
    const booksEnd = videosEnd + this.CONTENT_TOTALS.books;

    let podcastsCount = 0;
    let videosCount = 0;
    let booksCount = 0;
    let podcastsApiPage = 1;
    let videosApiPage = 1;
    let booksApiPage = 1;

    // Calcular quantos itens de cada tipo precisamos
    for (let i = startIndex; i <= endIndex && i < this.TOTAL_ITEMS; i++) {
      if (i <= podcastsEnd) {
        podcastsCount++;
        podcastsApiPage = Math.ceil((i + 1) / limit);
      } else if (i <= videosEnd) {
        videosCount++;
        const videoIndex = i - this.CONTENT_TOTALS.podcasts;
        videosApiPage = Math.ceil((videoIndex + 1) / limit);
      } else {
        booksCount++;
        const bookIndex = i - this.CONTENT_TOTALS.podcasts - this.CONTENT_TOTALS.videos;
        booksApiPage = Math.ceil((bookIndex + 1) / limit);
      }
    }

    const distribution: ContentDistribution = {
      podcasts: { 
        startIndex, 
        count: podcastsCount, 
        apiPage: podcastsApiPage 
      },
      videos: { 
        startIndex: Math.max(0, startIndex - this.CONTENT_TOTALS.podcasts), 
        count: videosCount, 
        apiPage: videosApiPage 
      },
      books: { 
        startIndex: Math.max(0, startIndex - this.CONTENT_TOTALS.podcasts - this.CONTENT_TOTALS.videos), 
        count: booksCount, 
        apiPage: booksApiPage 
      }
    };

    console.log(`📋 Distribuição sequencial calculada:`, distribution);
    return distribution;
  }

  static async fetchSequentialPage(request: SequentialPaginationRequest): Promise<SequentialPaginationResponse> {
    const { page, limit } = request;
    const requestId = `sequential_page_${page}_${Date.now()}`;
    
    console.group(`🎯 ${requestId} - Busca Sequencial Página ${page}`);
    
    try {
      const distribution = this.calculateSequentialDistribution(page, limit);
      const allItems: SearchResult[] = [];

      // Buscar podcasts se necessário
      if (distribution.podcasts.count > 0) {
        console.log(`🎵 Buscando ${distribution.podcasts.count} podcasts da página ${distribution.podcasts.apiPage}`);
        try {
          const podcastsData = await ApiPaginationService.fetchPaginatedContent(
            'podcast', 
            distribution.podcasts.apiPage, 
            distribution.podcasts.count
          );
          
          const transformedPodcasts = podcastsData.items.map(item => 
            this.dataTransformer.transformToSearchResult(item, 'podcast')
          );
          
          allItems.push(...transformedPodcasts);
          console.log(`✅ Podcasts carregados: ${transformedPodcasts.length}`);
        } catch (error) {
          console.warn(`⚠️ Erro ao carregar podcasts:`, error);
        }
      }

      // Buscar vídeos se necessário
      if (distribution.videos.count > 0) {
        console.log(`🎥 Buscando ${distribution.videos.count} vídeos da página ${distribution.videos.apiPage}`);
        try {
          const videosData = await ApiPaginationService.fetchPaginatedContent(
            'aula', 
            distribution.videos.apiPage, 
            distribution.videos.count
          );
          
          const transformedVideos = videosData.items.map(item => 
            this.dataTransformer.transformToSearchResult(item, 'aula')
          );
          
          allItems.push(...transformedVideos);
          console.log(`✅ Vídeos carregados: ${transformedVideos.length}`);
        } catch (error) {
          console.warn(`⚠️ Erro ao carregar vídeos:`, error);
        }
      }

      // Buscar livros se necessário
      if (distribution.books.count > 0) {
        console.log(`📚 Buscando ${distribution.books.count} livros da página ${distribution.books.apiPage}`);
        try {
          const booksData = await ApiPaginationService.fetchPaginatedContent(
            'livro', 
            distribution.books.apiPage, 
            distribution.books.count
          );
          
          const transformedBooks = booksData.items.map(item => 
            this.dataTransformer.transformToSearchResult(item, 'livro')
          );
          
          allItems.push(...transformedBooks);
          console.log(`✅ Livros carregados: ${transformedBooks.length}`);
        } catch (error) {
          console.warn(`⚠️ Erro ao carregar livros:`, error);
        }
      }

      // Aplicar ordenação se necessário
      const sortedItems = this.applySorting(allItems, request.sortBy);
      
      // Garantir que não excedemos o limite
      const finalItems = sortedItems.slice(0, limit);
      
      const totalPages = Math.ceil(this.TOTAL_ITEMS / limit);
      
      const response: SequentialPaginationResponse = {
        items: finalItems,
        totalResults: this.TOTAL_ITEMS,
        currentPage: page,
        totalPages,
        distribution
      };
      
      console.log(`✅ Página sequencial ${page} concluída: ${finalItems.length} itens de ${this.TOTAL_ITEMS} totais`);
      console.groupEnd();
      
      return response;
      
    } catch (error) {
      console.error(`❌ Erro na busca sequencial página ${page}:`, error);
      console.groupEnd();
      throw error;
    }
  }

  private static applySorting(items: SearchResult[], sortBy?: string): SearchResult[] {
    if (!sortBy || sortBy === 'relevance') {
      // Ordenação padrão: manter ordem sequencial (podcasts, videos, books)
      return items;
    }
    
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

  static isValidPage(page: number, limit: number): boolean {
    const totalPages = this.getTotalPages(limit);
    return page >= 1 && page <= totalPages;
  }
}