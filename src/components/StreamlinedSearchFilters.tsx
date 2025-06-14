import { useState, useMemo, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { SearchFilters, SearchResult } from '@/types/searchTypes';

interface StreamlinedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  currentResults?: SearchResult[];
}

const StreamlinedSearchFilters = ({ filters, onFiltersChange, currentResults = [] }: StreamlinedSearchFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localAuthor, setLocalAuthor] = useState(filters.author);
  
  const [openSections, setOpenSections] = useState({
    subject: true,
    itemType: true,
    author: false,
    language: true,
    year: false,
    duration: false
  });

  // Sync local author state with external filters only when they change from outside
  useEffect(() => {
    if (filters.author !== localAuthor) {
      setLocalAuthor(filters.author);
    }
  }, [filters.author]);

  // Extract available document types from current results
  const availableDocumentTypes = useMemo(() => {
    const types = new Set<string>();
    currentResults.forEach(result => {
      if (result.type === 'titulo' && result.documentType) {
        types.add(result.documentType);
      }
    });
    return Array.from(types).sort();
  }, [currentResults]);

  // Options for "Idioma"
  const languages = ['Português', 'Inglês', 'Espanhol'];

  const subjects = [
    'Educação', 'História', 'Linguística', 'Cultura Surda', 'Inclusão', 
    'Tecnologia', 'Saúde', 'Direitos', 'Arte', 'Literatura'
  ];

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

  const handleDocumentTypeChange = (documentTypeId: string, checked: boolean) => {
    const newDocumentTypes = checked
      ? [...filters.documentType, documentTypeId]
      : filters.documentType.filter((dt: string) => dt !== documentTypeId);
    onFiltersChange({ ...filters, documentType: newDocumentTypes });
  };

  const handleLanguageChange = (languageId: string, checked: boolean) => {
    const newLanguages = checked
      ? [...filters.language, languageId]
      : filters.language.filter((lang: string) => lang !== languageId);
    onFiltersChange({ ...filters, language: newLanguages });
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

  const handleAuthorChange = (value: string) => {
    setLocalAuthor(value);
    // Immediately update filters without debouncing - let useSearchOperations handle the timing
    onFiltersChange({ ...filters, author: value });
  };

  const clearAuthor = () => {
    setLocalAuthor('');
    onFiltersChange({ ...filters, author: '' });
  };

  const clearFilters = () => {
    setLocalAuthor('');
    onFiltersChange({
      resourceType: [], // Keep for backward compatibility
      subject: [],
      author: '',
      year: '',
      duration: '',
      language: [],
      documentType: []
    });
  };

  const hasActiveFilters = 
    filters.documentType.length > 0 ||
    filters.language.length > 0 ||
    filters.subject.length > 0 || 
    filters.author || 
    filters.year || 
    filters.duration;

  const activeFilterCount = 
    filters.documentType.length +
    filters.language.length +
    filters.subject.length + 
    (filters.author ? 1 : 0) + 
    (filters.year ? 1 : 0) + 
    (filters.duration ? 1 : 0);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const FilterContent = () => (
    <div className="space-y-4">
      {hasActiveFilters && (
        <div className="flex items-center justify-between p-3 bg-lsb-section rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filtros ativos</span>
            <Badge variant="outline">{activeFilterCount}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </div>
      )}

      {/* Subject Filter - First */}
      <Collapsible open={openSections.subject} onOpenChange={() => toggleSection('subject')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Assunto</Label>
            {filters.subject.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filters.subject.length}
              </Badge>
            )}
          </div>
          {openSections.subject ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto">
            {subjects.map((subject) => (
              <div key={subject} className="flex items-center space-x-2">
                <Checkbox
                  id={subject}
                  checked={filters.subject.includes(subject)}
                  onCheckedChange={(checked) => handleSubjectChange(subject, !!checked)}
                />
                <Label htmlFor={subject} className="text-sm cursor-pointer">{subject}</Label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Document Type Filter - Second (only show when there are document types available) */}
      {availableDocumentTypes.length > 0 && (
        <Collapsible open={openSections.itemType} onOpenChange={() => toggleSection('itemType')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Tipo de Item</Label>
              {filters.documentType.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.documentType.length}
                </Badge>
              )}
            </div>
            {openSections.itemType ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto">
              {availableDocumentTypes.map((docType) => (
                <div key={docType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`docType-${docType}`}
                    checked={filters.documentType.includes(docType)}
                    onCheckedChange={(checked) => handleDocumentTypeChange(docType, !!checked)}
                  />
                  <Label htmlFor={`docType-${docType}`} className="text-sm cursor-pointer">{docType}</Label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Author Filter - Third */}
      <Collapsible open={openSections.author} onOpenChange={() => toggleSection('author')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Autor</Label>
            {filters.author && (
              <Badge variant="secondary" className="text-xs">
                1
              </Badge>
            )}
          </div>
          {openSections.author ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="p-3 border border-gray-200 rounded-lg bg-white">
            <div className="relative">
              <Input
                placeholder="Nome do autor"
                value={localAuthor}
                onChange={(e) => handleAuthorChange(e.target.value)}
                className="pr-10"
              />
              {localAuthor && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={clearAuthor}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Language Filter - Fourth */}
      <Collapsible open={openSections.language} onOpenChange={() => toggleSection('language')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Idioma</Label>
            {filters.language.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filters.language.length}
              </Badge>
            )}
          </div>
          {openSections.language ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto">
            {languages.map((language) => (
              <div key={language} className="flex items-center space-x-2">
                <Checkbox
                  id={`language-${language}`}
                  checked={filters.language.includes(language)}
                  onCheckedChange={(checked) => handleLanguageChange(language, !!checked)}
                />
                <Label htmlFor={`language-${language}`} className="text-sm cursor-pointer">{language}</Label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Year Filter - Fifth */}
      <Collapsible open={openSections.year} onOpenChange={() => toggleSection('year')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Ano</Label>
            {filters.year && (
              <Badge variant="secondary" className="text-xs">
                {filters.year}
              </Badge>
            )}
          </div>
          {openSections.year ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="p-3 border border-gray-200 rounded-lg bg-white">
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
        </CollapsibleContent>
      </Collapsible>

      {/* Duration Filter - Sixth */}
      <Collapsible open={openSections.duration} onOpenChange={() => toggleSection('duration')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Duração</Label>
            {filters.duration && (
              <Badge variant="secondary" className="text-xs">
                1 
              </Badge>
            )}
          </div>
          {openSections.duration ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="p-3 border border-gray-200 rounded-lg bg-white">
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 shrink-0">
        <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24 shadow-sm">
          <h3 className="font-semibold text-lg mb-4 lsb-primary flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </h3>
          <FilterContent />
        </div>
      </div>

      {/* Mobile Sheet */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full mb-4 h-12">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <Badge className="ml-2 bg-lsb-accent text-lsb-primary">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Busca
              </SheetTitle>
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

export default StreamlinedSearchFilters;
