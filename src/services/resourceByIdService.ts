
import { supabase } from '@/integrations/supabase/client';
import { SearchResult } from '@/types/searchTypes';
import { Resource } from '@/types/resourceTypes';

interface ResourceByIdCache {
  [key: string]: {
    resource: Resource;
    timestamp: number;
    ttl: number;
  };
}

interface SearchByIdResponse {
  success: boolean;
  resource?: Resource;
  suggestions?: SearchResult[];
  error?: string;
}

class ResourceByIdService {
  private cache: ResourceByIdCache = {};
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutos para recursos buscados por ID

  /**
   * Busca um recurso específico por ID, primeiro no cache, depois na API
   */
  async findResourceById(id: string): Promise<SearchByIdResponse> {
    console.log(`🔍 ResourceByIdService: Buscando recurso com ID ${id}`);

    // 1. Verificar cache local
    const cached = this.getCachedResource(id);
    if (cached) {
      console.log(`📦 Cache HIT para ID ${id}`);
      return { success: true, resource: cached };
    }

    // 2. Buscar na API via edge function
    try {
      const { data, error } = await supabase.functions.invoke('search-content', {
        body: {
          query: '',
          filters: { resourceType: ['all'] },
          searchById: id, // Novo parâmetro para busca por ID específico
          sortBy: 'relevance',
          page: 1,
          resultsPerPage: 1
        }
      });

      if (error) {
        console.error(`❌ Erro na busca por ID ${id}:`, error);
        return { success: false, error: error.message };
      }

      if (data.success && data.results.length > 0) {
        const searchResult = data.results[0];
        const resource = this.transformSearchResultToResource(searchResult, id);
        
        // Cache o resultado
        this.setCachedResource(id, resource);
        
        console.log(`✅ Recurso encontrado para ID ${id}:`, resource.title);
        return { success: true, resource };
      }

      // 3. Se não encontrado, buscar sugestões
      console.log(`🔍 Recurso não encontrado para ID ${id}, buscando sugestões...`);
      const suggestions = await this.findSuggestions(id);
      
      return { 
        success: false, 
        error: `Recurso com ID ${id} não encontrado`,
        suggestions 
      };

    } catch (error) {
      console.error(`❌ Erro na busca por ID ${id}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Busca sugestões baseadas no ID não encontrado
   */
  private async findSuggestions(originalId: string): Promise<SearchResult[]> {
    try {
      // Tentar buscar recursos próximos numericamente
      const numericId = parseInt(originalId);
      if (!isNaN(numericId)) {
        const { data } = await supabase.functions.invoke('search-content', {
          body: {
            query: '',
            filters: { resourceType: ['all'] },
            sortBy: 'relevance',
            page: 1,
            resultsPerPage: 5,
            findSimilar: numericId // Novo parâmetro para buscar IDs próximos
          }
        });

        if (data.success && data.results.length > 0) {
          console.log(`💡 Encontradas ${data.results.length} sugestões para ID ${originalId}`);
          return data.results.slice(0, 3); // Retornar apenas 3 sugestões
        }
      }

      return [];
    } catch (error) {
      console.error('❌ Erro ao buscar sugestões:', error);
      return [];
    }
  }

  /**
   * Transforma SearchResult em Resource
   */
  private transformSearchResultToResource(searchResult: SearchResult, requestedId: string): Resource {
    return {
      id: typeof searchResult.id === 'string' ? parseInt(requestedId) : searchResult.id,
      title: searchResult.title,
      type: searchResult.type,
      author: searchResult.author,
      duration: searchResult.duration,
      pages: searchResult.pages,
      episodes: searchResult.episodes ? 
        (typeof searchResult.episodes === 'string' ? 
          parseInt(searchResult.episodes.replace(/\D/g, '')) : searchResult.episodes) : undefined,
      thumbnail: searchResult.thumbnail,
      description: searchResult.description,
      year: searchResult.year,
      subject: searchResult.subject,
      embedUrl: (searchResult as any).embedUrl,
      pdfUrl: (searchResult as any).pdfUrl,
      fullDescription: searchResult.description,
      tags: searchResult.subject ? [searchResult.subject] : undefined,
      language: (searchResult as any).language,
      documentType: (searchResult as any).documentType,
      categories: (searchResult as any).categories
    };
  }

  /**
   * Verifica se existe um recurso válido no cache
   */
  private getCachedResource(id: string): Resource | null {
    const cached = this.cache[id];
    if (!cached) return null;

    const isExpired = (Date.now() - cached.timestamp) > cached.ttl;
    if (isExpired) {
      delete this.cache[id];
      return null;
    }

    return cached.resource;
  }

  /**
   * Armazena um recurso no cache
   */
  private setCachedResource(id: string, resource: Resource): void {
    this.cache[id] = {
      resource,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    };
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    this.cache = {};
    console.log('🧹 Cache do ResourceByIdService limpo');
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: Object.keys(this.cache).length,
      keys: Object.keys(this.cache)
    };
  }
}

// Exportar instância singleton
export const resourceByIdService = new ResourceByIdService();
