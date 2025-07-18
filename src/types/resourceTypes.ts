
export interface Resource {
  id: string; // Changed from number to string to match real API IDs
  originalId?: string; // ID original da API para vídeos e outros recursos
  title: string;
  type: 'video' | 'titulo' | 'podcast';
  author: string;
  duration?: string;
  pages?: number;
  episodes?: number;
  thumbnail?: string;
  description: string;
  year: number;
  subject: string;
  fullDescription?: string;
  isbn?: string;
  publisher?: string;
  edition?: string;
  language?: string;
  tags?: string[];
  tableOfContents?: string[];
  transcript?: boolean;
  embedUrl?: string;
  pdfUrl?: string; // Add pdfUrl property for books
  documentType?: string; // Add documentType property for books
  categories?: string[]; // Add categories array property
  podcast_titulo?: string; // Add podcast_titulo property for podcasts
}
