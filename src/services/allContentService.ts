
import { SearchResult } from '@/types/searchTypes';

export interface AllContentResponse {
  conteudo: any[];
  total: number;
  totalPages: number;
  page: number;
}

export interface AllContentItem {
  id: string;
  type: string;
  titulo?: string;
  autor?: string;
  ano?: number;
  descricao?: string;
  imagem_url?: string;
  categorias?: string[];
  canal?: string;
  duracao?: number;
  paginas?: number;
  embed_url?: string;
  url?: string;
  tipo_documento?: string;
  idioma?: string;
  podcast_titulo?: string;
  episodio_titulo?: string;
  publicador?: string;
  data_lancamento?: string;
  duracao_ms?: number;
}

export class AllContentService {
  private static readonly API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';
  private static readonly TIMEOUT_MS = 15000;

  static async fetchAllContent(page: number = 1, limit: number = 10): Promise<AllContentResponse> {
    const requestId = `all_content_${Date.now()}`;
    console.group(`🔍 ${requestId} - All Content Request`);
    console.log('📋 Parameters:', { page, limit });
    
    try {
      const url = `${this.API_BASE_URL}/conteudo-lbs/todos?page=${page}&limit=${limit}`;
      console.log('🌐 API URL:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LSB-All-Content/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} para todos os conteúdos`);
      }

      const data = await response.json();
      
      if (!data.conteudo || !Array.isArray(data.conteudo)) {
        console.warn('⚠️ All content returned no results:', data);
        console.groupEnd();
        return {
          conteudo: [],
          total: 0,
          totalPages: 0,
          page: page
        };
      }
      
      console.log(`✅ All content success: ${data.conteudo.length} items found`);
      console.log('📊 Response data:', {
        items: data.conteudo.length,
        total: data.total,
        totalPages: data.totalPages,
        page: data.page
      });
      
      console.groupEnd();
      
      return {
        conteudo: data.conteudo,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
        page: data.page || page
      };
      
    } catch (error) {
      console.error(`❌ All content fetch failed:`, error);
      console.groupEnd();
      throw error;
    }
  }

  static async fetchItemById(id: string): Promise<any> {
    const requestId = `all_item_${Date.now()}`;
    console.group(`🎯 ${requestId} - All Content Item By ID (ENDPOINT CORRIGIDO)`);
    console.log('📋 Item ID:', id);
    
    try {
      // ✅ CORREÇÃO CRÍTICA: Usar endpoint correto /item/{id}
      const url = `${this.API_BASE_URL}/conteudo-lbs/item/${id}`;
      console.log('🌐 API URL CORRIGIDA:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LSB-All-Content-Item/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} para item ID ${id}`);
      }

      const data = await response.json();
      console.log(`✅ Item fetch success for ID ${id}:`, data);
      
      console.groupEnd();
      return data;
      
    } catch (error) {
      console.error(`❌ Item fetch failed for ID ${id}:`, error);
      console.groupEnd();
      throw error;
    }
  }

  static transformToSearchResult(item: AllContentItem): SearchResult {
    console.group('🔄 ALL CONTENT - Transform to SearchResult (IDs CORRIGIDOS)');
    console.log('📋 Original item ID:', item.id, typeof item.id);
    
    // Detectar tipo de conteúdo baseado nas propriedades
    let type: 'video' | 'titulo' | 'podcast';
    let title = '';
    let author = '';
    let description = '';
    
    if (item.type === 'video' || item.canal) {
      type = 'video';
      title = item.titulo || 'Vídeo sem título';
      author = item.canal || 'Canal desconhecido';
      description = item.descricao || `Vídeo de ${author}`;
    } else if (item.type === 'podcast' || item.podcast_titulo || item.episodio_titulo) {
      type = 'podcast';
      title = item.episodio_titulo || item.podcast_titulo || 'Podcast sem título';
      author = item.publicador || 'Publicador desconhecido';
      description = item.descricao || `Episódio de ${item.podcast_titulo || 'podcast'}`;
    } else {
      // Livros e artigos
      type = 'titulo';
      title = item.titulo || 'Título não disponível';
      author = item.autor || 'Autor desconhecido';
      description = item.descricao || `${item.tipo_documento || 'Documento'} de ${author}`;
    }

    // ✅ CORREÇÃO CRÍTICA: Preservar ID como string, não converter para número
    const finalId = String(item.id);
    
    const searchResult: SearchResult = {
      id: finalId,  // ✅ Manter como string
      originalId: finalId,  // ✅ Manter como string
      title: title,
      type: type,
      author: author,
      description: description,
      year: item.ano || new Date().getFullYear(),
      subject: item.categorias?.[0] || 'Geral',
      thumbnail: item.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
      duration: type === 'video' && item.duracao ? `${Math.floor(item.duracao / 60)}m` :
                type === 'podcast' && item.duracao_ms ? this.formatDuration(item.duracao_ms) : undefined,
      pages: item.paginas,
      episodes: type === 'podcast' ? 1 : undefined,
      embedUrl: item.embed_url,
      pdfUrl: item.url,
      documentType: item.tipo_documento,
      language: item.idioma,
      program: type === 'podcast' ? item.podcast_titulo : undefined,
      channel: type === 'video' ? item.canal : undefined,
      categories: item.categorias || []
    };

    console.log('✅ RESULTADO FINAL:', {
      originalId: item.id,
      finalId: finalId,
      type: type,
      title: title.substring(0, 50) + '...'
    });
    console.groupEnd();

    return searchResult;
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
