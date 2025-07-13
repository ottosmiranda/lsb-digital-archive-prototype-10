
import { SearchResult } from '@/types/searchTypes';

export class DataTransformer {
  transformToSearchResult(item: any, tipo: string): SearchResult {
    console.log(`🔄 DATA TRANSFORMER - ID VALIDATION:`, {
      tipo,
      originalApiId: item.id,
      titulo: item.titulo || item.podcast_titulo || item.title
    });
    
    // ✅ CORREÇÃO CRÍTICA: Validar ID antes de processar
    if (!item.id || item.id === 'undefined' || item.id === 'null' || item.id === '') {
      console.error(`❌ DATA TRANSFORMER - ID INVÁLIDO REJEITADO:`, {
        tipo,
        item: item,
        idProblema: item.id
      });
      return null; // Rejeitar completamente itens sem ID válido
    }
    
    const realId = item.id; // Usar apenas o ID real da API
    
    // ✅ NOVA LÓGICA: Definir tipo baseado no conteúdo específico
    let resourceType: 'titulo' | 'video' | 'podcast';
    if (tipo === 'livro') {
      resourceType = 'titulo';
    } else if (tipo === 'artigos') {
      resourceType = 'titulo'; // Manter como 'titulo' mas com documentType = 'Artigo'
    } else if (tipo === 'aula') {
      resourceType = 'video';
    } else {
      resourceType = 'podcast';
    }

    const baseResult: SearchResult = {
      id: realId, // ✅ CORRIGIDO: Apenas ID real da API
      originalId: String(item.id),
      title: item.titulo || item.podcast_titulo || item.episodio_titulo || item.title || 'Título não disponível',
      author: item.autor || item.canal || item.publicador || 'Link Business School',
      year: this.extractYearFromDate(item.data_publicacao || item.ano || item.data_lancamento),
      description: item.descricao || 'Descrição não disponível',
      subject: this.getSubjectFromCategories(item.categorias) || this.getSubject(tipo),
      type: resourceType,
      thumbnail: item.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
    };

    console.log(`✅ DATA TRANSFORMER - PROCESSAMENTO CONCLUÍDO: ${realId} para ${baseResult.type}`);

    if (tipo === 'livro' || tipo === 'artigos') {
      baseResult.pdfUrl = item.arquivo || item.url;
      baseResult.pages = item.paginas;
      baseResult.language = this.mapLanguageCode(item.language || item.idioma);
      baseResult.documentType = tipo === 'artigos' ? 'Artigo' : (item.tipo_documento || 'Livro');
    } else if (tipo === 'aula') {
      baseResult.embedUrl = item.embed_url;
      baseResult.duration = item.duracao_ms ? this.formatDuration(item.duracao_ms) : undefined;
      baseResult.channel = item.canal || 'Canal desconhecido';
    } else if (tipo === 'podcast') {
      baseResult.duration = item.duracao_ms ? this.formatDuration(item.duracao_ms) : undefined;
      baseResult.embedUrl = item.embed_url;
      baseResult.program = item.podcast_titulo || 'Programa desconhecido';
    }

    return baseResult;
  }

  private extractYearFromDate(dateValue: any): number {
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

  private mapLanguageCode(idioma: string): string {
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

  private getSubjectFromCategories(categorias: string[]): string {
    if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
      return '';
    }
    return categorias[0];
  }

  private getSubject(tipo: string): string {
    switch (tipo) {
      case 'livro': return 'Administração';
      case 'artigos': return 'Administração';
      case 'aula': return 'Empreendedorismo';
      case 'podcast': return 'Negócios';
      default: return 'Geral';
    }
  }

  private formatDuration(durationMs: number): string {
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }
}
