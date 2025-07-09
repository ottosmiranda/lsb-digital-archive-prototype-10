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
  availableSubjects: string[];
  hasItemsWithDuration: boolean;
  hasItemsWithPages: boolean;
}

export interface FilterRelevance {
  subject: boolean;
  author: boolean;
  language: boolean;
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
    availableSubjects: [],
    hasItemsWithDuration: false,
    hasItemsWithPages: false,
  };

  const languageSet = new Set<string>();
  const subjectSet = new Set<string>();

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

    // ✅ DEBUG: Verificar idiomas detectados no frontend
    if (item.language && item.language.trim() !== '' && item.language !== 'Não especificado') {
      console.log(`🌐 FRONTEND DEBUG: Language detected: "${item.language}" for ${item.type}: "${item.title.substring(0, 30)}..."`);
      languageSet.add(item.language);
      
      // ✅ DEBUG CRÍTICO: Verificar se "Und" está chegando ao frontend
      if (item.language === 'Und') {
        console.error(`🚨 PROBLEMA DETECTADO: "Und" chegou ao frontend! Item: "${item.title.substring(0, 30)}..."`);
      }
      if (item.language === 'Indefinido') {
        console.log(`✅ CORRETO: "Indefinido" detectado no frontend! Item: "${item.title.substring(0, 30)}..."`);
      }
    }
    
    // ✅ MANTIDO: Mapear país para idioma (para vídeos antigos sem idioma)
    if (item.pais && !item.language) {
      const countryToLanguage: Record<string, string> = {
        'BR': 'Português',
        'PT': 'Português', 
        'US': 'Inglês',
        'GB': 'Inglês',
        'ES': 'Espanhol',
        'FR': 'Francês',
        'IT': 'Italiano',
        'DE': 'Alemão',
      };
      const language = countryToLanguage[item.pais.toUpperCase()];
      if (language) {
        languageSet.add(language);
        console.log(`🌐 Language from country: ${language} (${item.pais}) for ${item.type}`);
      }
    }

    // ✅ CORRIGIDO: Detectar assuntos incluindo categorias de podcasts
    if (item.subject && item.subject.trim()) {
      subjectSet.add(item.subject.trim());
    }
    
    // ✅ ADICIONADO: Incluir todas as categorias de podcasts nos assuntos disponíveis
    if (item.type === 'podcast' && item.categories && Array.isArray(item.categories)) {
      item.categories.forEach(category => {
        if (category && category.trim()) {
          const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);
          subjectSet.add(capitalizedCategory);
        }
      });
    }

    // Verificar se há itens com duração
    if (item.duration && (item.type === 'video' || item.type === 'podcast')) {
      stats.hasItemsWithDuration = true;
    }

    // Verificar se há itens com páginas
    if (item.pages && item.type === 'titulo') {
      stats.hasItemsWithPages = true;
    }
  });

  stats.availableLanguages = Array.from(languageSet).sort();
  stats.availableSubjects = Array.from(subjectSet).sort();

  console.log(`📊 Content Analysis Results:`, {
    languages: stats.availableLanguages,
    videoCount: stats.videoCount,
    bookCount: stats.bookCount,
    podcastCount: stats.podcastCount
  });

  // ✅ DEBUG CRÍTICO: Verificar se "Und" está nas languages disponíveis
  if (stats.availableLanguages.includes('Und')) {
    console.error(`🚨 PROBLEMA CRÍTICO: "Und" está nas availableLanguages!`, stats.availableLanguages);
  }
  if (stats.availableLanguages.includes('Indefinido')) {
    console.log(`✅ CORRETO: "Indefinido" está nas availableLanguages!`, stats.availableLanguages);
  }

  return stats;
};

export const determineFilterRelevance = (
  stats: ContentStats,
  activeContentType: string
): FilterRelevance => {
  // Se activeContentType for específico, usar lógica específica
  if (activeContentType === 'titulo') {
    return {
      subject: stats.availableSubjects.length > 0,
      author: true,
      language: stats.availableLanguages.length > 0,
      year: true,
      duration: false,
      pages: stats.hasItemsWithPages,
    };
  }

  if (activeContentType === 'video') {
    return {
      subject: stats.availableSubjects.length > 0,
      author: true,
      language: stats.availableLanguages.length > 0, // ✅ CORRIGIDO: Vídeos agora têm idioma
      year: true,
      duration: stats.hasItemsWithDuration,
      pages: false,
    };
  }

  if (activeContentType === 'podcast') {
    return {
      subject: stats.availableSubjects.length > 0,
      author: true,
      language: false, // Podcasts ainda não têm idioma na API
      year: true,
      duration: stats.hasItemsWithDuration,
      pages: false,
    };
  }

  // Para 'all', incluir todas as opções
  return {
    subject: stats.availableSubjects.length > 0,
    author: true,
    language: stats.availableLanguages.length > 0, // ✅ Inclui idiomas de vídeos e livros
    year: stats.hasBooks || stats.hasPodcasts || stats.hasVideos,
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
    priorities.language = 2;
    priorities.author = 3;
    priorities.pages = 4;
    priorities.year = 5;
  } else if (activeContentType === 'video') {
    priorities.subject = 1;
    priorities.duration = 2;
    priorities.language = 3;
    priorities.author = 4;
    priorities.year = 5;
  } else if (activeContentType === 'podcast') {
    priorities.subject = 1; // ✅ CORRIGIDO: Assunto agora é prioridade para podcasts
    priorities.author = 2;
    priorities.duration = 3;
    priorities.year = 4;
  } else {
    // Para 'all', priorizar baseado na quantidade de cada tipo
    priorities.subject = 1;
    
    if (stats.bookCount > stats.videoCount + stats.podcastCount) {
      priorities.language = 2;
      priorities.duration = 4;
    } else {
      priorities.duration = 2;
      priorities.language = 4;
    }
    
    priorities.author = 3;
    priorities.year = 5;
    priorities.pages = 6;
  }

  return priorities;
};
