
import { SearchResult, SearchFilters } from '@/types/searchTypes';

export const filterResults = (
  results: SearchResult[], 
  searchQuery: string, 
  currentFilters: SearchFilters
): SearchResult[] => {
  return results.filter(item => {
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      const matchesQuery = item.title.toLowerCase().includes(queryLower) ||
                         item.description.toLowerCase().includes(queryLower) ||
                         item.author.toLowerCase().includes(queryLower) ||
                         item.subject.toLowerCase().includes(queryLower);
      if (!matchesQuery) return false;
    }

    if (currentFilters.resourceType.length > 0) {
      if (!currentFilters.resourceType.includes(item.type)) return false;
    }

    if (currentFilters.subject.length > 0) {
      if (!currentFilters.subject.includes(item.subject)) return false;
    }

    if (currentFilters.author) {
      const authorLower = currentFilters.author.toLowerCase();
      if (!item.author.toLowerCase().includes(authorLower)) return false;
    }

    if (currentFilters.year) {
      if (item.year.toString() !== currentFilters.year) return false;
    }

    if (currentFilters.duration && (item.type === 'video' || item.type === 'podcast')) {
      const duration = item.duration;
      if (duration) {
        const [minutes] = duration.split(':').map(Number);
        switch (currentFilters.duration) {
          case 'short':
            if (minutes > 10) return false;
            break;
          case 'medium':
            if (minutes <= 10 || minutes > 30) return false;
            break;
          case 'long':
            if (minutes <= 30) return false;
            break;
        }
      }
    }

    return true;
  });
};

export const sortResults = (resultsToSort: SearchResult[], sortType: string, query: string = ''): SearchResult[] => {
  switch (sortType) {
    case 'recent':
      return resultsToSort.sort((a, b) => b.year - a.year);
    
    case 'accessed':
      return resultsToSort.sort(() => Math.random() - 0.5);
    
    case 'type':
      const typeOrder = { 'video': 0, 'podcast': 1, 'titulo': 2 };
      return resultsToSort.sort((a, b) => {
        const aOrder = typeOrder[a.type] ?? 3;
        const bOrder = typeOrder[b.type] ?? 3;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.title.localeCompare(b.title);
      });
    
    case 'relevance':
    default:
      return resultsToSort.sort((a, b) => {
        const queryLower = query.toLowerCase();
        const aRelevance = a.title.toLowerCase().includes(queryLower) ? 2 : 0;
        const bRelevance = b.title.toLowerCase().includes(queryLower) ? 2 : 0;
        
        const aScore = aRelevance + (a.year / 1000);
        const bScore = bRelevance + (b.year / 1000);
        
        return bScore - aScore;
      });
  }
};

export const checkHasActiveFilters = (filterObj: SearchFilters): boolean => {
  return filterObj.resourceType.length > 0 || 
         filterObj.subject.length > 0 || 
         Boolean(filterObj.author) || 
         Boolean(filterObj.year) || 
         Boolean(filterObj.duration);
};
