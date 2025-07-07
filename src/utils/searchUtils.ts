
import { SearchResult, SearchFilters } from '@/types/searchTypes';

// Função para converter duração em minutos totais
export const parseDurationToMinutes = (duration: string): number => {
  if (!duration) return 0;
  
  let totalMinutes = 0;
  const durationStr = duration.toLowerCase().trim();
  
  // Extrair horas
  const hoursMatch = durationStr.match(/(\d+)h/);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1]) * 60;
  }
  
  // Extrair minutos
  const minutesMatch = durationStr.match(/(\d+)m/);
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1]);
  }
  
  // Se só tem número (assumir minutos)
  if (!hoursMatch && !minutesMatch) {
    const numberMatch = durationStr.match(/(\d+)/);
    if (numberMatch) {
      totalMinutes = parseInt(numberMatch[1]);
    }
  }
  
  return totalMinutes;
};

// Função para aplicar filtro de duração (consistente com backend)
export const matchesDurationFilter = (itemDuration: string, filterDuration: string): boolean => {
  if (!itemDuration || !filterDuration) return true;
  
  const minutes = parseDurationToMinutes(itemDuration);
  
  switch (filterDuration.toLowerCase()) {
    case 'short':
      return minutes > 0 && minutes <= 10;
    case 'medium':
      return minutes > 10 && minutes <= 30;
    case 'long':
      return minutes > 30;
    default:
      return true;
  }
};

// Helper function to normalize text for better Portuguese search
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove accents
};

// Extract unique authors with counts from search results
export const extractAuthorsFromResults = (results: SearchResult[]): { name: string; count: number }[] => {
  const authorMap = new Map<string, number>();
  
  results.forEach(result => {
    if (result.author && result.author.trim() !== '' && 
        result.author !== 'Autor desconhecido' && 
        result.author !== 'Canal desconhecido' && 
        result.author !== 'Publicador desconhecido') {
      const currentCount = authorMap.get(result.author) || 0;
      authorMap.set(result.author, currentCount + 1);
    }
  });
  
  return Array.from(authorMap.entries()).map(([name, count]) => ({
    name,
    count
  }));
};

// Mapping for pais (country code) to language.
// This is a simplified example. A more comprehensive mapping might be needed.
const countryToLanguage: Record<string, string> = {
  'BR': 'Português',
  'PT': 'Português',
  'US': 'Inglês',
  'GB': 'Inglês',
  'CA': 'Inglês', // Assuming English for Canada for simplicity
  'AU': 'Inglês',
  'ES': 'Espanhol',
  'MX': 'Espanhol',
  'AR': 'Espanhol',
  // Add more mappings as needed
};

export const filterResults = (
  data: SearchResult[],
  query: string,
  filters: SearchFilters
): SearchResult[] => {
  return data.filter(item => {
    // Query filter
    if (query.trim()) {
      const searchText = `${item.title} ${item.author} ${item.description}`.toLowerCase();
      const queryLower = query.toLowerCase();
      if (!searchText.includes(queryLower)) {
        return false;
      }
    }

    // Resource type filter - CORRIGIDO: Tratar 'all' como "sem filtros de tipo"
    if (filters.resourceType.length > 0 && !isShowingAllResourceTypes(filters.resourceType)) {
      if (!filters.resourceType.includes(item.type)) {
        return false;
      }
    }

    // Subject filter
    if (filters.subject.length > 0) {
      const matchesSubject = filters.subject.some(filterSubject =>
        item.subject.toLowerCase().includes(filterSubject.toLowerCase())
      );
      if (!matchesSubject) {
        return false;
      }
    }

    // Author filter
    if (filters.author.length > 0) {
      const matchesAuthor = filters.author.some(filterAuthor =>
        item.author.toLowerCase().includes(filterAuthor.toLowerCase())
      );
      if (!matchesAuthor) {
        return false;
      }
    }

    // Year filter
    if (filters.year.trim()) {
      const filterYear = parseInt(filters.year);
      if (!isNaN(filterYear) && item.year !== filterYear) {
        return false;
      }
    }

    // Duration filter
    if (filters.duration.trim()) {
      if (!matchesDurationFilter(item.duration, filters.duration)) {
        return false;
      }
    }

    // Language filter
    if (filters.language.length > 0) {
      const matchesLanguage = filters.language.some(filterLang =>
        item.language?.toLowerCase().includes(filterLang.toLowerCase()) ||
        item.pais?.toLowerCase().includes(filterLang.toLowerCase())
      );
      if (!matchesLanguage) {
        return false;
      }
    }

    return true;
  });
};

