
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, Play, Headphones, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ViewToggle from '@/components/ViewToggle';
import SearchQueryClearButton from '@/components/SearchQueryClearButton';

interface SearchHeaderWithTabsProps {
  query: string;
  resultCount: number;
  sortBy: string;
  view: 'grid' | 'list';
  activeContentType: string;
  onSortChange: (value: string) => void;
  onViewChange: (view: 'grid' | 'list') => void;
  onContentTypeChange: (type: string) => void;
  onClearQuery?: () => void;
}

const SearchHeaderWithTabs = ({ 
  query, 
  resultCount, 
  sortBy, 
  view,
  activeContentType,
  onSortChange, 
  onViewChange,
  onContentTypeChange,
  onClearQuery
}: SearchHeaderWithTabsProps) => {
  const contentTypes = [
    { id: 'all', label: 'Todos', icon: Grid3X3 },
    { id: 'titulo', label: 'Livros & Artigos', icon: Book },
    { id: 'video', label: 'Vídeos', icon: Play },
    { id: 'podcast', label: 'Podcasts', icon: Headphones }
  ];

  // Show different result text when "Todos" is active and sorted alphabetically
  const getResultDescription = () => {
    if (activeContentType === 'all' && sortBy === 'title') {
      return resultCount === 0 
        ? 'Nenhum resultado encontrado'
        : `${resultCount} resultado${resultCount !== 1 ? 's' : ''} encontrado${resultCount !== 1 ? 's' : ''} (todos os tipos, ordem alfabética)`;
    }
    return resultCount === 0 
      ? 'Nenhum resultado encontrado'
      : `${resultCount} resultado${resultCount !== 1 ? 's' : ''} encontrado${resultCount !== 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Search Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold lsb-primary">
              {query ? `Resultados para "${query}"` : 'Resultados da busca'}
            </h1>
            {query && onClearQuery && (
              <SearchQueryClearButton onClear={onClearQuery} />
            )}
          </div>
          <p className="text-gray-600 mt-1">
            {getResultDescription()}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <ViewToggle view={view} onViewChange={onViewChange} />
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:inline">Ordenar:</span>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevância</SelectItem>
                <SelectItem value="title">Alfabética</SelectItem>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="accessed">Mais acessados</SelectItem>
                <SelectItem value="type">Por tipo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content Type Tabs */}
      <div className="border-b border-gray-200">
        <Tabs value={activeContentType} onValueChange={onContentTypeChange} className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-md h-auto p-1 bg-lsb-section">
            {contentTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <TabsTrigger 
                  key={type.id} 
                  value={type.id}
                  className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-white data-[state=active]:text-lsb-primary"
                >
                  <IconComponent className={`h-4 w-4 ${
                    activeContentType === type.id 
                      ? '!text-blue-700' 
                      : '!text-slate-700'
                  }`} />
                  <span className="hidden sm:inline">{type.label}</span>
                  <span className="sm:hidden">{type.label.slice(0, 3)}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default SearchHeaderWithTabs;
