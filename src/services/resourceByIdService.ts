
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

  // ✅ NOVO: Validação robusta dos dados da API
  private static validateApiData(data: any, resourceType: string, requestedId: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    console.group(`🔍 VALIDAÇÃO API DATA: ${resourceType} ID ${requestedId}`);
    console.log('📋 Raw API data:', JSON.stringify(data, null, 2));
    
    if (!data) {
      errors.push('Dados nulos ou indefinidos');
    }
    
    // Validação específica por tipo
    if (resourceType === 'livro' || resourceType === 'titulo' || resourceType === 'artigos') {
      if (!data.titulo && !data.title) {
        errors.push('Campo titulo/title obrigatório ausente');
      }
      if (!data.id) {
        errors.push('Campo id obrigatório ausente');
      }
    } else if (resourceType === 'video') {
      if (!data.titulo && !data.title) {
        errors.push('Campo titulo/title obrigatório ausente');
      }
      if (!data.id) {
        errors.push('Campo id obrigatório ausente');
      }
    } else if (resourceType === 'podcast') {
      if (Array.isArray(data)) {
        if (data.length === 0) {
          errors.push('Array de podcasts vazio');
        } else {
          const podcast = data[0];
          if (!podcast.episodio_titulo && !podcast.podcast_titulo) {
            errors.push('Títulos do episódio/podcast ausentes');
          }
          if (!podcast.episodio_id && !podcast.podcast_id) {
            errors.push('IDs do episódio/podcast ausentes');
          }
        }
      } else {
        errors.push('Dados de podcast devem ser um array');
      }
    }
    
    const isValid = errors.length === 0;
    console.log(`📊 Validação resultado: ${isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
    if (!isValid) {
      console.log('📋 Erros encontrados:', errors);
    }
    console.groupEnd();
    
    return { isValid, errors };
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
    console.group(`🔄 TRANSFORMAÇÃO DE RECURSO: ${resourceType} ID ${requestedId}`);
    console.log('📋 Dados a serem transformados:', data);

    try {
      // ✅ CORRIGIDO: Para podcasts, usar categorias para subject (badges)
      if (resourceType === 'podcast' && Array.isArray(data)) {
        const podcast = data[0]; // Get the first episode
        
        // Use categories for subject (badges)
        const subject = podcast.categorias && podcast.categorias.length > 0 
          ? podcast.categorias[0].charAt(0).toUpperCase() + podcast.categorias[0].slice(1)
          : 'Podcast';
        
        const resource: Resource = {
          id: podcast.episodio_id || podcast.podcast_id || requestedId, // ✅ Melhor fallback
          originalId: podcast.episodio_id || podcast.podcast_id || requestedId,
          title: podcast.episodio_titulo || podcast.podcast_titulo || 'Podcast sem título',
          author: podcast.publicador || 'Autor desconhecido',
          year: new Date(podcast.data_lancamento || Date.now()).getFullYear(),
          description: podcast.descricao || 'Descrição não disponível',
          subject: subject, // ✅ CORRIGIDO: Usar categorias para badges
          type: 'podcast',
          thumbnail: podcast.imagem_url,
          duration: podcast.duracao_ms ? this.formatDuration(podcast.duracao_ms) : undefined,
          embedUrl: podcast.embed_url,
          categories: podcast.categorias || [],
          episodes: 1,
          // ✅ Preservar título do programa para uso na página de detalhes
          podcast_titulo: podcast.podcast_titulo
        };
        
        console.log('✅ PODCAST TRANSFORMADO:', resource);
        console.groupEnd();
        return resource;
      }

      // For books and articles
      if (resourceType === 'titulo' || resourceType === 'livro' || resourceType === 'artigos') {
        const year = this.extractYearFromDate(data.data_publicacao || data.ano);
        const documentType = resourceType === 'artigos' ? 'Artigo' : (data.tipo_documento || 'Livro');
        
        // ✅ MELHORADOS: Fallbacks mais robustos para campos essenciais
        const resourceId = data.id || requestedId;
        const title = data.titulo || data.title || `${documentType} sem título`;
        const author = data.autor || data.author || 'Autor desconhecido';
        const description = data.descricao || data.description || 'Descrição não disponível';
        
        const resource: Resource = {
          id: String(resourceId), // ✅ Garantir que é string
          originalId: String(resourceId),
          title: title,
          author: author,
          year: year,
          description: description,
          subject: data.categorias?.[0] || data.categoria || 'Administração',
          type: 'titulo',
          thumbnail: '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
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

      // For videos/classes
      if (resourceType === 'video') {
        const videoYear = data.ano || new Date().getFullYear(); // Use dynamic year from API
        
        // ✅ MELHORADOS: Fallbacks mais robustos para vídeos
        const resourceId = data.id || requestedId;
        const title = data.titulo || data.title || 'Vídeo sem título';
        const author = data.canal || data.author || 'Canal desconhecido';
        const description = data.descricao || data.description || 'Descrição não disponível';
        
        const resource: Resource = {
          id: String(resourceId), // ✅ Garantir que é string
          originalId: String(resourceId),
          title: title,
          author: author,
          year: videoYear, // Using dynamic year from API individual endpoint
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
      throw error;
    }
  }

  // ✅ NOVO: Validação final do recurso transformado
  private static validateResource(resource: Resource): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!resource.id || resource.id === 'undefined' || resource.id === 'null') {
      errors.push('ID inválido');
    }
    
    if (!resource.title || resource.title.trim() === '') {
      errors.push('Título inválido');
    }
    
    if (!resource.author || resource.author.trim() === '') {
      errors.push('Autor inválido');
    }
    
    if (!resource.type || !['video', 'titulo', 'podcast'].includes(resource.type)) {
      errors.push('Tipo inválido');
    }
    
    return { isValid: errors.length === 0, errors };
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
