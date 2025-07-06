
import { SearchResult } from '@/types/searchTypes';

const API_BASE_URL = 'https://link-business-school.onrender.com/api/v1';

interface APIResponse {
  tipo: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  conteudo: any[];
}

export class NewApiService {
  private static instance: NewApiService;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private activeRequests = new Map<string, Promise<SearchResult[]>>();

  private constructor() {
    console.log('🔧 NewApiService - Constructor called');
  }

  static getInstance(): NewApiService {
    if (!NewApiService.instance) {
      console.log('🆕 NewApiService - Creating new instance');
      NewApiService.instance = new NewApiService();
    }
    return NewApiService.instance;
  }

  private getCacheKey(tipo: string, page: number, limit: number): string {
    return `${tipo}_${page}_${limit}`;
  }

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      console.log(`📦 Cache MISS for ${cacheKey}`);
      return false;
    }
    
    const now = Date.now();
    const isValid = (now - cached.timestamp) < cached.ttl;
    console.log(`📦 Cache ${isValid ? 'HIT' : 'EXPIRED'} for ${cacheKey}:`, {
      age: Math.round((now - cached.timestamp) / 1000),
      ttl: Math.round(cached.ttl / 1000),
      itemCount: cached.data?.length || 0
    });
    return isValid;
  }

  private setCache(cacheKey: string, data: any, ttl: number = 15 * 60 * 1000): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
    console.log(`📦 Cache SET: ${cacheKey}`, {
      itemCount: data.length,
      ttlMinutes: Math.round(ttl / 60000)
    });
  }

  private transformToSearchResult(item: any, tipo: string): SearchResult {
    console.log(`🔄 Transforming item:`, {
      tipo,
      id: item.id,
      titulo: item.titulo || item.podcast_titulo || item.title
    });
    
    const baseResult: SearchResult = {
      id: Math.floor(Math.random() * 10000) + 1000, // Generate consistent random ID
      originalId: item.id,
      title: item.titulo || item.podcast_titulo || item.title || 'Título não disponível',
      author: item.autor || item.canal || 'Link Business School',
      year: item.ano || new Date().getFullYear(),
      description: item.descricao || 'Descrição não disponível',
      subject: this.getSubjectFromCategories(item.categorias) || this.getSubject(tipo),
      type: tipo === 'livro' ? 'titulo' : tipo === 'aula' ? 'video' : 'podcast' as 'titulo' | 'video' | 'podcast',
      thumbnail: item.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png'
    };

    // Add type-specific fields
    if (tipo === 'livro') {
      baseResult.pdfUrl = item.arquivo;
      baseResult.pages = item.paginas;
      baseResult.language = item.language;
      baseResult.documentType = item.tipo_documento || 'Livro';
    } else if (tipo === 'aula') {
      baseResult.embedUrl = item.embed_url;
      baseResult.duration = item.duracao_ms ? this.formatDuration(item.duracao_ms) : undefined;
    } else if (tipo === 'podcast') {
      baseResult.duration = item.duracao_ms ? this.formatDuration(item.duracao_ms) : undefined;
      baseResult.embedUrl = item.embed_url;
    }

    console.log(`✅ Transformed result:`, {
      id: baseResult.id,
      title: baseResult.title,
      type: baseResult.type
    });
    return baseResult;
  }

  private getSubjectFromCategories(categorias: string[]): string {
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

  async fetchContent(tipo: 'livro' | 'aula' | 'podcast', page: number = 1, limit: number = 10): Promise<SearchResult[]> {
    const cacheKey = this.getCacheKey(tipo, page, limit);
    const requestId = `${tipo}_${Date.now()}`;
    
    console.group(`🚀 ${requestId} - fetchContent`);
    console.log(`📊 Request details:`, { tipo, page, limit });
    console.log(`⏰ Started at:`, new Date().toISOString());
    
    // Check cache first
    if (this.isValidCache(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      console.log(`📦 Returning cached data (${cached!.data.length} items)`);
      console.groupEnd();
      return cached!.data;
    }

    // Check for active requests
    if (this.activeRequests.has(cacheKey)) {
      console.log(`⏳ Request already in progress, waiting...`);
      const result = await this.activeRequests.get(cacheKey)!;
      console.groupEnd();
      return result;
    }

    const requestPromise = this.performFetch(tipo, page, limit, requestId);
    this.activeRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      console.log(`✅ Request completed successfully (${result.length} items)`);
      console.groupEnd();
      return result;
    } catch (error) {
      console.error(`❌ Request failed:`, error);
      console.groupEnd();
      throw error;
    } finally {
      this.activeRequests.delete(cacheKey);
    }
  }

  private async performFetch(tipo: string, page: number, limit: number, requestId: string): Promise<SearchResult[]> {
    const cacheKey = this.getCacheKey(tipo, page, limit);
    const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${page}&limit=${limit}`;
    
    console.log(`🌐 ${requestId} - Making HTTP request to:`, url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`⏰ ${requestId} - Request timeout (15s)`);
      controller.abort();
    }, 15000); // 15 second timeout

    try {
      console.log(`📡 ${requestId} - Sending fetch request...`);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log(`📊 ${requestId} - Response received:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ${requestId} - HTTP Error:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 500) // Limit error body log
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`📄 ${requestId} - Parsing JSON response...`);
      const rawData: APIResponse = await response.json();
      
      console.log(`📊 ${requestId} - Parsed response:`, {
        tipo: rawData.tipo,
        total: rawData.total,
        page: rawData.page,
        limit: rawData.limit,
        contentLength: rawData.conteudo?.length || 0,
        hasContent: Boolean(rawData.conteudo),
        firstItemSample: rawData.conteudo?.[0] ? {
          id: rawData.conteudo[0].id,
          titulo: rawData.conteudo[0].titulo || rawData.conteudo[0].podcast_titulo || rawData.conteudo[0].title
        } : null
      });
      
      const dataArray = rawData.conteudo || [];
      
      if (dataArray.length === 0) {
        console.warn(`⚠️ ${requestId} - No content found in API response`);
        return [];
      }
      
      console.log(`🔄 ${requestId} - Transforming ${dataArray.length} items...`);
      const transformedData = dataArray.map((item: any) => this.transformToSearchResult(item, tipo));
      
      this.setCache(cacheKey, transformedData);
      
      console.log(`✅ ${requestId} - Transformation completed:`, {
        originalCount: dataArray.length,
        transformedCount: transformedData.length,
        sampleTransformed: transformedData[0] ? {
          id: transformedData[0].id,
          title: transformedData[0].title,
          type: transformedData[0].type
        } : null
      });
      
      return transformedData;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error(`❌ ${requestId} - Request aborted (timeout)`);
        } else {
          console.error(`❌ ${requestId} - Fetch error:`, {
            name: error.name,
            message: error.message,
            stack: error.stack?.substring(0, 500)
          });
        }
      } else {
        console.error(`❌ ${requestId} - Unknown error:`, error);
      }
      
      throw error;
    }
  }

  async fetchHomepageContent(): Promise<{
    videos: SearchResult[];
    books: SearchResult[];
    podcasts: SearchResult[];
  }> {
    const requestId = `homepage_${Date.now()}`;
    
    console.group(`🏠 ${requestId} - fetchHomepageContent`);
    console.log(`⏰ Started at:`, new Date().toISOString());
    
    try {
      // Use Promise.allSettled to handle partial failures gracefully
      console.log(`📡 ${requestId} - Starting parallel content fetch...`);
      
      const [booksResult, videosResult, podcastsResult] = await Promise.allSettled([
        this.fetchContent('livro', 1, 6),
        this.fetchContent('aula', 1, 6),
        this.fetchContent('podcast', 1, 6)
      ]);

      console.log(`📊 ${requestId} - Fetch results:`, {
        books: booksResult.status,
        videos: videosResult.status,
        podcasts: podcastsResult.status
      });

      const books = booksResult.status === 'fulfilled' ? booksResult.value : [];
      const videos = videosResult.status === 'fulfilled' ? videosResult.value : [];
      const podcasts = podcastsResult.status === 'fulfilled' ? podcastsResult.value : [];

      if (booksResult.status === 'rejected') {
        console.error(`❌ ${requestId} - Books fetch failed:`, booksResult.reason);
      }
      if (videosResult.status === 'rejected') {
        console.error(`❌ ${requestId} - Videos fetch failed:`, videosResult.reason);
      }
      if (podcastsResult.status === 'rejected') {
        console.error(`❌ ${requestId} - Podcasts fetch failed:`, podcastsResult.reason);
      }

      const result = { videos, books, podcasts };
      const totalItems = books.length + videos.length + podcasts.length;

      console.log(`✅ ${requestId} - Homepage content loaded:`, {
        books: books.length,
        videos: videos.length,
        podcasts: podcasts.length,
        total: totalItems,
        completedAt: new Date().toISOString()
      });

      // If no content was loaded at all, throw an error
      if (totalItems === 0) {
        throw new Error('No content could be loaded from any source');
      }

      console.groupEnd();
      return result;
      
    } catch (error) {
      console.error(`❌ ${requestId} - Homepage content fetch failed:`, error);
      console.groupEnd();
      throw error;
    }
  }

  clearCache(): void {
    console.log('🧹 Clearing API cache...');
    const cacheSize = this.cache.size;
    const activeRequests = this.activeRequests.size;
    
    this.cache.clear();
    this.activeRequests.clear();
    
    console.log(`✅ Cache cleared:`, {
      clearedEntries: cacheSize,
      cancelledRequests: activeRequests
    });
  }
}

export const newApiService = NewApiService.getInstance();
