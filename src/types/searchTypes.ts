
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
  year: number | null; // CORRIGIDO: Permitir null para anos inválidos
  subject: string;
  embedUrl?: string;
  pdfUrl?: string;
  documentType?: string;
  pais?: string; // Add country code for language filtering
  language?: string; // Add language field for books
  program?: string; // Add program field for podcasts (podcast_titulo)
  channel?: string; // Add channel field for videos (canal)
}

export interface SearchFilters {
  resourceType: string[];
  subject: string[];
  author: string[]; // CORRIGIDO: Múltiplos autores como array
  year: string;
  duration: string;
  language: string[];
  documentType: string[];
  program: string[]; // Add program filter for podcasts
  channel: string[]; // Add channel filter for videos
}

export interface FilterCounts {
  resourceType: Record<string, number>;
  subject: Record<string, number>;
  language: Record<string, number>;
  documentType: Record<string, number>;
}
