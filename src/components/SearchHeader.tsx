
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ViewToggle from '@/components/ViewToggle';

interface SearchHeaderProps {
  query: string;
  resultCount: number;
  sortBy: string;
  view: 'grid' | 'list';
  onSortChange: (value: string) => void;
  onViewChange: (view: 'grid' | 'list') => void;
}

const SearchHeader = ({ 
  query, 
  resultCount, 
  sortBy, 
  view,
  onSortChange, 
  onViewChange 
}: SearchHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-lsb-gray">
      <div>
        <h1 className="text-2xl font-bold lsb-primary">
          {query ? `Resultados para "${query}"` : 'Resultados da busca'}
        </h1>
        <p className="text-gray-600 mt-1">
          {resultCount === 0 
            ? 'Nenhum resultado encontrado'
            : `${resultCount} resultado${resultCount !== 1 ? 's' : ''} encontrado${resultCount !== 1 ? 's' : ''}`
          }
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        <ViewToggle view={view} onViewChange={onViewChange} />
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Ordenar por:</span>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevância</SelectItem>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="accessed">Mais acessados</SelectItem>
              <SelectItem value="type">Agrupar por tipo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default SearchHeader;
