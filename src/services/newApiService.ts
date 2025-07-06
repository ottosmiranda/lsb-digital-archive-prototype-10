
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

  private constructor() {}

  static getInstance(): NewApiService {
    if (!NewApiService.instance) {
      NewApiService.instance = new NewApiService();
    }
    return NewApiService.instance;
  }

  private getCacheKey(tipo: string, page: number, limit: number): string {
    return `${tipo}_${page}_${limit}`;
  }

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    const isValid = (now - cached.timestamp) < cached.ttl;
    console.log(`📦 Cache check for ${cacheKey}: ${isValid ? 'VALID' : 'EXPIRED'}`);
    return isValid;
  }

  private setCache(cacheKey: string, data: any, ttl: number = 15 * 60 * 1000): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
    console.log(`📦 Cache SET: ${cacheKey} with ${data.length} items`);
  }

  private transformToSearchResult(item: any, tipo: string): SearchResult {
    console.log(`🔄 Transforming item for type ${tipo}:`, item);
    
    const baseResult: SearchResult = {
      id: Math.random(), // Use random ID for display since we need numbers
      originalId: item.id, // Keep the original UUID
      title: item.titulo || item.podcast_titulo || item.title || 'Título não disponível',
      author: item.autor || item.canal || 'Link Business School',
      year: item.ano || new Date().getFullYear(),
      description: item.descricao || 'Descrição não disponível',
      subject: this.getSubjectFromCategories(item.categorias) || this.getSubject(tipo),
      type: tipo === 'livro' ? 'titulo' : tipo === 'aula' ? 'video' : 'podcast' as 'titulo' | 'video' | 'podcast',
      thumbnail: item.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png'
    };

    // Add type-specific fields based on actual API response
    if (tipo === 'livro') {
      baseResult.pdfUrl = item.arquivo; // API uses 'arquivo' field for PDF URL
      baseResult.pages = item.paginas; // API uses 'paginas' field
      baseResult.language = item.language;
      baseResult.documentType = item.tipo_documento || 'Livro';
    } else if (tipo === 'aula') {
      baseResult.embedUrl = item.embed_url;
      baseResult.duration = item.duracao_ms ? this.formatDuration(item.duracao_ms) : undefined;
    } else if (tipo === 'podcast') {
      baseResult.duration = item.duracao_ms ? this.formatDuration(item.duracao_ms) : undefined;
      baseResult.embedUrl = item.embed_url;
    }

    console.log(`✅ Transformed result for ${tipo}:`, baseResult);
    return baseResult;
  }

  private getSubjectFromCategories(categorias: string[]): string {
    if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
      return '';
    }
    return categorias[0]; // Use the first category as subject
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
    const requestId = `${Date.now()}_${Math.random()}`;
    
    console.log(`🚀 [${requestId}] Starting fetchContent for ${tipo} (page: ${page}, limit: ${limit})`);
    
    // Check cache first
    if (this.isValidCache(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      console.log(`📦 [${requestId}] Cache HIT: ${cacheKey} with ${cached!.data.length} items`);
      return cached!.data;
    }

    // Check if there's already an active request for this same data
    if (this.activeRequests.has(cacheKey)) {
      console.log(`⏳ [${requestId}] Request already in progress for ${cacheKey}, waiting...`);
      return await this.activeRequests.get(cacheKey)!;
    }

    const requestPromise = this.performFetch(tipo, page, limit, requestId);
    this.activeRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.activeRequests.delete(cacheKey);
    }
  }

  private async performFetch(tipo: string, page: number, limit: number, requestId: string): Promise<SearchResult[]> {
    const cacheKey = this.getCacheKey(tipo, page, limit);
    const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${page}&limit=${limit}`;
    
    console.log(`🌐 [${requestId}] Fetching ${tipo} from API: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`⏰ [${requestId}] Request timeout for ${tipo}`);
      controller.abort();
    }, 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log(`📊 [${requestId}] API Response Status: ${response.status} for ${tipo}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [${requestId}] API Error for ${tipo}:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`API responded with status: ${response.status} - ${response.statusText}`);
      }

      const rawData: APIResponse = await response.json();
      console.log(`📊 [${requestId}] Raw API Response for ${tipo}:`, {
        tipo: rawData.tipo,
        total: rawData.total,
        page: rawData.page,
        itemCount: rawData.conteudo?.length || 0,
        firstItem: rawData.conteudo?.[0]
      });
      
      // Extract content array from the response
      const dataArray = rawData.conteudo || [];
      
      if (dataArray.length === 0) {
        console.warn(`⚠️ [${requestId}] No content found for ${tipo}`);
        return [];
      }
      
      console.log(`✅ [${requestId}] Found ${dataArray.length} items of type ${tipo}`);
      
      // Transform raw API data to SearchResult format
      const transformedData = dataArray.map((item: any) => this.transformToSearchResult(item, tipo));
      
      // Cache the results
      this.setCache(cacheKey, transformedData);
      
      console.log(`✅ [${requestId}] Successfully fetched and transformed ${transformedData.length} ${tipo} items`);
      return transformedData;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error(`❌ [${requestId}] Request aborted (timeout) for ${tipo}`);
        } else {
          console.error(`❌ [${requestId}] Network error for ${tipo}:`, {
            message: error.message,
            stack: error.stack,
            url
          });
        }
      } else {
        console.error(`❌ [${requestId}] Unknown error for ${tipo}:`, error);
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
    console.log(`🏠 [${requestId}] Starting homepage content fetch...`);
    
    try {
      // Fetch content sequentially to avoid overwhelming the API
      console.log(`📚 [${requestId}] Fetching books...`);
      const books = await this.fetchContent('livro', 1, 6);
      
      console.log(`🎥 [${requestId}] Fetching videos...`);
      const videos = await this.fetchContent('aula', 1, 6);
      
      console.log(`🎧 [${requestId}] Fetching podcasts...`);
      const podcasts = await this.fetchContent('podcast', 1, 6);

      const result = { videos, books, podcasts };

      console.log(`✅ [${requestId}] Homepage content loaded successfully:`, {
        videos: result.videos.length,
        books: result.books.length,
        podcasts: result.podcasts.length,
        total: result.videos.length + result.books.length + result.podcasts.length
      });

      return result;
      
    } catch (error) {
      console.error(`❌ [${requestId}] Failed to fetch homepage content:`, error);
      throw error;
    }
  }

  clearCache(): void {
    console.log('🧹 Clearing new API cache...');
    this.cache.clear();
    this.activeRequests.clear();
  }
}

export const newApiService = NewApiService.getInstance();
