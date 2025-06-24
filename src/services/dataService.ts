import { SearchResult } from '@/types/searchTypes';
import { supabase } from '@/integrations/supabase/client';

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
      console.log('📡 Starting hybrid data fetch (Videos API + Books API + Podcasts JSON)...');
      
      // Fetch videos from API
      const apiVideos = await this.fetchVideosFromAPI();
      console.log('🎬 API videos fetched:', apiVideos.length);

      // Fetch books from API
      const apiBooks = await this.fetchBooksFromAPI();
      console.log('📚 API books fetched:', apiBooks.length);

      // Fetch podcasts from JSON
      const jsonPodcasts = await this.fetchPodcastsFromJSON();
      console.log('🎧 JSON podcasts fetched:', jsonPodcasts.length);

      // Combine all data
      const allResults = [...apiVideos, ...apiBooks, ...jsonPodcasts];
      console.log('🔄 Combined data, total items:', allResults.length);

      return allResults;
    } catch (error) {
      console.error('❌ Error in fetchData:', error);
      console.warn('⚠️ Falling back to JSON-only data');
      return this.fetchJSONData();
    }
  }

  private async fetchVideosFromAPI(): Promise<SearchResult[]> {
    try {
      console.log('🎬 Fetching videos from API...');
      
      const { data, error } = await supabase.functions.invoke('fetch-videos');
      
      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      if (!data.success) {
        console.error('❌ API returned error:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ Videos from API:', data.count);
      return data.videos;
    } catch (error) {
      console.error('❌ Failed to fetch videos from API:', error);
      console.warn('⚠️ Falling back to mock video data');
      return this.getMockVideoData();
    }
  }

  private async fetchBooksFromAPI(): Promise<SearchResult[]> {
    try {
      console.log('📚 Fetching books from API...');
      
      const { data, error } = await supabase.functions.invoke('fetch-books');
      
      if (error) {
        console.error('❌ Books edge function error:', error);
        throw error;
      }

      if (!data.success) {
        console.error('❌ Books API returned error:', data.error);
        throw new Error(data.error);
      }

      console.log('✅ Books from API:', data.count);
      return data.books;
    } catch (error) {
      console.error('❌ Failed to fetch books from API:', error);
      console.warn('⚠️ Falling back to JSON books data');
      return this.getBooksFromJSON();
    }
  }

  private async fetchPodcastsFromJSON(): Promise<SearchResult[]> {
    try {
      console.log('🎧 Fetching podcasts from JSON...');
      
      // Add cache-busting timestamp and random parameter
      const timestamp = new Date().getTime();
      const random = Math.random().toString(36).substring(7);
      const url = `/lsb-data.json?t=${timestamp}&r=${random}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        console.warn(`❌ JSON file request failed with status ${response.status}, using fallback data`);
        return [];
      }

      const rawText = await response.text();
      const data = JSON.parse(rawText);
      
      if (!data || !data.conteudo || !data.conteudo.podcasts) {
        console.error('Invalid JSON data structure - missing podcasts');
        return [];
      }

      console.log('Processing podcasts from JSON, count:', data.conteudo.podcasts.length);
      const results: SearchResult[] = [];
      let idCounter = 2000; // Start from 2000 for podcasts

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

      console.log('Total podcasts transformed:', results.length);
      return results;
    } catch (error) {
      console.error('❌ Error in fetchPodcastsFromJSON:', error);
      return [];
    }
  }

  private async getBooksFromJSON(): Promise<SearchResult[]> {
    try {
      console.log('📚 Fetching books from JSON as fallback...');
      
      const timestamp = new Date().getTime();
      const random = Math.random().toString(36).substring(7);
      const url = `/lsb-data.json?t=${timestamp}&r=${random}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        console.warn(`❌ JSON file request failed, returning empty books array`);
        return [];
      }

      const rawText = await response.text();
      const data = JSON.parse(rawText);
      
      if (!data || !data.conteudo || !data.conteudo.livros) {
        console.error('Invalid JSON data structure - missing books');
        return [];
      }

      console.log('Processing books from JSON, count:', data.conteudo.livros.length);
      const results: SearchResult[] = [];
      let idCounter = 3000; // Start from 3000 for books from JSON

      data.conteudo.livros.forEach((item: any, index: number) => {
        try {
          const transformed = this.transformBook(item, idCounter++);
          if (transformed) {
            results.push(transformed);
            console.log(`Book ${index + 1} transformed:`, transformed.title);
          }
        } catch (error) {
          console.warn(`Error transforming book item ${index}:`, error, item);
        }
      });

      console.log('Total books from JSON transformed:', results.length);
      return results;
    } catch (error) {
      console.error('❌ Error in getBooksFromJSON:', error);
      return [];
    }
  }

  private async fetchJSONData(): Promise<SearchResult[]> {
    try {
      console.log('📡 Fetching JSON data...');
      
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
      
      if (!response.ok) {
        console.warn(`❌ JSON file request failed with status ${response.status}, using fallback mock data`);
        return this.getFallbackData();
      }

      console.log('📖 Response OK, parsing JSON...');
      const rawText = await response.text();
      console.log('📏 Raw response length:', rawText.length);
      
      let data;
      try {
        data = JSON.parse(rawText);
        console.log('✅ JSON parsed successfully');
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        return this.getFallbackData();
      }
      
      // Transform data (excluding videos since they come from API)
      console.log('🔄 Validating and transforming JSON data...');
      const transformedData = this.validateAndTransformJSONData(data);
      console.log('✅ JSON data transformation complete, final count:', transformedData.length);
      
      return transformedData;
    } catch (error) {
      console.error('❌ Error in fetchJSONData:', error);
      return this.getFallbackData();
    }
  }

  private validateAndTransformJSONData(data: any): SearchResult[] {
    console.log('Raw JSON data structure:', data);
    
    if (!data || !data.conteudo) {
      console.error('Invalid JSON data structure - missing conteudo property');
      return [];
    }

    console.log('JSON Conteudo keys:', Object.keys(data.conteudo));
    const results: SearchResult[] = [];
    let idCounter = 2000; // Start from 2000 to avoid conflicts with API videos

    // Process podcasts only (videos and books now come from API)
    if (data.conteudo.podcasts && Array.isArray(data.conteudo.podcasts)) {
      console.log('Processing podcasts from JSON, count:', data.conteudo.podcasts.length);
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
    }

    console.log('Total JSON results transformed:', results.length);
    return results;
  }

  private getMockVideoData(): SearchResult[] {
    console.log('🎭 Using mock video data as fallback');
    return [
      {
        id: 1001,
        title: 'Introdução aos Negócios Digitais',
        type: 'video',
        author: 'LSB Academy',
        duration: '25:30',
        description: 'Curso introdutório sobre negócios digitais e empreendedorismo.',
        year: 2024,
        subject: 'Negócios',
        thumbnail: '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png'
      },
      {
        id: 1002,
        title: 'Estratégias de Marketing Digital',
        type: 'video',
        author: 'LSB Marketing',
        duration: '32:15',
        description: 'Aprenda as melhores estratégias de marketing digital.',
        year: 2024,
        subject: 'Marketing',
        thumbnail: '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png'
      }
    ];
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
        episodes: item.total_episodes ? `${item.total_episodes} episódios` : undefined,
        thumbnail: item.imagem_url,
        embedUrl: item.embed_url
      };

      return result;
    } catch (error) {
      console.error('Error in transformPodcast:', error, item);
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
    console.warn('🚨 USING FALLBACK MOCK DATA - Real data failed to load');
    
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
