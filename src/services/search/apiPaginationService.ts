
import { SearchFilters } from '@/types/searchTypes';

export interface PaginationRequest {
  query: string;
  filters: SearchFilters;
  sortBy: string;
  page: number;
  resultsPerPage: number;
}

export interface PaginationResponse {
  results: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  searchInfo: {
    query: string;
    appliedFilters: SearchFilters;
    sortBy: string;
  };
}

export class ApiPaginationService {
  private static readonly API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';
  private static readonly TIMEOUT_MS = 8000;

  static async fetchPaginatedContent(
    contentType: string,
    page: number,
    limit: number
  ): Promise<{ items: any[]; total: number }> {
    const url = `${this.API_BASE_URL}/conteudo-lbs?tipo=${contentType}&page=${page}&limit=${limit}`;
    
    console.log(`🔍 API Paginada: ${contentType} página ${page}, limite ${limit}`);
    
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout ${contentType} página ${page}`)), this.TIMEOUT_MS);
      });
      
      const fetchPromise = fetch(url, {
        headers: {
          'Accept': 'application/json',
          // ✅ REMOVIDO: 'Content-Type': 'application/json' que causava preflight OPTIONS
          'User-Agent': 'LSB-Paginated-Search/1.0'
        }
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} para ${contentType} página ${page}`);
      }

      const data = await response.json();
      const items = data.conteudo || [];
      const total = data.total || 0;
      
      console.log(`✅ API Paginada ${contentType}: ${items.length} itens, total ${total}`);
      
      return { items, total };
      
    } catch (error) {
      console.error(`❌ Erro API paginada ${contentType} página ${page}:`, error);
      throw error;
    }
  }

  static calculatePagination(
    currentPage: number,
    totalResults: number,
    resultsPerPage: number
  ) {
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    
    return {
      currentPage,
      totalPages,
      totalResults,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };
  }
}
