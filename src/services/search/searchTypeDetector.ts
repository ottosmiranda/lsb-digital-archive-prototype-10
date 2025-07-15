
export type SearchType = 'paginated' | 'filtered';

export interface SearchContext {
  query: string;
  resourceTypes: string[];
  hasOtherFilters: boolean;
  page: number;
}

export class SearchTypeDetector {
  static detectSearchType(context: SearchContext): SearchType {
    const { query, resourceTypes, hasOtherFilters } = context;
    
    // Busca com filtros de texto ou múltiplos filtros
    if (query.trim() || hasOtherFilters) {
      return 'filtered';
    }
    
    // Busca paginada: tipos específicos sem query
    return 'paginated';
  }
  
  static getDescription(type: SearchType): string {
    switch (type) {
      case 'paginated': return 'Busca paginada na API externa';
      case 'filtered': return 'Busca filtrada com cache temporário';
      default: return 'Tipo desconhecido';
    }
  }
}
