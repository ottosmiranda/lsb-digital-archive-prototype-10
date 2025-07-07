
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
  program?: string; // Nome do programa (para podcasts)
  channel?: string; // Nome do canal (para vídeos)
}

export interface SearchFilters {
  resourceType: string[];
  subject: string[];
  author: string[]; // CORRIGIDO: Múltiplos autores
  year: string;
  duration: string;
  language: string[];
  documentType: string[];
  program: string[]; // NOVO: Filtro de programa para podcasts
  channel: string[]; // NOVO: Filtro de canal para vídeos
}

export interface FilterCounts {
  resourceType: Record<string, number>;
  subject: Record<string, number>;
  language: Record<string, number>;
  documentType: Record<string, number>;
  program: Record<string, number>; // NOVO: Contagem de programas
  channel: Record<string, number>; // NOVO: Contagem de canais
}
