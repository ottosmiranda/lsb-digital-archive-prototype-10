
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
    return (now - cached.timestamp) < cached.ttl;
  }

  private setCache(cacheKey: string, data: any, ttl: number = 15 * 60 * 1000): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private transformToSearchResult(item: any, tipo: string): SearchResult {
    const baseResult: SearchResult = {
      id: parseInt(item.id?.replace(/[^0-9]/g, '') || Math.random().toString().substr(2, 8)),
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
    
    // Check cache first
    if (this.isValidCache(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      console.log(`📦 Cache HIT: ${cacheKey} with ${cached!.data.length} items`);
      return cached!.data;
    }

    console.log(`🌐 Fetching ${tipo} from new API (page: ${page}, limit: ${limit})`);
    
    try {
      const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${page}&limit=${limit}`;
      console.log(`📡 API URL: ${url}`);
      
      const response = await fetch(url);
      
      console.log(`📊 API Response Status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const rawData: APIResponse = await response.json();
      console.log(`📊 Raw API Response for ${tipo}:`, rawData);
      
      // Extract content array from the response
      const dataArray = rawData.conteudo || [];
      console.log(`✅ Found ${dataArray.length} items of type ${tipo}`);
      
      // Transform raw API data to SearchResult format
      const transformedData = dataArray.map((item: any) => this.transformToSearchResult(item, tipo));
      
      // Cache the results
      this.setCache(cacheKey, transformedData);
      
      console.log(`✅ Fetched and transformed ${transformedData.length} ${tipo} items from new API`);
      return transformedData;
      
    } catch (error) {
      console.error(`❌ Failed to fetch ${tipo} from new API:`, error);
      console.error(`❌ Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async fetchHomepageContent(): Promise<{
    videos: SearchResult[];
    books: SearchResult[];
    podcasts: SearchResult[];
  }> {
    console.log('🏠 Fetching homepage content from new API...');
    
    try {
      // Fetch small amounts in parallel for homepage
      const [videosResult, booksResult, podcastsResult] = await Promise.allSettled([
        this.fetchContent('aula', 1, 6),
        this.fetchContent('livro', 1, 6), 
        this.fetchContent('podcast', 1, 6)
      ]);

      const result = {
        videos: videosResult.status === 'fulfilled' ? videosResult.value : [],
        books: booksResult.status === 'fulfilled' ? booksResult.value : [],
        podcasts: podcastsResult.status === 'fulfilled' ? podcastsResult.value : []
      };

      // Log any failures
      if (videosResult.status === 'rejected') {
        console.error('❌ Failed to fetch videos:', videosResult.reason);
      }
      if (booksResult.status === 'rejected') {
        console.error('❌ Failed to fetch books:', booksResult.reason);
      }
      if (podcastsResult.status === 'rejected') {
        console.error('❌ Failed to fetch podcasts:', podcastsResult.reason);
      }

      console.log('✅ Homepage content loaded:', {
        videos: result.videos.length,
        books: result.books.length,
        podcasts: result.podcasts.length
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to fetch homepage content:', error);
      throw error;
    }
  }

  clearCache(): void {
    console.log('🧹 Clearing new API cache...');
    this.cache.clear();
  }
}

export const newApiService = NewApiService.getInstance();
