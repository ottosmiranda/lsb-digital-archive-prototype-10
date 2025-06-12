
import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface SearchFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
}

const SearchFilters = ({ filters, onFiltersChange }: SearchFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const resourceTypes = [
    { id: 'titulo', label: 'Livros e Artigos' },
    { id: 'video', label: 'Vídeos' },
    { id: 'podcast', label: 'Podcasts' }
  ];

  const subjects = [
    'Educação', 'História', 'Linguística', 'Cultura Surda', 'Inclusão', 
    'Tecnologia', 'Saúde', 'Direitos', 'Arte', 'Literatura'
  ];

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

  const handleResourceTypeChange = (typeId: string, checked: boolean) => {
    const newTypes = checked 
      ? [...filters.resourceType, typeId]
      : filters.resourceType.filter((t: string) => t !== typeId);
    
    onFiltersChange({ ...filters, resourceType: newTypes });
  };

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    const newSubjects = checked 
      ? [...filters.subject, subjectId]
      : filters.subject.filter((s: string) => s !== subjectId);
    
    onFiltersChange({ ...filters, subject: newSubjects });
  };

  const handleYearChange = (value: string) => {
    const yearValue = value === 'all' ? '' : value;
    onFiltersChange({ ...filters, year: yearValue });
  };

  const handleDurationChange = (value: string) => {
    const durationValue = value === 'all' ? '' : value;
    onFiltersChange({ ...filters, duration: durationValue });
  };

  const clearFilters = () => {
    onFiltersChange({
      resourceType: [],
      subject: [],
      author: '',
      year: '',
      duration: ''
    });
  };

  const hasActiveFilters = 
    filters.resourceType.length > 0 || 
    filters.subject.length > 0 || 
    filters.author || 
    filters.year || 
    filters.duration;

  const FilterContent = () => (
    <div className="space-y-6">
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Filtros ativos</span>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </div>
      )}

      {/* Resource Type Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Tipo de Recurso</Label>
        <div className="space-y-2">
          {resourceTypes.map((type) => (
            <div key={type.id} className="flex items-center space-x-2">
              <Checkbox
                id={type.id}
                checked={filters.resourceType.includes(type.id)}
                onCheckedChange={(checked) => handleResourceTypeChange(type.id, !!checked)}
              />
              <Label htmlFor={type.id} className="text-sm">{type.label}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Assunto</Label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {subjects.map((subject) => (
            <div key={subject} className="flex items-center space-x-2">
              <Checkbox
                id={subject}
                checked={filters.subject.includes(subject)}
                onCheckedChange={(checked) => handleSubjectChange(subject, !!checked)}
              />
              <Label htmlFor={subject} className="text-sm">{subject}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Author Filter */}
      <div>
        <Label htmlFor="author" className="text-sm font-medium mb-3 block">Autor</Label>
        <Input
          id="author"
          placeholder="Nome do autor"
          value={filters.author}
          onChange={(e) => onFiltersChange({ ...filters, author: e.target.value })}
        />
      </div>

      {/* Year Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Ano</Label>
        <Select value={filters.year || 'all'} onValueChange={handleYearChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os anos</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duration Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Duração (vídeos/podcasts)</Label>
        <Select value={filters.duration || 'all'} onValueChange={handleDurationChange}>
          <SelectTrigger>
            <SelectValue placeholder="Qualquer duração" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer duração</SelectItem>
            <SelectItem value="short">Até 10 minutos</SelectItem>
            <SelectItem value="medium">10 - 30 minutos</SelectItem>
            <SelectItem value="long">Mais de 30 minutos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="bg-lsb-section rounded-lg p-6 sticky top-24">
          <h3 className="font-semibold text-lg mb-4 lsb-primary">Filtros</h3>
          <FilterContent />
        </div>
      </div>

      {/* Mobile Sheet */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full mb-4">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-2 bg-lsb-accent text-lsb-primary text-xs px-2 py-1 rounded-full">
                  {filters.resourceType.length + filters.subject.length + (filters.author ? 1 : 0) + (filters.year ? 1 : 0) + (filters.duration ? 1 : 0)}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Filtros de Busca</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default SearchFilters;
