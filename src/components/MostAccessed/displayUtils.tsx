
import { Book, Video, Headphones, TrendingUp } from 'lucide-react';

export const getTypeIcon = (type: string) => {
  switch (type) {
    case 'titulo': return <Book className="h-4 w-4" />;
    case 'video': return <Video className="h-4 w-4" />;
    case 'podcast': return <Headphones className="h-4 w-4" />;
    default: return <Book className="h-4 w-4" />;
  }
};

export const getTypeColor = (type: string): string => {
  switch (type) {
    case 'titulo': return 'bg-blue-100 text-blue-800';
    case 'video': return 'bg-red-100 text-red-800';
    case 'podcast': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'titulo': return 'Livro';
    case 'video': return 'Vídeo';
    case 'podcast': return 'Podcast';
    default: return 'Conteúdo';
  }
};

export const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
    case 'down': return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
    default: return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
  }
};
