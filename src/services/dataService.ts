
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

  private validateAndTransformData(data: any[]): SearchResult[] {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    return data.map((item, index) => {
      // Transform your JSON structure to match SearchResult interface
      return {
        id: item.id || index + 1,
        title: item.title || item.nome || 'Título não informado',
        type: this.normalizeType(item.type || item.tipo || 'titulo'),
        author: item.author || item.autor || 'Autor não informado',
        duration: item.duration || item.duracao,
        pages: item.pages || item.paginas,
        thumbnail: item.thumbnail || item.imagem,
        description: item.description || item.descricao || 'Descrição não disponível',
        year: parseInt(item.year || item.ano || '2023'),
        subject: item.subject || item.assunto || 'Geral'
      };
    });
  }

  private normalizeType(type: string): 'video' | 'titulo' | 'podcast' {
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('video') || normalizedType.includes('vídeo')) {
      return 'video';
    }
    if (normalizedType.includes('podcast') || normalizedType.includes('áudio')) {
      return 'podcast';
    }
    return 'titulo';
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