export const sortResults = (results: SearchResult[], sortBy: string, query?: string): SearchResult[] => {
  const sortedResults = [...results];
  
  switch (sortBy) {
    case 'relevance':
      if (query?.trim()) {
        const queryLower = query.toLowerCase();
        return sortedResults.sort((a, b) => {
          const aTitle = a.title.toLowerCase();
          const bTitle = b.title.toLowerCase();
          const aStartsWithQuery = aTitle.startsWith(queryLower);
          const bStartsWithQuery = bTitle.startsWith(queryLower);
          
          if (aStartsWithQuery && !bStartsWithQuery) return -1;
          if (!aStartsWithQuery && bStartsWithQuery) return 1;
          
          return aTitle.localeCompare(bTitle);
        });
      }
      return sortedResults.sort((a, b) => a.title.localeCompare(b.title));
      
    case 'title':
      return sortedResults.sort((a, b) => a.title.localeCompare(b.title));
      
    case 'recent':
      return sortedResults.sort((a, b) => b.year - a.year);
      
    case 'accessed':
      const typeOrder = { 'podcast': 3, 'video': 2, 'titulo': 1 };
      return sortedResults.sort((a, b) => {
        const orderA = typeOrder[a.type as keyof typeof typeOrder] || 0;
        const orderB = typeOrder[b.type as keyof typeof typeOrder] || 0;
        if (orderA !== orderB) return orderB - orderA;
        return a.title.localeCompare(b.title);
      });
      
    default:
      return sortedResults;
  }
};

// NOVA FUNÇÃO: Verifica se está mostrando todos os tipos de recursos
export const isShowingAllResourceTypes = (resourceTypes: string[]): boolean => {
  return resourceTypes.length === 0 || resourceTypes.includes('all');
};

// NOVA FUNÇÃO: Verifica se deve executar busca (diferente de ter filtros ativos)
export const shouldPerformSearch = (query: string, filters: SearchFilters): boolean => {
  console.log('🔍 Checking if should perform search:', { 
    query: query.trim(), 
    filters,
    hasQuery: !!query.trim(),
    hasNonResourceTypeFilters: hasNonResourceTypeFilters(filters),
    isShowingAll: isShowingAllResourceTypes(filters.resourceType)
  });
  
  // Sempre buscar se há query
  if (query.trim()) {
    return true;
  }
  
  // Sempre buscar se está mostrando "Todos" (para listar todos os recursos)
  if (isShowingAllResourceTypes(filters.resourceType)) {
    return true;
  }
  
  // Buscar se há filtros específicos de tipo de recurso
  if (filters.resourceType.length > 0) {
    return true;
  }
  
  // Buscar se há outros filtros
  if (hasNonResourceTypeFilters(filters)) {
    return true;
  }
  
  return false;
};

// NOVA FUNÇÃO: Verifica se há filtros ativos além do tipo de recurso
export const hasNonResourceTypeFilters = (filters: SearchFilters): boolean => {
  return (
    filters.subject.length > 0 ||
    filters.author.length > 0 ||
    filters.year !== '' ||
    filters.duration !== '' ||
    filters.language.length > 0 ||
    filters.documentType.length > 0
  );
};

// REFATORADA: Função para verificar se há filtros ativos (para UI)
export const checkHasActiveFilters = (filters: SearchFilters): boolean => {
  console.log('🔍 Checking active filters for UI:', { 
    filters,
    hasResourceType: filters.resourceType.length > 0,
    isShowingAll: isShowingAllResourceTypes(filters.resourceType),
    hasOtherFilters: hasNonResourceTypeFilters(filters)
  });
  
  // Para UI, considerar que "Todos" não é um filtro ativo
  const hasResourceTypeFilter = filters.resourceType.length > 0 && !isShowingAllResourceTypes(filters.resourceType);
  
  return (
    hasResourceTypeFilter ||
    hasNonResourceTypeFilters(filters)
  );
};
