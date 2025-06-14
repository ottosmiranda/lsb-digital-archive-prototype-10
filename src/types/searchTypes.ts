
export interface SearchResult {
  id: number;
  title: string;
  type: 'video' | 'titulo' | 'podcast';
  author: string;
  duration?: string;
  pages?: number;
  episodes?: string; // Add episodes property for podcasts
  thumbnail?: string;
  description: string;
  year: number;
  subject: string;
  pais?: string;
  documentType?: string;
  embedUrl?: string; // Add embedUrl property for podcasts
}

export interface SearchFilters {
  resourceType: string[]; // Keep for backward compatibility with tabs
  subject: string[];
  author: string;
  year: string;
  duration: string;
  language: string[];
  documentType: string[]; // Academic document types
}

export interface DataValidationError {
  field: string;
  message: string;
  item: any;
}
