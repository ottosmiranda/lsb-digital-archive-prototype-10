
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
  title?: string; // ✅ Adicionado
  autor?: string;
  ano?: number;
  descricao?: string;
  imagem_url?: string;
  thumbnail?: string; // ✅ Adicionado
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
  episodio_id?: string;
  podcast_id?: string;
  publicador?: string;
  data_lancamento?: string;
  duracao_ms?: number;
  tipo?: string;
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
      
      // ✅ FILTRO CRÍTICO: Transformar e filtrar nulls IMEDIATAMENTE
      const transformedItems = data.conteudo
        .map((item: any) => this.transformToSearchResult(item))
        .filter((item: any) => item !== null && item !== undefined);
      
      const originalCount = data.conteudo.length;
      const validCount = transformedItems.length;
      
      console.log(`✅ All content success: ${originalCount} items received, ${validCount} valid after filtering`);
      
      if (validCount < originalCount) {
        console.warn(`⚠️ FILTERED OUT ${originalCount - validCount} invalid items from API response`);
      }
      
      console.log('📊 Response data:', {
        originalItems: originalCount,
        validItems: validCount,
        filteredOut: originalCount - validCount,
        total: data.total,
        totalPages: data.totalPages,
        page: data.page
      });
      
      console.groupEnd();
      
      return {
        conteudo: transformedItems, // Retornar apenas items válidos
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

  static transformToSearchResult(item: AllContentItem): SearchResult | null {
    console.group('🔄 ALL CONTENT - Lógica Polimórfica Robusta');
    
    // ✅ FASE 1: Extração Polimórfica de ID, Título e Imagem
    // Usar cadeia de verificação para lidar com estruturas heterogêneas
    const extractedId = item.episodio_id || item.id || 'missing-id';
    const extractedTitle = item.episodio_titulo || item.titulo || item.title || 'Título não disponível';
    const extractedThumbnail = item.imagem_url || item.thumbnail || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png';
    const extractedType = item.tipo || item.type || 'unknown';

    // ✅ VALIDAÇÃO CRÍTICA: Rejeitar itens com ID inválido PRIMEIRO
    const invalidIds = ['', '0', 'undefined', 'null', 'missing-id', null, undefined];
    const idString = String(extractedId);
    
    if (!extractedId || invalidIds.includes(idString) || idString.trim() === '') {
      console.error('❌ ID INVÁLIDO REJEITADO IMEDIATAMENTE:', {
        originalItem: { id: item.id, episodio_id: item.episodio_id, titulo: item.titulo },
        extractedId: extractedId,
        idString: idString,
        reason: 'ID inválido detectado antes da transformação'
      });
      console.groupEnd();
      return null; // Retornar null explicitamente para ser filtrado
    }

    // ✅ FASE 2: Detecção Inteligente de Tipo de Conteúdo
    let detectedType: 'video' | 'titulo' | 'podcast';
    let author = '';
    let description = '';
    
    // Detectar podcast pelos campos específicos
    if (item.episodio_id || item.podcast_id || extractedType === 'podcast' || item.podcast_titulo) {
      detectedType = 'podcast';
      author = item.publicador || 'Publicador desconhecido';
      description = item.descricao || `Episódio de ${item.podcast_titulo || 'podcast'}`;
    } 
    // Detectar vídeo
    else if (extractedType === 'video' || item.canal || item.embed_url) {
      detectedType = 'video';
      author = item.canal || 'Canal desconhecido';
      description = item.descricao || `Vídeo de ${author}`;
    } 
    // Livros e artigos (fallback)
    else {
      detectedType = 'titulo';
      author = item.autor || 'Autor desconhecido';
      description = item.descricao || `${item.tipo_documento || 'Documento'} de ${author}`;
    }

    // ✅ FASE 3: Logs Diagnósticos Detalhados
    console.log('📊 Dados extraídos (ID VÁLIDO):', {
      originalData: {
        id: item.id,
        episodio_id: item.episodio_id,
        titulo: item.titulo,
        episodio_titulo: item.episodio_titulo,
        tipo: item.tipo,
        type: item.type
      },
      extracted: {
        id: extractedId,
        title: extractedTitle.substring(0, 50) + '...',
        type: detectedType,
        thumbnail: extractedThumbnail ? 'presente' : 'ausente'
      },
      validationPassed: true
    });

    const searchResult: SearchResult = {
      id: String(extractedId),
      originalId: String(extractedId),
      title: extractedTitle,
      type: detectedType,
      author: author,
      description: description,
      year: item.ano || new Date(item.data_lancamento || Date.now()).getFullYear(),
      subject: item.categorias?.[0] || 'Geral',
      thumbnail: extractedThumbnail,
      duration: detectedType === 'video' && item.duracao ? `${Math.floor(item.duracao / 60)}m` :
                detectedType === 'podcast' && item.duracao_ms ? this.formatDuration(item.duracao_ms) : undefined,
      pages: item.paginas,
      episodes: detectedType === 'podcast' ? 1 : undefined,
      embedUrl: item.embed_url,
      pdfUrl: item.url,
      documentType: item.tipo_documento,
      language: item.idioma,
      program: detectedType === 'podcast' ? item.podcast_titulo : undefined,
      channel: detectedType === 'video' ? item.canal : undefined,
      categories: item.categorias || []
    };

    console.log('✅ RESULTADO FINAL POLIMÓRFICO:', {
      originalId: extractedId,
      finalId: searchResult.id,
      type: detectedType,
      title: extractedTitle.substring(0, 50) + '...',
      navigationReady: true
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
