
import { SearchResult } from '@/types/searchTypes';

export class DataService {
  private static instance: DataService;
  private cachedData: SearchResult[] | null = null;
  private loadingPromise: Promise<SearchResult[]> | null = null;

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  async loadData(): Promise<SearchResult[]> {
    // Return cached data if available
    if (this.cachedData) {
      return this.cachedData;
    }

    // Return existing loading promise if already loading
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Start loading data
    this.loadingPromise = this.fetchData();
    
    try {
      this.cachedData = await this.loadingPromise;
      return this.cachedData;
    } catch (error) {
      this.loadingPromise = null;
      throw error;
    }
  }

  private async fetchData(): Promise<SearchResult[]> {
    try {
      const response = await fetch('/lsb-data.json');
      
      if (!response.ok) {
        console.warn('JSON file not found, using fallback mock data');
        return this.getFallbackData();
      }

      const data = await response.json();
      
      // Validate and transform data
      return this.validateAndTransformData(data);
    } catch (error) {
      console.error('Error loading data:', error);
      console.warn('Using fallback mock data');
      return this.getFallbackData();
    }
  }

  private validateAndTransformData(data: any): SearchResult[] {
    console.log('Raw data structure:', data);
    
    if (!data || !data.conteudo) {
      console.error('Invalid data structure - missing conteudo property');
      return this.getFallbackData();
    }

    const results: SearchResult[] = [];
    let idCounter = 1;

    // Process podcasts
    if (data.conteudo.podcasts && Array.isArray(data.conteudo.podcasts)) {
      console.log('Processing podcasts:', data.conteudo.podcasts.length);
      data.conteudo.podcasts.forEach((item: any) => {
        try {
          const transformed = this.transformPodcast(item, idCounter++);
          if (transformed) results.push(transformed);
        } catch (error) {
          console.warn('Error transforming podcast item:', error, item);
        }
      });
    }

    // Process aulas (videos) - corrected from 'videos' to 'aulas'
    if (data.conteudo.aulas && Array.isArray(data.conteudo.aulas)) {
      console.log('Processing aulas (videos):', data.conteudo.aulas.length);
      data.conteudo.aulas.forEach((item: any) => {
        try {
          const transformed = this.transformVideo(item, idCounter++);
          if (transformed) results.push(transformed);
        } catch (error) {
          console.warn('Error transforming video item:', error, item);
        }
      });
    }

    // Process livros (books)
    if (data.conteudo.livros && Array.isArray(data.conteudo.livros)) {
      console.log('Processing livros:', data.conteudo.livros.length);
      data.conteudo.livros.forEach((item: any) => {
        try {
          const transformed = this.transformBook(item, idCounter++);
          if (transformed) results.push(transformed);
        } catch (error) {
          console.warn('Error transforming livro item:', error, item);
        }
      });
    }

    console.log('Total transformed results:', results.length);
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
        duration: item.total_episodes ? `${item.total_episodes} episódios` : undefined
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
        thumbnail: item.thumbnail
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

      const result: SearchResult = {
        id,
        title,
        type: 'titulo',
        author,
        description,
        year,
        subject,
        pages: item.paginas
      };

      return result;
    } catch (error) {
      console.error('Error in transformBook:', error, item);
      return null;
    }
  }

  private getFallbackData(): SearchResult[] {
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
        subject: 'Educação'
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
    this.cachedData = null;
    this.loadingPromise = null;
  }
}

export const dataService = DataService.getInstance();
