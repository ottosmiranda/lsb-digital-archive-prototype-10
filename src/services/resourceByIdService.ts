import { Resource } from '@/types/resourceTypes';
import { API_BASE_URL } from './api/apiConfig';

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
  private static readonly TIMEOUT_MS = 8000; // Aumentado para livros

  static async fetchResourceById(id: string, resourceType: string): Promise<Resource | null> {
    console.group(`🎯 FETCH RESOURCE BY ID - OTIMIZADO PARA LIVROS`);
    console.log(`📋 Target: ${resourceType} ID ${id}`);
    
    try {
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
      
      // ✅ CORREÇÃO: Transformar sempre, com fallbacks robustos
      const transformedResource = this.transformToResource(data, resourceType, id);
      
      // ✅ NOVO: Validação final mais permissiva
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

  // ✅ NOVO: Validação mais permissiva e robusta
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
    
    if (!resource.type || !['video', 'titulo', 'podcast'].includes(resource.type)) {
      console.log('❌ VALIDAÇÃO: Tipo inválido:', resource.type);
      return false;
    }
    
    console.log('✅ VALIDAÇÃO: Recurso válido');
    return true;
  }

  private static getEndpointForType(resourceType: string, id: string): string {
    const baseUrl = `${API_BASE_URL}/conteudo-lbs`;
    
    switch (resourceType) {
      case 'video':
        return `${baseUrl}/aula/${id}`;
      case 'titulo':
        // Para títulos, precisamos determinar se é livro ou artigo
        // Por enquanto, tentaremos livro primeiro, depois artigo
        return `${baseUrl}/livro/${id}`;
      case 'podcast':
        return `${baseUrl}/podcast/${id}`;
      default:
        throw new Error(`Tipo de recurso não suportado: ${resourceType}`);
    }
  }

  // Método auxiliar para buscar artigo especificamente
  static async fetchArticleById(id: string): Promise<Resource | null> {
    console.log(`🎯 BUSCA ARTIGO: ID ${id}`);
    
    try {
      const endpoint = `${API_BASE_URL}/conteudo-lbs/artigo/${id}`;
      
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
      
      return this.transformToResource(data, 'artigo', id);
      
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
      // ✅ MELHORADO: Para podcasts, usar categorias para subject (badges)
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

      // ✅ CORREÇÃO CRÍTICA: Para livros e artigos - Fallbacks mais robustos
      if (resourceType === 'titulo' || resourceType === 'livro' || resourceType === 'artigo') {
        const year = this.extractYearFromDate(data.data_publicacao || data.ano);
        const documentType = resourceType === 'artigo' ? 'Artigo' : (data.tipo_documento || 'Livro');
        
        // ✅ FALLBACKS MAIS ROBUSTOS para campos essenciais
        const resourceId = data.id || requestedId;
        const title = data.titulo || data.title || `${documentType} ID ${resourceId}`;
        const author = data.autor || data.author || 'Link Business School';
        const description = data.descricao || data.description || `${documentType} de ${author}`;
        
        // ✅ NOVO: Verificar se temos dados mínimos válidos
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
          pdfUrl: data.arquivo || data.url,
          language: this.mapLanguageCode(data.language || data.idioma),
          documentType: documentType,
          categories: Array.isArray(data.categorias) ? data.categorias : (data.categoria ? [data.categoria] : [])
        };
        
        console.log('✅ LIVRO/ARTIGO TRANSFORMADO:', resource);
        console.groupEnd();
        return resource;
      }

      // ✅ MELHORADO: Para vídeos/classes
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
    
    // Se já é um número, retornar diretamente
    if (typeof dateValue === 'number') return dateValue;
    
    // Se é string "desconhecida", retornar ano atual
    if (typeof dateValue === 'string' && dateValue.toLowerCase().includes('desconhecida')) {
      return new Date().getFullYear();
    }
    
    // Tentar extrair ano de string de data
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
