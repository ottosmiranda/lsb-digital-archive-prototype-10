
import { supabase } from '@/integrations/supabase/client';
import { SearchFilters } from '@/types/searchTypes';
import { SearchResponse } from './types';
import { SequentialPaginationService } from '../../services/search/sequentialPaginationService';

export class SearchService {
  async executeSearch(
    query: string,
    filters: SearchFilters,
    sortBy: string,
    page: number,
    resultsPerPage: number
  ): Promise<SearchResponse> {
    const requestId = `search_${Date.now()}`;
    console.group(`🔍 ${requestId} - Nova Arquitetura de Busca Sequencial`);
    
    try {
      // VALIDAÇÃO CRÍTICA: Verificar se a página é válida
      if (!SequentialPaginationService.isValidPage(page, resultsPerPage)) {
        console.warn(`❌ Página inválida: ${page}`);
        const totalPages = SequentialPaginationService.getTotalPages(resultsPerPage);
        
        return {
          success: false,
          results: [],
          pagination: {
            currentPage: page,
            totalPages,
            totalResults: SequentialPaginationService.getTotalItems(),
            hasNextPage: false,
            hasPreviousPage: false
          },
          searchInfo: {
            query,
            appliedFilters: filters,
            sortBy
          },
          error: `Página ${page} inválida. Total de páginas: ${totalPages}`
        };
      }

      // IMPLEMENTAÇÃO: Usar paginação sequencial corrigida
      const response = await SequentialPaginationService.fetchSequentialPage({
        page,
        limit: resultsPerPage,
        sortBy
      });

      console.log(`✅ Busca sequencial bem-sucedida:`, {
        results: response.items.length,
        totalResults: response.totalResults,
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        distribution: response.distribution
      });

      console.groupEnd();

      return {
        success: true,
        results: response.items,
        pagination: {
          currentPage: response.currentPage,
          totalPages: response.totalPages,
          totalResults: response.totalResults,
          hasNextPage: response.currentPage < response.totalPages,
          hasPreviousPage: response.currentPage > 1
        },
        searchInfo: {
          query,
          appliedFilters: filters,
          sortBy
        }
      };

    } catch (error) {
      console.error(`❌ Erro na busca sequencial:`, error);
      console.groupEnd();
      
      return {
        success: false,
        results: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalResults: 0,
          hasNextPage: false,
          hasPreviousPage: false
        },
        searchInfo: {
          query,
          appliedFilters: filters,
          sortBy
        },
        error: error instanceof Error ? error.message : 'Erro desconhecido na busca'
      };
    }
  }
}
