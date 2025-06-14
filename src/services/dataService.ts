
import { SearchResult } from '@/types/searchTypes';

export class DataService {
  private static instance: DataService;
  private cachedData: SearchResult[] | null = null;
  private loadingPromise: Promise<SearchResult[]> | null = null;
  private lastLoadTime: number = 0;
  private maxCacheAge: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  async loadData(forceRefresh: boolean = false): Promise<SearchResult[]> {
    console.log('🔄 DataService.loadData called with forceRefresh:', forceRefresh);
    
    // Check if we should force refresh or if cache is stale
    const now = Date.now();
    const cacheIsStale = (now - this.lastLoadTime) > this.maxCacheAge;
    
    if (forceRefresh || cacheIsStale) {
      console.log('🔄 Force refreshing data cache...');
      this.clearCache();
    }

    // Return cached data if available and not forcing refresh
    if (this.cachedData && !forceRefresh && !cacheIsStale) {
      console.log('✅ Returning cached data, length:', this.cachedData.length);
      return this.cachedData;
    }

    // Return existing loading promise if already loading
    if (this.loadingPromise) {
      console.log('⏳ Returning existing loading promise');
      return this.loadingPromise;
    }

    // Start loading data
    console.log('🚀 Starting fresh data load...');
    this.loadingPromise = this.fetchData();
    
    try {
      this.cachedData = await this.loadingPromise;
      this.lastLoadTime = Date.now();
      console.log('✅ Data loaded successfully, total items:', this.cachedData.length);
      
      // Check if we're still getting fallback data after refresh
      const usingFallback = this.cachedData.length === 3 && this.cachedData.some(item => item.title === 'Introdução à Libras');
      if (usingFallback && forceRefresh) {
        console.error('❌ Still getting fallback data even after force refresh!');
      }
      
      return this.cachedData;
    } catch (error) {
      console.error('❌ Failed to load data, clearing loading promise:', error);
      this.loadingPromise = null;
      throw error;
    }
  }

  private async fetchData(): Promise<SearchResult[]> {
    try {
      console.log('📡 Fetching /lsb-data.json...');
      
      // Add cache-busting timestamp and random parameter
      const timestamp = new Date().getTime();
      const random = Math.random().toString(36).substring(7);
      const url = `/lsb-data.json?t=${timestamp}&r=${random}`;
      console.log('🌐 Fetching URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.warn(`❌ JSON file request failed with status ${response.status}, using fallback mock data`);
        return this.getFallbackData();
      }

      console.log('📖 Response OK, parsing JSON...');
      const rawText = await response.text();
      console.log('📏 Raw response length:', rawText.length);
      console.log('👀 Raw response preview (first 200 chars):', rawText.substring(0, 200));
      
      let data;
      try {
        data = JSON.parse(rawText);
        console.log('✅ JSON parsed successfully');
        console.log('🔑 Parsed data keys:', Object.keys(data));
        console.log('📊 Total items reported:', data.totalItens);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.warn('⚠️ JSON parsing failed, using fallback mock data');
        return this.getFallbackData();
      }
      
      // Validate and transform data
      console.log('🔄 Validating and transforming data...');
      const transformedData = this.validateAndTransformData(data);
      console.log('✅ Data transformation complete, final count:', transformedData.length);
      
      if (transformedData.length > 3) {
        console.log('🎉 Successfully loaded real data with', transformedData.length, 'items!');
      } else {
        console.warn('⚠️ Only got', transformedData.length, 'items - this might still be fallback data');
      }
      
      return transformedData;
    } catch (error) {
      console.error('❌ Error in fetchData:', error);
      console.warn('⚠️ Fetch failed, using fallback mock data');
      return this.getFallbackData();
    }
  }

