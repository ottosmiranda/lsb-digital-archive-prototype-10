import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchFilters } from '@/types/searchTypes';

interface FilterChipsProps {
  filters: SearchFilters;
  onRemoveFilter: (filterType: keyof SearchFilters, value?: string) => void;
  onClearAll: () => void;
}

const FilterChips = ({ filters, onRemoveFilter, onClearAll }: FilterChipsProps) => {
  const hasFilters = 
    filters.resourceType.length > 0 ||
    filters.subject.length > 0 ||
    filters.author ||
    filters.year ||
    filters.duration ||
    filters.language.length > 0 ||
    filters.documentType.length > 0;

  if (!hasFilters) return null;

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case 'all': return 'Todos os tipos';
      case 'titulo': return 'Livros';
      case 'video': return 'Vídeos';
      case 'podcast': return 'Podcasts';
      default: return type;
    }
  };

  const getDurationLabel = (duration: string) => {
    switch (duration) {
      case 'short': return 'Curta (até 10min)';
      case 'medium': return 'Média (10-30min)';
      case 'long': return 'Longa (30min+)';
      default: return duration;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-sm text-gray-600 font-medium">Filtros ativos:</span>
      
      {/* Resource Type filters */}
      {filters.resourceType.map(type => (
        <Badge key={type} variant="secondary" className="flex items-center gap-1">
          {getResourceTypeLabel(type)}
          <button
            onClick={() => onRemoveFilter('resourceType', type)}
            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Subject filters */}
      {filters.subject.map(subject => (
        <Badge key={subject} variant="secondary" className="flex items-center gap-1">
          {subject}
          <button
            onClick={() => onRemoveFilter('subject', subject)}
            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Author filter */}
      {filters.author && (
        <Badge variant="secondary" className="flex items-center gap-1">
          Autor: {filters.author}
          <button
            onClick={() => onRemoveFilter('author')}
            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* Year filter */}
      {filters.year && (
        <Badge variant="secondary" className="flex items-center gap-1">
          Ano: {filters.year}
          <button
            onClick={() => onRemoveFilter('year')}
            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* Duration filter */}
      {filters.duration && (
        <Badge variant="secondary" className="flex items-center gap-1">
          Duração: {getDurationLabel(filters.duration)}
          <button
            onClick={() => onRemoveFilter('duration')}
            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* Language filters */}
      {filters.language.map(language => (
        <Badge key={language} variant="secondary" className="flex items-center gap-1">
          Idioma: {language}
          <button
            onClick={() => onRemoveFilter('language', language)}
            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Document Type filters */}
      {filters.documentType.map(docType => (
        <Badge key={docType} variant="secondary" className="flex items-center gap-1">
          Tipo de documento: {docType}
          <button
            onClick={() => onRemoveFilter('documentType', docType)}
            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Clear all button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-gray-500 hover:text-gray-700 ml-2"
      >
        Limpar todos
      </Button>
    </div>
  );
};

export default FilterChips;
