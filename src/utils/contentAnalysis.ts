
import { SearchResult, SearchFilters } from '@/types/searchTypes';

export interface ContentStats {
  hasBooks: boolean;
  hasVideos: boolean;
  hasPodcasts: boolean;
  totalItems: number;
  bookCount: number;
  videoCount: number;
  podcastCount: number;
  availableLanguages: string[];
  availableDocumentTypes: string[];
  hasItemsWithDuration: boolean;
  hasItemsWithPages: boolean;
}

export interface FilterRelevance {
  subject: boolean;
  author: boolean;
  language: boolean;
  documentType: boolean;
  year: boolean;
  duration: boolean;
  pages: boolean;
}

export const analyzeContent = (results: SearchResult[]): ContentStats => {
  const stats: ContentStats = {
    hasBooks: false,
    hasVideos: false,
    hasPodcasts: false,
    totalItems: results.length,
    bookCount: 0,
    videoCount: 0,
    podcastCount: 0,
    availableLanguages: [],
    availableDocumentTypes: [],
    hasItemsWithDuration: false,
    hasItemsWithPages: false,
  };

  const languageSet = new Set<string>();
  const documentTypeSet = new Set<string>();

  results.forEach(item => {
    // Contagem por tipo
    switch (item.type) {
      case 'titulo':
        stats.hasBooks = true;
        stats.bookCount++;
        break;
      case 'video':
        stats.hasVideos = true;
        stats.videoCount++;
        break;
      case 'podcast':
        stats.hasPodcasts = true;
        stats.podcastCount++;
        break;
    }

    // Detectar idiomas disponíveis
    if (item.language) {
      languageSet.add(item.language);
    }
    if (item.pais) {
      // Mapear país para idioma
      const countryToLanguage: Record<string, string> = {
        'BR': 'Português',
        'PT': 'Português',
        'US': 'English',
        'GB': 'English',
        'ES': 'Espanhol',
      };
      const language = countryToLanguage[item.pais.toUpperCase()];
      if (language) {
        languageSet.add(language);
      }
    }

    // Tipos de documento (apenas para livros)
    if (item.type === 'titulo' && item.documentType) {
      documentTypeSet.add(item.documentType);
    }

    // Verificar se há itens com duração (vídeos e podcasts)
    if (item.duration && (item.type === 'video' || item.type === 'podcast')) {
      stats.hasItemsWithDuration = true;
    }

    // Verificar se há itens com páginas (livros)
    if (item.pages && item.type === 'titulo') {
      stats.hasItemsWithPages = true;
    }
  });

  stats.availableLanguages = Array.from(languageSet).sort();
  stats.availableDocumentTypes = Array.from(documentTypeSet).sort();

  return stats;
};

export const determineFilterRelevance = (
  stats: ContentStats,
  activeContentType: string
): FilterRelevance => {
  // Se activeContentType for específico, usar lógica específica
  if (activeContentType === 'titulo') {
    return {
      subject: true,
      author: true,
      language: stats.availableLanguages.length > 0,
      documentType: stats.availableDocumentTypes.length > 0,
      year: true,
      duration: false,
      pages: stats.hasItemsWithPages,
    };
  }

  if (activeContentType === 'video') {
    return {
      subject: true,
      author: true,
      language: stats.availableLanguages.length > 0,
      documentType: false,
      year: true,
      duration: stats.hasItemsWithDuration,
      pages: false,
    };
  }

  if (activeContentType === 'podcast') {
    return {
      subject: true,
      author: true,
      language: stats.availableLanguages.length > 0,
      documentType: false,
      year: true,
      duration: stats.hasItemsWithDuration,
      pages: false,
    };
  }

  // Para 'all' ou quando há múltiplos tipos, mostrar filtros baseados no conteúdo presente
  return {
    subject: true,
    author: true,
    language: stats.availableLanguages.length > 0,
    documentType: stats.hasBooks && stats.availableDocumentTypes.length > 0,
    year: true,
    duration: (stats.hasVideos || stats.hasPodcasts) && stats.hasItemsWithDuration,
    pages: stats.hasBooks && stats.hasItemsWithPages,
  };
};

export const getFilterPriority = (
  stats: ContentStats,
  activeContentType: string
): Record<string, number> => {
  const priorities: Record<string, number> = {};

  // Prioridades baseadas no tipo de conteúdo ativo
  if (activeContentType === 'titulo') {
    priorities.subject = 1;
    priorities.documentType = 2;
    priorities.language = 3;
    priorities.author = 4;
    priorities.pages = 5;
    priorities.year = 6;
  } else if (activeContentType === 'video' || activeContentType === 'podcast') {
    priorities.subject = 1;
    priorities.duration = 2;
    priorities.language = 3;
    priorities.author = 4;
    priorities.year = 5;
  } else {
    // Para 'all', priorizar baseado na quantidade de cada tipo
    priorities.subject = 1;
    
    if (stats.bookCount > stats.videoCount + stats.podcastCount) {
      priorities.documentType = 2;
      priorities.duration = 4;
    } else {
      priorities.duration = 2;
      priorities.documentType = 4;
    }
    
    priorities.language = 3;
    priorities.author = 5;
    priorities.year = 6;
    priorities.pages = 7;
  }

  return priorities;
};