  private validateAndTransformData(data: any): SearchResult[] {
    console.log('Raw data structure:', data);
    console.log('Data type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    
    if (!data) {
      console.error('Data is null or undefined');
      return this.getFallbackData();
    }

    if (!data.conteudo) {
      console.error('Invalid data structure - missing conteudo property');
      console.log('Available top-level keys:', Object.keys(data));
      return this.getFallbackData();
    }

    console.log('Conteudo keys:', Object.keys(data.conteudo));
    const results: SearchResult[] = [];
    let idCounter = 1;

    // Process podcasts
    if (data.conteudo.podcasts && Array.isArray(data.conteudo.podcasts)) {
      console.log('Processing podcasts, count:', data.conteudo.podcasts.length);
      data.conteudo.podcasts.forEach((item: any, index: number) => {
        try {
          const transformed = this.transformPodcast(item, idCounter++);
          if (transformed) {
            results.push(transformed);
            console.log(`Podcast ${index + 1} transformed:`, transformed.title);
          }
        } catch (error) {
          console.warn(`Error transforming podcast item ${index}:`, error, item);
        }
      });
    } else {
      console.log('No podcasts found or not an array');
    }

    // Process aulas (videos)
    if (data.conteudo.aulas && Array.isArray(data.conteudo.aulas)) {
      console.log('Processing aulas (videos), count:', data.conteudo.aulas.length);
      data.conteudo.aulas.forEach((item: any, index: number) => {
        try {
          const transformed = this.transformVideo(item, idCounter++);
          if (transformed) {
            results.push(transformed);
            console.log(`Video ${index + 1} transformed:`, transformed.title);
          }
        } catch (error) {
          console.warn(`Error transforming video item ${index}:`, error, item);
        }
      });
    } else {
      console.log('No aulas found or not an array');
    }

    // Process livros (books)
    if (data.conteudo.livros && Array.isArray(data.conteudo.livros)) {
      console.log('Processing livros, count:', data.conteudo.livros.length);
      data.conteudo.livros.forEach((item: any, index: number) => {
        try {
          const transformed = this.transformBook(item, idCounter++);
          if (transformed) {
            results.push(transformed);
            console.log(`Book ${index + 1} transformed:`, transformed.title);
          }
        } catch (error) {
          console.warn(`Error transforming livro item ${index}:`, error, item);
        }
      });
    } else {
      console.log('No livros found or not an array');
    }

    console.log('Total transformed results:', results.length);
    
    if (results.length === 0) {
      console.warn('No items were successfully transformed, using fallback data');
      return this.getFallbackData();
    }
    
    return results;
  }

  private transformPodcast(item: any, id: number): SearchResult | null {
    if (!item) return null;

    try {
      const title = item.titulo || 'Podcast sem título';
      const description = item.descricao || 'Descrição não disponível';
      const author = item.publicador || 'Autor não informado';
      const year = item.ano ? parseInt(item.ano) : 2023;
      
      // Handle categories
      let subject = 'Podcast';
      if (item.categorias && Array.isArray(item.categorias) && item.categorias.length > 0) {
        subject = item.categorias[0];
      }

      const result: SearchResult = {
        id,
        title,
        type: 'podcast',
        author,
        description,
        year,
        subject,
        duration: item.total_episodes ? `${item.total_episodes} episódios` : undefined,
        thumbnail: item.imagem_url
      };

      return result;
    } catch (error) {
      console.error('Error in transformPodcast:', error, item);
      return null;
    }
  }

  private transformVideo(item: any, id: number): SearchResult | null {
    if (!item) return null;

    try {
      const title = item.titulo || 'Vídeo sem título';
      const description = item.descricao || 'Descrição não disponível';
      const author = item.canal || item.publicador || 'Canal não informado';
      const year = item.ano ? parseInt(item.ano) : 2023;
      
      // Handle categories
      let subject = 'Educação';
      if (item.categorias && Array.isArray(item.categorias) && item.categorias.length > 0) {
        subject = item.categorias[0];
      }

      // Handle duration - use provided duration or extract from YouTube if available
      let duration: string | undefined;
      if (item.duracao) {
        duration = item.duracao;
      } else if (item.url && item.url.includes('youtube.com')) {
        // For YouTube videos without duration, we'll set a default
        duration = 'N/A';
      }

      const result: SearchResult = {
        id,
        title,
        type: 'video',
        author,
        description,
        year,
        subject,
        duration,
        thumbnail: item.imagem_url
      };

      return result;
    } catch (error) {
      console.error('Error in transformVideo:', error, item);
      return null;
    }
  }

  private transformBook(item: any, id: number): SearchResult | null {
    if (!item) return null;

    try {
      // Handle incomplete book data
      let title = item.titulo || item.title;
      
      // If no title, try to extract from filename/path
      if (!title && item.arquivo) {
        const filename = item.arquivo.split('/').pop() || '';
        title = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      }
      
      if (!title) {
        title = 'Livro sem título';
      }

      const description = item.descricao || item.description || 'Livro em formato PDF disponível para download';
      const author = item.autor || item.publicador || 'Autor não informado';
      const year = item.ano ? parseInt(item.ano) : 2023;
      
      // Handle categories
      let subject = 'Literatura';
      if (item.categorias && Array.isArray(item.categorias) && item.categorias.length > 0) {
        subject = item.categorias[0];
      } else if (item.assunto) {
        subject = item.assunto;
      }

      // Extract document type from the new field
      const documentType = item.tipo_documento || 'Livro';

      const result: SearchResult = {
        id,
        title,
        type: 'titulo',
        author,
        description,
        year,
        subject,
        pages: item.paginas,
        thumbnail: item.imagem_url,
        documentType
      };

      return result;
    } catch (error) {
      console.error('Error in transformBook:', error, item);
      return null;
    }
  }

  private getFallbackData(): SearchResult[] {
    console.warn('🚨 USING FALLBACK MOCK DATA - Real JSON data failed to load');
    
    // Minimal fallback data with Portuguese content
    return [
      {
        id: 1,
        title: 'Introdução à Libras',
        type: 'video',
        author: 'Prof. Maria Silva',
        duration: '25:30',
        description: 'Curso básico de Língua Brasileira de Sinais para iniciantes.',
        year: 2023,
        subject: 'Educação'
      },
      {
        id: 2,
        title: 'Manual Completo de Libras',
        type: 'titulo',
        author: 'Prof. Eduardo Mendes',
        pages: 420,
        description: 'Guia completo para aprendizado da Língua Brasileira de Sinais.',
        year: 2023,
        subject: 'Educação',
        documentType: 'Livro'
      },
      {
        id: 3,
        title: 'Técnicas de Negociação',
        type: 'video',
        author: 'Instituto de Comunicação',
        duration: '45:20',
        description: 'Aprenda técnicas avançadas de negociação e comunicação.',
        year: 2023,
        subject: 'Negócios'
      }
    ];
  }

  // Clear cache method for manual refresh
  clearCache(): void {
    console.log('🧹 Clearing DataService cache...');
    this.cachedData = null;
    this.loadingPromise = null;
    this.lastLoadTime = 0;
  }

  // Force refresh method
  async forceRefresh(): Promise<SearchResult[]> {
    console.log('🔄 Force refreshing data...');
    return this.loadData(true);
  }

  // Check if using fallback data
  isUsingFallbackData(): boolean {
    if (!this.cachedData) return false;
    return this.cachedData.length === 3 && this.cachedData.some(item => item.title === 'Introdução à Libras');
  }
}

export const dataService = DataService.getInstance();
