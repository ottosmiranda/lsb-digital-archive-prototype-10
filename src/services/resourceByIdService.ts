import { Resource } from '@/types/resourceTypes';
import { API_BASE_URL } from './api/apiConfig';
import { AllContentService } from './allContentService';

export interface ApiResourceResponse {
  // Para livros e artigos
  id?: string;
  titulo?: string;
  autor?: string;
  language?: string;
  idioma?: string;
  ano?: number;
  data_publicacao?: string;
  categorias?: string[];
  categoria?: string;
  descricao?: string;
  paginas?: number;
  arquivo?: string;
  url?: string;
  tipo_documento?: string;
  
  // Para vídeos/aulas
  tipo?: string;
  canal?: string;
  imagem_url?: string;
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
}

export class ResourceByIdService {
  private static readonly TIMEOUT_MS = 8000;

  static async fetchResourceById(id: string, resourceType: string): Promise<Resource | null> {
    console.group(`🎯 FETCH RESOURCE BY ID - LÓGICA POLIMÓRFICA ATUALIZADA`);
    console.log(`📋 Target: ${resourceType} ID ${id}`);
    
    try {
      // ✅ FASE 5: Sincronização com AllContentService
      if (resourceType === 'all') {
        console.log('🎯 USANDO LÓGICA POLIMÓRFICA para tipo "all"');
        const data = await AllContentService.fetchItemById(id);
        const transformedResource = this.transformToResourcePolymorphic(data, resourceType, id);
        
        if (transformedResource && this.isValidResource(transformedResource)) {
          console.log(`✅ RECURSO 'ALL' POLIMÓRFICO VÁLIDO:`, transformedResource.title);
          console.groupEnd();
          return transformedResource;
        } else {
          console.error(`❌ RECURSO 'ALL' INVÁLIDO APÓS TRANSFORMAÇÃO POLIMÓRFICA:`, transformedResource);
          console.groupEnd();
          return null;
        }
      }

      const endpoint = this.getEndpointForType(resourceType, id);
      console.log(`🔗 Endpoint: ${endpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
      
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`❌ HTTP ${response.status} para ${resourceType} ID ${id}`);
        console.groupEnd();
        return null;
      }

      const data = await response.json();
      console.log(`✅ API SUCCESS: ${resourceType} ID ${id}`, data);
      
      // ✅ NOVO: Para livros via Edge Function, extrair o livro do wrapper
      let actualData;
      if (resourceType === 'livro' && data.book) {
        actualData = data.book;
      } else if ((resourceType === 'artigo' || resourceType === 'artigos') && data.article) {
        actualData = data.article;
      } else {
        actualData = data;
      }
      
      const transformedResource = this.transformToResource(actualData, resourceType, id);
      
      if (transformedResource && this.isValidResource(transformedResource)) {
        console.log(`✅ RECURSO VÁLIDO CRIADO:`, transformedResource.title);
        console.groupEnd();
        return transformedResource;
      } else {
        console.error(`❌ RECURSO INVÁLIDO APÓS TRANSFORMAÇÃO:`, transformedResource);
        console.groupEnd();
        return null;
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`⏰ TIMEOUT: ${resourceType} ID ${id} (${this.TIMEOUT_MS}ms)`);
      } else {
        console.error(`❌ ERRO FETCH: ${resourceType} ID ${id}:`, error);
      }
      console.groupEnd();
      return null;
    }
  }

  private static transformToResourcePolymorphic(data: any, resourceType: string, requestedId: string): Resource {
    console.group(`🔄 TRANSFORMAÇÃO POLIMÓRFICA: ${resourceType} ID ${requestedId}`);
    console.log('📋 Raw API data:', data);

    try {
      // ✅ LÓGICA POLIMÓRFICA: Extrair dados usando a mesma lógica do AllContentService
      const extractedId = data.episodio_id || data.id || requestedId;
      const extractedTitle = data.episodio_titulo || data.titulo || data.title || 'Título não disponível';
      const extractedThumbnail = data.imagem_url || data.thumbnail || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png';
      const extractedType = data.tipo || data.type || 'unknown';

      // Detectar tipo usando a mesma lógica
      let detectedType: 'video' | 'titulo' | 'podcast';
      let author = '';
      let description = '';
      
      if (data.episodio_id || data.podcast_id || extractedType === 'podcast' || data.podcast_titulo) {
        detectedType = 'podcast';
        author = data.publicador || 'Publicador desconhecido';
        description = data.descricao || `Episódio de ${data.podcast_titulo || 'podcast'}`;
      } else if (extractedType === 'video' || data.canal || data.embed_url) {
        detectedType = 'video';
        author = data.canal || 'Canal desconhecido';
        description = data.descricao || `Vídeo de ${author}`;
      } else {
        detectedType = 'titulo';
        author = data.autor || 'Autor desconhecido';
        description = data.descricao || `${data.tipo_documento || 'Documento'} de ${author}`;
      }
      
      console.log('🔍 TIPO DETECTADO POLIMÓRFICO:', detectedType);
      
      const resource: Resource = {
        id: String(extractedId),
        originalId: String(extractedId),
        title: extractedTitle,
        author: author,
        year: data.ano || new Date(data.data_lancamento || Date.now()).getFullYear(),
        description: description,
        subject: data.categorias?.[0] || data.categoria || 'Geral',
        type: detectedType,
        thumbnail: extractedThumbnail,
        duration: detectedType === 'video' && data.duracao ? this.formatDuration(data.duracao * 1000) :
                  detectedType === 'podcast' && data.duracao_ms ? this.formatDuration(data.duracao_ms) : undefined,
        pages: data.paginas,
        episodes: detectedType === 'podcast' ? 1 : undefined,
        embedUrl: data.embed_url,
        pdfUrl: data.url,
        documentType: data.tipo_documento,
        language: this.mapLanguageCode(data.idioma),
        categories: Array.isArray(data.categorias) ? data.categorias : (data.categoria ? [data.categoria] : []),
        podcast_titulo: detectedType === 'podcast' ? data.podcast_titulo : undefined
      };
      
      console.log('✅ RECURSO POLIMÓRFICO TRANSFORMADO:', resource);
      console.groupEnd();
      return resource;
      
    } catch (error) {
      console.error('❌ ERRO NA TRANSFORMAÇÃO POLIMÓRFICA:', error);
      console.groupEnd();
      return null;
    }
  }

  private static isValidResource(resource: Resource): boolean {
    if (!resource) {
      console.log('❌ VALIDAÇÃO: Recurso é null/undefined');
      return false;
    }
    
    if (!resource.id || resource.id.trim() === '') {
      console.log('❌ VALIDAÇÃO: ID inválido:', resource.id);
      return false;
    }
    
    if (!resource.title || resource.title.trim() === '' || resource.title === 'Título não disponível') {
      console.log('❌ VALIDAÇÃO: Título inválido ou fallback:', resource.title);
      return false;
    }
    
    if (!resource.type || !['video', 'titulo', 'podcast', 'all'].includes(resource.type)) {
      console.log('❌ VALIDAÇÃO: Tipo inválido:', resource.type);
      return false;
    }
    
    console.log('✅ VALIDAÇÃO: Recurso válido');
    return true;
  }

  private static getEndpointForType(resourceType: string, id: string): string {
    switch (resourceType) {
      case 'video':
        return `${API_BASE_URL}/conteudo-lbs/aula/${id}`;
      case 'titulo':
      case 'livro':
        // ✅ CORREÇÃO: Usar Edge Function para livros também
        return `https://acnympbxfptajtxvmkqn.supabase.co/functions/v1/fetch-books?id=${id}`;
      case 'artigo':
      case 'artigos':
        return `https://acnympbxfptajtxvmkqn.supabase.co/functions/v1/fetch-articles?id=${id}`;
      case 'podcast':
        return `${API_BASE_URL}/conteudo-lbs/podcast/${id}`;
      case 'all':
        // Para 'all', usar AllContentService - este método não deveria ser chamado
        throw new Error(`Tipo 'all' deve usar AllContentService.fetchItemById`);
      default:
        throw new Error(`Tipo de recurso não suportado: ${resourceType}`);
    }
  }

  static async fetchArticleById(id: string): Promise<Resource | null> {
    console.log(`🎯 BUSCA ARTIGO: ID ${id}`);
    
    try {
      const endpoint = `${API_BASE_URL}/conteudo-lbs/artigos/${id}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
      
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} para artigo ID ${id}`);
      }

      const data = await response.json();
      console.log(`✅ SUCESSO ARTIGO: ID ${id}`, data);
      
      return this.transformToResource(data, 'artigos', id);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`⏰ TIMEOUT ARTIGO: ID ${id} (${this.TIMEOUT_MS}ms)`);
      } else {
        console.log(`❌ ERRO ARTIGO: ID ${id}:`, error);
      }
      return null;
    }
  }

  private static transformToResource(data: any, resourceType: string, requestedId: string): Resource {
    console.group(`🔄 TRANSFORMAÇÃO ROBUSTA: ${resourceType} ID ${requestedId}`);
    console.log('📋 Raw API data:', data);

    try {
      // ✅ NOVA LÓGICA: Melhor detecção de tipo para 'all'
      if (resourceType === 'all') {
        console.log('🎯 PROCESSANDO ITEM DO FILTRO "ALL" COM DETECÇÃO AUTOMÁTICA');
        
        let detectedType: 'video' | 'titulo' | 'podcast';
        let title = '';
        let author = '';
        let description = '';
        
        // Detectar tipo baseado nos dados
        if (data.type === 'video' || data.canal || data.embed_url) {
          detectedType = 'video';
          title = data.titulo || 'Vídeo sem título';
          author = data.canal || 'Canal desconhecido';
          description = data.descricao || `Vídeo de ${author}`;
        } else if (data.type === 'podcast' || data.podcast_titulo || data.episodio_titulo || data.duracao_ms) {
          detectedType = 'podcast';
          title = data.episodio_titulo || data.podcast_titulo || 'Podcast sem título';
          author = data.publicador || 'Publicador desconhecido';
          description = data.descricao || `Episódio de ${data.podcast_titulo || 'podcast'}`;
        } else {
          // Livros e artigos
          detectedType = 'titulo';
          title = data.titulo || 'Título não disponível';
          author = data.autor || 'Autor desconhecido';
          description = data.descricao || `${data.tipo_documento || 'Documento'} de ${author}`;
        }
        
        console.log('🔍 TIPO DETECTADO:', detectedType);
        
        const resource: Resource = {
          id: String(data.id || requestedId),
          originalId: String(data.id || requestedId),
          title: title,
          author: author,
          year: data.ano || new Date().getFullYear(),
          description: description,
          subject: data.categorias?.[0] || data.categoria || 'Geral',
          type: detectedType,
          thumbnail: data.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
          duration: detectedType === 'video' && data.duracao ? this.formatDuration(data.duracao * 1000) :
                    detectedType === 'podcast' && data.duracao_ms ? this.formatDuration(data.duracao_ms) : undefined,
          pages: data.paginas,
          episodes: detectedType === 'podcast' ? 1 : undefined,
          embedUrl: data.embed_url,
          pdfUrl: data.url,
          documentType: data.tipo_documento,
          language: this.mapLanguageCode(data.idioma),
          categories: Array.isArray(data.categorias) ? data.categorias : (data.categoria ? [data.categoria] : []),
          podcast_titulo: detectedType === 'podcast' ? data.podcast_titulo : undefined
        };
        
        console.log('✅ RECURSO "ALL" TRANSFORMADO:', resource);
        console.groupEnd();
        return resource;
      }

      if (resourceType === 'podcast' && Array.isArray(data)) {
        const podcast = data[0];
        
        const subject = podcast.categorias && podcast.categorias.length > 0 
          ? podcast.categorias[0].charAt(0).toUpperCase() + podcast.categorias[0].slice(1)
          : 'Podcast';
        
        const resource: Resource = {
          id: podcast.episodio_id || podcast.podcast_id || requestedId,
          originalId: podcast.episodio_id || podcast.podcast_id || requestedId,
          title: podcast.episodio_titulo || podcast.podcast_titulo || 'Podcast sem título',
          author: podcast.publicador || 'Autor desconhecido',
          year: new Date(podcast.data_lancamento || Date.now()).getFullYear(),
          description: podcast.descricao || 'Descrição não disponível',
          subject: subject,
          type: 'podcast',
          thumbnail: podcast.imagem_url,
          duration: podcast.duracao_ms ? this.formatDuration(podcast.duracao_ms) : undefined,
          embedUrl: podcast.embed_url,
          categories: podcast.categorias || [],
          episodes: 1,
          podcast_titulo: podcast.podcast_titulo
        };
        
        console.log('✅ PODCAST TRANSFORMADO:', resource);
        console.groupEnd();
        return resource;
      }

      if (resourceType === 'titulo' || resourceType === 'livro' || resourceType === 'artigos') {
        const year = this.extractYearFromDate(data.data_publicacao || data.ano);
        const documentType = resourceType === 'artigos' ? 'Artigo' : (data.tipo_documento || 'Livro');
        
        const resourceId = data.id || requestedId;
        const title = data.titulo || data.title || `${documentType} ID ${resourceId}`;
        const author = data.autor || data.author || 'Link Business School';
        const description = data.descricao || data.description || `${documentType} de ${author}`;
        
        if (!resourceId || !title || title === 'Título não disponível') {
          console.error('❌ DADOS INSUFICIENTES PARA TRANSFORMAÇÃO:', { resourceId, title });
          console.groupEnd();
          return null;
        }
        
        const resource: Resource = {
          id: String(resourceId),
          originalId: String(resourceId),
          title: title,
          author: author,
          year: year,
          description: description,
          subject: data.categorias?.[0] || data.categoria || 'Administração',
          type: 'titulo',
          thumbnail: data.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
          pages: data.paginas,
          pdfUrl: data.pdfUrl || data.arquivo || data.url,
          language: this.mapLanguageCode(data.language || data.idioma),
          documentType: documentType,
          categories: Array.isArray(data.categorias) ? data.categorias : (data.categoria ? [data.categoria] : [])
        };
        
        console.log('✅ LIVRO/ARTIGO TRANSFORMADO:', resource);
        console.groupEnd();
        return resource;
      }

      if (resourceType === 'video') {
        const videoYear = data.ano || new Date().getFullYear();
        
        const resourceId = data.id || requestedId;
        const title = data.titulo || data.title || `Vídeo ID ${resourceId}`;
        const author = data.canal || data.author || 'Canal desconhecido';
        const description = data.descricao || data.description || `Vídeo de ${author}`;
        
        const resource: Resource = {
          id: String(resourceId),
          originalId: String(resourceId),
          title: title,
          author: author,
          year: videoYear,
          description: description,
          subject: data.categorias?.[0] || 'Empreendedorismo',
          type: 'video',
          thumbnail: data.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
          duration: data.duracao ? this.formatDuration(data.duracao * 1000) : undefined,
          embedUrl: data.embed_url,
          categories: data.categorias || [],
          language: data.idioma
        };
        
        console.log('✅ VÍDEO TRANSFORMADO:', resource);
        console.groupEnd();
        return resource;
      }

      throw new Error(`Tipo de recurso não suportado: ${resourceType}`);
      
    } catch (error) {
      console.error('❌ ERRO NA TRANSFORMAÇÃO:', error);
      console.groupEnd();
      return null;
    }
  }

  private static extractYearFromDate(dateValue: any): number {
    if (!dateValue) return new Date().getFullYear();
    
    if (typeof dateValue === 'number') return dateValue;
    
    if (typeof dateValue === 'string' && dateValue.toLowerCase().includes('desconhecida')) {
      return new Date().getFullYear();
    }
    
    if (typeof dateValue === 'string') {
      const dateObj = new Date(dateValue);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.getFullYear();
      }
    }
    
    return new Date().getFullYear();
  }

  private static mapLanguageCode(idioma: string): string {
    if (!idioma || idioma === 'desconhecido') return 'Não especificado';
    
    const languageMap: Record<string, string> = {
      'en': 'Inglês',
      'pt': 'Português',
      'es': 'Espanhol',
      'fr': 'Francês',
      'de': 'Alemão',
      'it': 'Italiano'
    };
    
    return languageMap[idioma.toLowerCase()] || idioma.charAt(0).toUpperCase() + idioma.slice(1);
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
