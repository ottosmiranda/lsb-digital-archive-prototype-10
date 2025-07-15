
export type SearchType = 'paginated' | 'global' | 'filtered';

export interface SearchContext {
  query: string;
  resourceTypes: string[];
  hasOtherFilters: boolean;
  page: number;
}

export class SearchTypeDetector {
  static detectSearchType(context: SearchContext): SearchType {
    const { query, resourceTypes, hasOtherFilters } = context;
    
    // Busca global: sem filtros de tipo, query ou outros filtros
    const isGlobalSearch = resourceTypes.length === 0 && !query.trim() && !hasOtherFilters;
    
    if (isGlobalSearch) {
      return 'global';
    }
    
    // Busca com filtros de texto ou múltiplos filtros
    if (query.trim() || hasOtherFilters) {
      return 'filtered';
    }
    
    // Busca paginada: tipos específicos sem query
    return 'paginated';
  }
  
  static getDescription(type: SearchType): string {
    switch (type) {
      case 'global': return 'Busca global com cache de longa duração';
      case 'paginated': return 'Busca paginada na API externa';
      case 'filtered': return 'Busca filtrada com cache temporário';
      default: return 'Tipo desconhecido';
    }
  }
}
