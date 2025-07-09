
import { Resource } from '@/types/resourceTypes';
import { API_BASE_URL } from './api/apiConfig';

export interface ApiResourceResponse {
  // Para livros
  id?: string;
  titulo?: string;
  autor?: string;
  language?: string;
  ano?: number;
  categorias?: string[];
  descricao?: string;
  paginas?: number;
  arquivo?: string;
  tipo_documento?: string;
  
  // Para vídeos/aulas
  tipo?: string;
  canal?: string;
  imagem_url?: string;
  idioma?: string;
  embed_url?: string;
  duracao?: number;
  
  // Para podcasts (array response)
  podcast_id?: string;
  podcast_titulo?: string;
  publicador?: string;
  episodio_id?: string;
  episodio_titulo?: string;
  data_lancamento?: string;
  duracao_ms?: number;
  url?: string;
}

export class ResourceByIdService {
  private static readonly TIMEOUT_MS = 8000;

  static async fetchResourceById(id: string, resourceType: string): Promise<Resource | null> {
    console.log(`🎯 Busca ESPECÍFICA: ${resourceType} com ID ${id}`);
    
    try {
      const endpoint = this.getEndpointForType(resourceType, id);
      console.log(`📡 Endpoint: ${endpoint}`);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout para ${resourceType} ID ${id}`)), this.TIMEOUT_MS);
      });
      
      const fetchPromise = fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        console.log(`❌ HTTP ${response.status} para ${resourceType} ID ${id}`);
        return null;
      }

      const data = await response.json();
      console.log(`✅ Dados recebidos para ${resourceType} ID ${id}`);
      
      const transformedResource = this.transformToResource(data, resourceType, id);
      console.log(`🔄 Recurso transformado:`, { id: transformedResource.id, type: transformedResource.type, title: transformedResource.title.substring(0, 50) + '...' });
      
      return transformedResource;
      
    } catch (error) {
      console.log(`❌ Erro ao buscar ${resourceType} ID ${id}:`, error);
      return null;
    }
  }

  private static getEndpointForType(resourceType: string, id: string): string {
    const baseUrl = `${API_BASE_URL}/conteudo-lbs`;
    
    switch (resourceType) {
      case 'video':
        return `${baseUrl}/aula/${id}`;
      case 'titulo':
        return `${baseUrl}/livro/${id}`;
      case 'podcast':
        return `${baseUrl}/podcast/${id}`;
      default:
        throw new Error(`Tipo de recurso não suportado: ${resourceType}`);
    }
  }

  private static transformToResource(data: any, resourceType: string, requestedId: string): Resource {
    console.log(`🔄 Transformando dados para Resource:`, { resourceType, data });

    // For podcasts, the response is an array
    if (resourceType === 'podcast' && Array.isArray(data)) {
      const podcast = data[0]; // Get the first episode
      return {
        id: podcast.episodio_id || requestedId, // Use real episode ID
        originalId: podcast.episodio_id || requestedId,
        title: podcast.episodio_titulo || podcast.podcast_titulo || 'Podcast sem título',
        author: podcast.publicador || 'Autor desconhecido',
        year: new Date(podcast.data_lancamento || Date.now()).getFullYear(),
        description: podcast.descricao || 'Descrição não disponível',
        subject: podcast.podcast_titulo || 'Podcast',
        type: 'podcast',
        thumbnail: podcast.imagem_url,
        duration: podcast.duracao_ms ? this.formatDuration(podcast.duracao_ms) : undefined,
        embedUrl: podcast.embed_url,
        categories: podcast.categorias || [podcast.podcast_titulo || 'Podcast'],
        episodes: 1
      };
    }

    // For books
    if (resourceType === 'titulo') {
      return {
        id: data.id || requestedId, // Use real book ID
        originalId: data.id || requestedId,
        title: data.titulo || 'Livro sem título',
        author: data.autor || 'Autor desconhecido',
        year: data.ano || new Date().getFullYear(),
        description: data.descricao || 'Descrição não disponível',
        subject: data.categorias?.[0] || 'Administração',
        type: 'titulo',
        thumbnail: '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
        pages: data.paginas,
        pdfUrl: data.arquivo,
        language: data.language,
        documentType: data.tipo_documento || 'Livro',
        categories: data.categorias || []
      };
    }

    // For videos/classes
    if (resourceType === 'video') {
      return {
        id: data.id || requestedId, // Use real video ID
        originalId: data.id || requestedId,
        title: data.titulo || 'Vídeo sem título',
        author: data.canal || 'Canal desconhecido',
        year: data.ano || new Date().getFullYear(),
        description: data.descricao || 'Descrição não disponível',
        subject: data.categorias?.[0] || 'Empreendedorismo',
        type: 'video',
        thumbnail: data.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
        duration: data.duracao ? this.formatDuration(data.duracao * 1000) : undefined,
        embedUrl: data.embed_url,
        categories: data.categorias || [],
        language: data.idioma
      };
    }

    throw new Error(`Tipo de recurso não suportado: ${resourceType}`);
  }

  private static formatDuration(durationMs: number): string {
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }
}
