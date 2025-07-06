
export interface SearchResult {
  id: number;
  originalId?: string; // Add originalId for UUIDs from the API
  title: string;
  type: 'video' | 'titulo' | 'podcast';
  author: string;
  duration?: string;
  pages?: number;
  episodes?: string | number;
  thumbnail?: string;
  description: string;
  year: number;
  subject: string;
  embedUrl?: string;
  pdfUrl?: string;
  documentType?: string;
  pais?: string; // Add country code for language filtering
  language?: string; // Add language field for books
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

export interface FilterCounts {
  resourceType: Record<string, number>;
  subject: Record<string, number>;
  language: Record<string, number>;
  documentType: Record<string, number>;
}
