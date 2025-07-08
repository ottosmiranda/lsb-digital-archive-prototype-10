
import { Resource } from '@/types/resourceTypes';

export interface ResourceByIdResponse {
  success: boolean;
  resource: Resource | null;
  suggestions: Resource[];
  error?: string;
}

export interface ApiResourceItem {
  id: string;
  originalId?: string;
  titulo?: string;
  title?: string;
  podcast_titulo?: string;
  autor?: string;
  canal?: string;
  descricao?: string;
  description?: string;
  ano?: number;
  year?: number;
  categorias?: string[];
  categories?: string[];
  imagem_url?: string;
  thumbnail?: string;
  embed_url?: string;
  arquivo?: string;
  paginas?: number;
  pages?: number;
  duracao_ms?: number;
  duration?: string;
  language?: string;
  tipo_documento?: string;
  pais?: string;
}

class ResourceByIdService {
  private static readonly API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';
  private static readonly TIMEOUT_MS = 8000;
  private cache = new Map<string, { resource: Resource; timestamp: number }>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  private getCacheKey(id: string): string {
    return `resource_${id}`;
  }

  private isValidCache(timestamp: number): boolean {
    return (Date.now() - timestamp) < this.CACHE_TTL;
  }

  private transformApiItem(item: ApiResourceItem, type: string): Resource {
    const baseResource: Resource = {
      id: typeof item.id === 'string' ? parseInt(item.id) || Math.floor(Math.random() * 10000) + 1000 : item.id as any,
      originalId: item.originalId || item.id,
      title: item.titulo || item.title || item.podcast_titulo || 'Título não disponível',
      author: item.autor || item.canal || 'Link Business School',
      year: item.ano || item.year || new Date().getFullYear(),
      description: item.descricao || item.description || 'Descrição não disponível',
      subject: this.getSubjectFromCategories(item.categorias || item.categories) || this.getSubject(type),
      type: type === 'livro' ? 'titulo' : type === 'aula' ? 'video' : 'podcast' as 'titulo' | 'video' | 'podcast',
      thumbnail: item.imagem_url || item.thumbnail || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png'
    };

    if (type === 'livro') {
      baseResource.pdfUrl = item.arquivo;
      baseResource.pages = item.paginas || item.pages;
      baseResource.language = item.language;
      baseResource.documentType = item.tipo_documento || 'Livro';
    } else if (type === 'aula') {
      baseResource.embedUrl = item.embed_url;
      baseResource.duration = item.duracao_ms ? this.formatDuration(item.duracao_ms) : item.duration;
      baseResource.channel = item.canal || 'Canal desconhecido';
    } else if (type === 'podcast') {
      baseResource.duration = item.duracao_ms ? this.formatDuration(item.duracao_ms) : item.duration;
      baseResource.embedUrl = item.embed_url;
      baseResource.program = item.podcast_titulo || 'Programa desconhecido';
    }

    return baseResource;
  }

