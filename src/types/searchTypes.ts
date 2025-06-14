export interface SearchResult {
  id: number;
  title: string;
  type: 'video' | 'titulo' | 'podcast';
  author: string;
  duration?: string;
  pages?: number;
  thumbnail?: string;
  description: string;
  year: number;
  subject: string;
  pais?: string;
  documentType?: string;
}

export interface SearchFilters {
  resourceType: string[];
  subject: string[];
  author: string;
  year: string;
  duration: string;
  language: string[];
  documentType: string[];
}

export interface DataValidationError {
  field: string;
  message: string;
  item: any;
}
