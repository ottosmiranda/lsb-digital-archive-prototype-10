
export interface Resource {
  id: number;
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
}