  private getSubjectFromCategories(categorias: string[] | undefined): string {
    if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
      return '';
    }
    return categorias[0];
  }

  private getSubject(tipo: string): string {
    switch (tipo) {
      case 'livro': return 'Administração';
      case 'aula': return 'Empreendedorismo';
      case 'podcast': return 'Negócios';
      default: return 'Geral';
    }
  }

  private formatDuration(durationMs: number): string {
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  private async fetchFromApi(contentType: string, targetId: string): Promise<ApiResourceItem[]> {
    const url = `${ResourceByIdService.API_BASE_URL}/conteudo-lbs?tipo=${contentType}&page=1&limit=100`;
    
    console.log(`🔍 Buscando ${contentType} na API para ID ${targetId}`);
    
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout ${contentType}`)), ResourceByIdService.TIMEOUT_MS);
      });
      
      const fetchPromise = fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'LSB-Resource-Search/1.0'
        }
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} para ${contentType}`);
      }

      const data = await response.json();
      return data.conteudo || [];
      
    } catch (error) {
      console.error(`❌ Erro API ${contentType}:`, error);
      return [];
    }
  }

  private findResourceInItems(items: ApiResourceItem[], targetId: string, type: string): Resource | null {
    // Busca por ID direto
    let found = items.find(item => 
      String(item.id) === targetId || 
      String(item.originalId) === targetId
    );

    if (found) {
      console.log(`✅ Recurso encontrado por ID direto: ${found.titulo || found.title}`);
      return this.transformApiItem(found, type);
    }

    // Busca numérica aproximada
    const numericId = parseInt(targetId);
    if (!isNaN(numericId)) {
      const closest = items
        .map(item => ({
          item,
          distance: Math.abs((parseInt(String(item.id)) || 0) - numericId)
        }))
        .sort((a, b) => a.distance - b.distance)
        .filter(x => x.distance < 1000)[0];

      if (closest) {
        console.log(`📍 Recurso encontrado por proximidade numérica: ${closest.item.titulo || closest.item.title}`);
        return this.transformApiItem(closest.item, type);
      }
    }

    return null;
  }

  private async findSuggestions(targetId: string): Promise<Resource[]> {
    const suggestions: Resource[] = [];
    const numericId = parseInt(targetId);

    try {
      const [podcastItems, videoItems, bookItems] = await Promise.allSettled([
        this.fetchFromApi('podcast', targetId),
        this.fetchFromApi('aula', targetId),
        this.fetchFromApi('livro', targetId)
      ]);

      // Coletar sugestões de cada tipo
      if (podcastItems.status === 'fulfilled') {
        const suggested = podcastItems.value
          .slice(0, 3)
          .map(item => this.transformApiItem(item, 'podcast'));
        suggestions.push(...suggested);
      }

      if (videoItems.status === 'fulfilled') {
        const suggested = videoItems.value
          .slice(0, 2)
          .map(item => this.transformApiItem(item, 'aula'));
        suggestions.push(...suggested);
      }

      if (bookItems.status === 'fulfilled') {
        const suggested = bookItems.value
          .slice(0, 2)
          .map(item => this.transformApiItem(item, 'livro'));
        suggestions.push(...suggested);
      }

    } catch (error) {
      console.error('❌ Erro ao buscar sugestões:', error);
    }

    return suggestions.slice(0, 5); // Máximo 5 sugestões
  }

  async findResourceById(id: string): Promise<ResourceByIdResponse> {
    const requestId = `resource_${id}_${Date.now()}`;
    console.group(`🔍 ${requestId} - Busca por ID: ${id}`);

    try {
      // 1. Verificar cache local
      const cacheKey = this.getCacheKey(id);
      const cached = this.cache.get(cacheKey);
      
      if (cached && this.isValidCache(cached.timestamp)) {
        console.log(`📦 Cache HIT: ${id}`);
        console.groupEnd();
        return {
          success: true,
          resource: cached.resource,
          suggestions: []
        };
      }

      // 2. Buscar na API em todos os tipos
      console.log(`🌐 Buscando ID ${id} na API...`);
      
      const [podcastItems, videoItems, bookItems] = await Promise.allSettled([
        this.fetchFromApi('podcast', id),
        this.fetchFromApi('aula', id),
        this.fetchFromApi('livro', id)
      ]);

      // 3. Procurar recurso em cada tipo
      let foundResource: Resource | null = null;

      if (podcastItems.status === 'fulfilled') {
        foundResource = this.findResourceInItems(podcastItems.value, id, 'podcast');
      }

      if (!foundResource && videoItems.status === 'fulfilled') {
        foundResource = this.findResourceInItems(videoItems.value, id, 'aula');
      }

      if (!foundResource && bookItems.status === 'fulfilled') {
        foundResource = this.findResourceInItems(bookItems.value, id, 'livro');
      }

      if (foundResource) {
        // 4. Cachear resultado encontrado
        this.cache.set(cacheKey, {
          resource: foundResource,
          timestamp: Date.now()
        });

        console.log(`✅ Recurso encontrado e cacheado: ${foundResource.title}`);
        console.groupEnd();
        
        return {
          success: true,
          resource: foundResource,
          suggestions: []
        };
      }

      // 5. Não encontrado - buscar sugestões
      console.log(`❌ Recurso não encontrado. Buscando sugestões...`);
      const suggestions = await this.findSuggestions(id);

      console.log(`💡 ${suggestions.length} sugestões encontradas`);
      console.groupEnd();

      return {
        success: false,
        resource: null,
        suggestions,
        error: `Recurso com ID ${id} não encontrado`
      };

    } catch (error) {
      console.error(`❌ Erro na busca por ID ${id}:`, error);
      console.groupEnd();

      return {
        success: false,
        resource: null,
        suggestions: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Cache de recursos limpo');
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const resourceByIdService = new ResourceByIdService();
