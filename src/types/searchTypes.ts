
export interface SearchResult {
  id: string; // ✅ CORRIGIDO: Agora sempre string (era number antes)
  originalId?: string;
  title: string;
  type: 'video' | 'titulo' | 'podcast';
  author: string;
  description: string;
  year: number;
  subject: string;
  thumbnail?: string;
  duration?: string;
  pages?: number;
  episodes?: number;
  embedUrl?: string;
  pdfUrl?: string;
  documentType?: string;
  language?: string;
  program?: string;
  channel?: string;
  categories?: string[];
}

export interface SearchFilters {
  resourceType: string[];
  subject: string[];
  author: string[];
  year: string;
  duration: string;
  language: string[];
  documentType: string[];
  program: string[];
  channel: string[];
}

export interface SearchPagination {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SearchInfo {
  query: string;
  appliedFilters: SearchFilters;
  sortBy: string;
}
