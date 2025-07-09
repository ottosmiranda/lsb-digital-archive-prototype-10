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
  private static readonly TIMEOUT_MS = 6000; // Reduced timeout for faster failures

  static async fetchResourceById(id: string, resourceType: string): Promise<Resource | null> {
    console.log(`🎯 BUSCA OTIMIZADA: ${resourceType} ID ${id}`);
    
    try {
      const endpoint = this.getEndpointForType(resourceType, id);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
      
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} para ${resourceType} ID ${id}`);
      }

      const data = await response.json();
      console.log(`✅ SUCESSO: ${resourceType} ID ${id}`, data);
      
      return this.transformToResource(data, resourceType, id);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`⏰ TIMEOUT: ${resourceType} ID ${id} (${this.TIMEOUT_MS}ms)`);
      } else {
        console.log(`❌ ERRO: ${resourceType} ID ${id}:`, error);
      }
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

    // ✅ CORRIGIDO: For podcasts, the response is an array - usar podcast_titulo como subject
    if (resourceType === 'podcast' && Array.isArray(data)) {
      const podcast = data[0]; // Get the first episode
      return {
        id: podcast.episodio_id || requestedId, // Use real episode ID
        originalId: podcast.episodio_id || requestedId,
        title: podcast.episodio_titulo || podcast.podcast_titulo || 'Podcast sem título',
        author: podcast.publicador || 'Autor desconhecido',
        year: new Date(podcast.data_lancamento || Date.now()).getFullYear(),
        description: podcast.descricao || 'Descrição não disponível',
        subject: podcast.podcast_titulo || 'Podcast', // ✅ CORRIGIDO: Usar podcast_titulo como subject
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

    // ✅ CORRIGIDO: For videos/classes - usar ano dinâmico da API
    if (resourceType === 'video') {
      const videoYear = data.ano || new Date().getFullYear(); // Use dynamic year from API
      console.log(`📅 VIDEO DETAIL YEAR TRANSFORMATION: ${data.titulo?.substring(0, 30)}... - Year: ${videoYear} (from API: ${data.ano})`);
      
      return {
        id: data.id || requestedId, // Use real video ID
        originalId: data.id || requestedId,
        title: data.titulo || 'Vídeo sem título',
        author: data.canal || 'Canal desconhecido',
        year: videoYear, // ✅ CORRIGIDO: Using dynamic year from API individual endpoint
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
