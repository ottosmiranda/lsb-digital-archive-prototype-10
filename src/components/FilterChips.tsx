
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FilterChipsProps {
  filters: {
    resourceType: string[];
    subject: string[];
    author: string;
    year: string;
    duration: string;
  };
  onRemoveFilter: (filterType: string, value?: string) => void;
  onClearAll: () => void;
}

const FilterChips = ({ filters, onRemoveFilter, onClearAll }: FilterChipsProps) => {
  const getFilterLabel = (type: string, value: string) => {
    switch (type) {
      case 'resourceType':
        const typeLabels: { [key: string]: string } = {
          'titulo': 'Livros',
          'video': 'Vídeos',
          'podcast': 'Podcasts'
        };
        return typeLabels[value] || value;
      case 'duration':
        const durationLabels: { [key: string]: string } = {
          'short': 'Até 10 min',
          'medium': '10-30 min',
          'long': '30+ min'
        };
        return durationLabels[value] || value;
      default:
        return value;
    }
  };

  const activeFilters = [
    ...filters.resourceType.map(type => ({ type: 'resourceType', value: type, label: getFilterLabel('resourceType', type) })),
    ...filters.subject.map(subject => ({ type: 'subject', value: subject, label: subject })),
    ...(filters.author ? [{ type: 'author', value: filters.author, label: `Autor: ${filters.author}` }] : []),
    ...(filters.year ? [{ type: 'year', value: filters.year, label: `Ano: ${filters.year}` }] : []),
    ...(filters.duration ? [{ type: 'duration', value: filters.duration, label: getFilterLabel('duration', filters.duration) }] : [])
  ];

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
