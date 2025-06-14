
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
  const getItemTypeLabel = (value: string) => {
    const labels: { [key: string]: string } = {
      'titulo': 'Tipo: Livro/Artigo',
      'video': 'Tipo: Vídeo',
      'podcast': 'Tipo: Podcast'
    };
    return labels[value] || value;
  };

  const getDurationLabel = (value: string) => {
    const labels: { [key: string]: string } = {
      'short': 'Duração: Até 10 min',
      'medium': 'Duração: 10-30 min',
      'long': 'Duração: 30+ min'
    };
    return labels[value] || value;
  };

  const getLanguageLabel = (value: string) => {
    return `Idioma: ${value}`;
  };

  const getDocumentTypeLabel = (value: string) => {
    return `Tipo: ${value}`;
  };

  const activeFilters: { type: keyof SearchFilters; value: string; label: string }[] = [];

  filters.resourceType.forEach(type => 
    activeFilters.push({ type: 'resourceType', value: type, label: getItemTypeLabel(type) })
  );
  filters.subject.forEach(subject => 
    activeFilters.push({ type: 'subject', value: subject, label: `Assunto: ${subject}` })
  );
  if (filters.author) {
    activeFilters.push({ type: 'author', value: filters.author, label: `Autor: ${filters.author}` });
  }
  if (filters.year) {
    activeFilters.push({ type: 'year', value: filters.year, label: `Ano: ${filters.year}` });
  }
  if (filters.duration) {
    activeFilters.push({ type: 'duration', value: filters.duration, label: getDurationLabel(filters.duration) });
  }
  filters.language.forEach(lang => 
    activeFilters.push({ type: 'language', value: lang, label: getLanguageLabel(lang) })
  );
  filters.documentType.forEach(docType => 
    activeFilters.push({ type: 'documentType', value: docType, label: getDocumentTypeLabel(docType) })
  );

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-4 bg-lsb-section rounded-lg">
      <span className="text-sm font-medium text-gray-600">Filtros ativos:</span>
      
      {activeFilters.map((filter, index) => (
        <Badge
          key={`${filter.type}-${filter.value}-${index}`}
          variant="secondary"
          className="flex items-center gap-1 bg-lsb-accent text-lsb-primary hover:bg-lsb-accent/80"
        >
          {filter.label}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto w-auto p-0 hover:bg-transparent"
            onClick={() => onRemoveFilter(filter.type, filter.value)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-gray-500 hover:text-gray-700"
      >
        Limpar todos
      </Button>
    </div>
  );
};

export default FilterChips;
