
import { Resource } from "@/types/resourceTypes";

export function getTypeLabel(type: string) {
  switch (type) {
    case 'video': return 'Vídeo';
    case 'titulo': return 'Livro';
    case 'podcast': return 'Podcast';
    default: return 'Recurso';
  }
}

export function getTypeBadgeColor(type: string) {
  switch (type) {
    case 'video': return 'bg-red-100 text-red-800';
    case 'titulo': return 'bg-blue-100 text-blue-800';
    case 'podcast': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
