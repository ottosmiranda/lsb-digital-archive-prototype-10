import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { SearchFilters, SearchResult } from '@/types/searchTypes'; // Import SearchFilters type

interface StreamlinedSearchFiltersProps {
  filters: SearchFilters; // Use the imported SearchFilters type
  onFiltersChange: (filters: SearchFilters) => void; // Use the imported SearchFilters type
  currentResults?: SearchResult[]; // New prop to check available content types
}

const StreamlinedSearchFilters = ({ filters, onFiltersChange, currentResults = [] }: StreamlinedSearchFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    itemType: true, // "Tipo de Item" - uses filters.resourceType
    documentType: true, // New section for document types
    language: true, // "Idioma"
    subject: true,
    author: false,
    year: false,
    duration: false
  });

  // Check if there are any books/articles in current results
  const hasBooksInResults = currentResults.some(result => result.type === 'titulo');

  // Options for "Tipo de Item"
  const itemTypes = [
    { id: 'titulo', label: 'Livros/Artigos' },
    { id: 'video', label: 'Vídeos' },
    { id: 'podcast', label: 'Podcasts' }
  ];

  // Options for "Tipo de Documento" (academic document types)
  const documentTypes = [
    'Artigo',
    'Dissertação de mestrado',
    'Trabalho de conclusão de curso',
    'Trabalho apresentado em evento',
    'Dissertação de doutorado',
    'Análise',
    'Errata',
    'Resumo',
    'Relatório de pós-doutorado',
    'Carta',
    'Editorial',
    'Capítulo de livro',
    'Tese de habilitação',
    'Tese de residência',
    'Livro',
    'Patente',
    'Dados de pesquisa',
    'Observação',
    'Artigo de dados',
    'Plano de gerenciamento de dados',
    'Revista'
  ];

  // Options for "Idioma"
  const languages = ['Português', 'Inglês', 'Espanhol']; // Add more as needed

  const subjects = [
    'Educação', 'História', 'Linguística', 'Cultura Surda', 'Inclusão', 
    'Tecnologia', 'Saúde', 'Direitos', 'Arte', 'Literatura'
  ];

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

  const handleItemTypeChange = (itemTypeId: string, checked: boolean) => {
    const newItemTypes = checked
      ? [...filters.resourceType, itemTypeId]
      : filters.resourceType.filter((it: string) => it !== itemTypeId);
    onFiltersChange({ ...filters, resourceType: newItemTypes });
  };

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

  const clearFilters = () => {
    onFiltersChange({
      resourceType: [], // For "Tipo de Item"
      subject: [],
      author: '',
      year: '',
      duration: '',
      language: [], // Clear language filter
      documentType: [] // Clear document type filter
    });
  };

  const hasActiveFilters = 
    filters.resourceType.length > 0 ||
    filters.language.length > 0 ||
    filters.documentType.length > 0 ||
    filters.subject.length > 0 || 
    filters.author || 
    filters.year || 
    filters.duration;

  const activeFilterCount = 
    filters.resourceType.length +
    filters.language.length +
    filters.documentType.length +
    filters.subject.length + 
    (filters.author ? 1 : 0) + 
    (filters.year ? 1 : 0) + 
    (filters.duration ? 1 : 0);

  const toggleSection = (section: keyof typeof openSections) => { // Use keyof typeof openSections
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

      {/* Item Type Filter */}
      <Collapsible open={openSections.itemType} onOpenChange={() => toggleSection('itemType')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Tipo de Item</Label>
            {filters.resourceType.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filters.resourceType.length}
              </Badge>
            )}
          </div>
          {openSections.itemType ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto">
            {itemTypes.map((itemType) => (
              <div key={itemType.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`itemType-${itemType.id}`}
                  checked={filters.resourceType.includes(itemType.id)}
                  onCheckedChange={(checked) => handleItemTypeChange(itemType.id, !!checked)}
                />
                <Label htmlFor={`itemType-${itemType.id}`} className="text-sm cursor-pointer">{itemType.label}</Label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Document Type Filter - Only show when books are in results */}
      {hasBooksInResults && (
        <Collapsible open={openSections.documentType} onOpenChange={() => toggleSection('documentType')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Tipo de Documento</Label>
              {filters.documentType.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.documentType.length}
                </Badge>
              )}
            </div>
            {openSections.documentType ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto">
              {documentTypes.map((docType) => (
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

      {/* Language Filter */}
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

      {/* Subject Filter */}
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

      {/* Author Filter */}
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
            <Input
              placeholder="Nome do autor"
              value={filters.author}
              onChange={(e) => onFiltersChange({ ...filters, author: e.target.value })}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Year Filter */}
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

      {/* Duration Filter */}
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
