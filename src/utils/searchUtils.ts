import { SearchResult, SearchFilters } from '@/types/searchTypes';

// Helper function to normalize text for better Portuguese search
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove accents
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
  results: SearchResult[], 
  searchQuery: string, 
  currentFilters: SearchFilters
): SearchResult[] => {
  return results.filter(item => {
    if (searchQuery) {
      const queryNormalized = normalizeText(searchQuery);
      const titleNormalized = normalizeText(item.title);
      const descriptionNormalized = normalizeText(item.description);
      const authorNormalized = normalizeText(item.author);
      const subjectNormalized = normalizeText(item.subject);
      
      const matchesQuery = titleNormalized.includes(queryNormalized) ||
                         descriptionNormalized.includes(queryNormalized) ||
                         authorNormalized.includes(queryNormalized) ||
                         subjectNormalized.includes(queryNormalized);
      if (!matchesQuery) return false;
    }

    // "Tipo de Item" filter (uses resourceType)
    if (currentFilters.resourceType.length > 0) {
      if (!currentFilters.resourceType.includes(item.type)) return false;
    }

    if (currentFilters.subject.length > 0) {
      if (!currentFilters.subject.includes(item.subject)) return false;
    }

    if (currentFilters.author) {
      const authorNormalized = normalizeText(item.author);
      const filterAuthorNormalized = normalizeText(currentFilters.author);
      if (!authorNormalized.includes(filterAuthorNormalized)) return false;
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

    // "Idioma" filter
    if (currentFilters.language.length > 0) {
      if (!item.pais) return false; // Item has no country information
      const itemLanguage = countryToLanguage[item.pais.toUpperCase()];
      if (!itemLanguage || !currentFilters.language.includes(itemLanguage)) {
        return false;
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
      // Placeholder: Replace with actual access count if available
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
      // Basic relevance: prioritize title matches, then factor in year.
      // This could be made more sophisticated.
      return resultsToSort.sort((a, b) => {
        const queryNormalized = normalizeText(query);
        const aTitleNormalized = normalizeText(a.title);
        const bTitleNormalized = normalizeText(b.title);
        
        // Score for title match
        const aTitleMatchScore = aTitleNormalized.includes(queryNormalized) ? 2 : 0;
        const bTitleMatchScore = bTitleNormalized.includes(queryNormalized) ? 2 : 0;

        // Simple recency score (newer is slightly better)
        // Normalize year to a small number to avoid overpowering title match
        const currentYear = new Date().getFullYear();
        const aRecencyScore = (a.year - (currentYear - 20)) / 20; // Score from 0 to 1 for last 20 years
        const bRecencyScore = (b.year - (currentYear - 20)) / 20;

        const aScore = aTitleMatchScore + Math.max(0, Math.min(1, aRecencyScore));
        const bScore = bTitleMatchScore + Math.max(0, Math.min(1, bRecencyScore));
        
        if (bScore !== aScore) {
          return bScore - aScore;
        }
        // Fallback to alphabetical by title if scores are equal
        return a.title.localeCompare(b.title);
      });
  }
};

export const checkHasActiveFilters = (filterObj: SearchFilters): boolean => {
  return filterObj.resourceType.length > 0 || 
         filterObj.subject.length > 0 || 
         Boolean(filterObj.author) || 
         Boolean(filterObj.year) || 
         Boolean(filterObj.duration) ||
         filterObj.language.length > 0; // Added language filter
};
