
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
          const transformed = this.transformItem(item, 'podcast', idCounter++);
          if (transformed) results.push(transformed);
        } catch (error) {
          console.warn('Error transforming podcast item:', error, item);
        }
      });
    }

    // Process videos
    if (data.conteudo.videos && Array.isArray(data.conteudo.videos)) {
      console.log('Processing videos:', data.conteudo.videos.length);
      data.conteudo.videos.forEach((item: any) => {
        try {
          const transformed = this.transformItem(item, 'video', idCounter++);
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
          const transformed = this.transformItem(item, 'titulo', idCounter++);
          if (transformed) results.push(transformed);
        } catch (error) {
          console.warn('Error transforming livro item:', error, item);
        }
      });
    }

    console.log('Total transformed results:', results.length);
    return results;
  }

  private transformItem(item: any, type: 'video' | 'titulo' | 'podcast', id: number): SearchResult | null {
    if (!item) return null;

    try {
      // Extract basic fields with fallbacks
      const title = item.titulo || item.title || 'Título não informado';
      const description = item.descricao || item.description || 'Descrição não disponível';
      const author = item.publicador || item.autor || item.author || 'Autor não informado';
      
      // Handle different duration formats
      let duration: string | undefined;
      if (type === 'podcast' && item.total_episodes) {
        duration = `${item.total_episodes} episódios`;
      } else if (item.duracao) {
        duration = item.duracao;
      } else if (item.duration) {
        duration = item.duration;
      }

      // Handle pages for books
      const pages = item.paginas || item.pages;

      // Handle thumbnail/image
      const thumbnail = item.imagem_url || item.thumbnail || item.imagem;

      // Extract year from various possible fields
      let year = 2023; // default
      if (item.ano) {
        year = parseInt(item.ano);
      } else if (item.year) {
        year = parseInt(item.year);
      } else if (item.data_publicacao) {
        // Try to extract year from date string
        const yearMatch = item.data_publicacao.match(/\d{4}/);
        if (yearMatch) {
          year = parseInt(yearMatch[0]);
        }
      }

      // Handle subject/category
      let subject = 'Geral';
      if (item.categorias && Array.isArray(item.categorias) && item.categorias.length > 0) {
        subject = item.categorias[0];
      } else if (item.assunto) {
        subject = item.assunto;
      } else if (item.subject) {
        subject = item.subject;
      }

      const result: SearchResult = {
        id,
        title,
        type,
        author,
        description,
        year,
        subject,
        ...(duration && { duration }),
        ...(pages && { pages }),
        ...(thumbnail && { thumbnail })
      };

      return result;
    } catch (error) {
      console.error('Error in transformItem:', error, item);
      return null;
    }
  }

  private getFallbackData(): SearchResult[] {
    // Minimal fallback data
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
        title: 'Podcast Mãos que Falam',
        type: 'podcast',
        author: 'Ana Costa',
        duration: '45:20',
        description: 'Conversas sobre inclusão e acessibilidade.',
        year: 2023,
        subject: 'Inclusão'
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
