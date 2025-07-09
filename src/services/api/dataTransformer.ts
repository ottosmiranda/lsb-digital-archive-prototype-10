
import { SearchResult } from '@/types/searchTypes';

export class DataTransformer {
  transformToSearchResult(item: any, tipo: string): SearchResult {
    console.log(`🔄 DATA TRANSFORMER - ID CORRECTION:`, {
      tipo,
      originalApiId: item.id,
      titulo: item.titulo || item.podcast_titulo || item.title
    });
    
    // CORREÇÃO CRÍTICA: Usar ID real da API como ID principal
    const realId = String(item.id || item.episodio_id || item.podcast_id || Math.floor(Math.random() * 10000) + 1000);
    
    const baseResult: SearchResult = {
      id: realId, // ✅ CORRIGIDO: ID real da API como ID principal
      originalId: String(item.id || item.episodio_id || item.podcast_id), // Backup do ID original
      title: item.titulo || item.podcast_titulo || item.episodio_titulo || item.title || 'Título não disponível',
      author: item.autor || item.canal || item.publicador || 'Link Business School',
      year: item.ano || (item.data_lancamento ? new Date(item.data_lancamento).getFullYear() : new Date().getFullYear()),
      description: item.descricao || 'Descrição não disponível',
      subject: this.getSubjectFromCategories(item.categorias) || this.getSubject(tipo),
      type: tipo === 'livro' ? 'titulo' : tipo === 'aula' ? 'video' : 'podcast' as 'titulo' | 'video' | 'podcast',
      thumbnail: item.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png'
    };

    console.log(`✅ DATA TRANSFORMER - ID REAL USADO: ${realId} para ${baseResult.type}`);

    if (tipo === 'livro') {
      baseResult.pdfUrl = item.arquivo;
      baseResult.pages = item.paginas;
      baseResult.language = item.language;
      baseResult.documentType = item.tipo_documento || 'Livro';
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

  private getSubjectFromCategories(categorias: string[]): string {
    if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
      return '';
    }
    return categorias[0];
  }

  private getSubject(tipo: string): string {
    switch (tipo) {
      case 'livro': return 'Administração';
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
