
import React, { useMemo, useCallback } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { SearchFilters, SearchResult } from '@/types/searchTypes';
import AuthorInput from '@/components/AuthorInput';

// Static data moved outside component to prevent re-creation
const languages = ['Português', 'English', 'Espanhol'];
const subjects = [
  'Educação', 'História', 'Linguística', 'Cultura Surda', 'Inclusão', 
  'Tecnologia', 'Saúde', 'Direitos', 'Arte', 'Literatura'
];
const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

interface FilterContentProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters, options?: { authorTyping?: boolean }) => void;
  currentResults: SearchResult[];
  openSections: Record<string, boolean>;
  onToggleSection: (section: string) => void;
}

const FilterContent = React.memo(({ 
  filters, 
  onFiltersChange, 
  currentResults, 
  openSections, 
  onToggleSection 
}: FilterContentProps) => {
  const availableDocumentTypes = useMemo(() => {
    const types = new Set<string>();
    currentResults.forEach(result => {
      if (result.type === 'titulo' && result.documentType) {
        types.add(result.documentType);
      }
    });
    return Array.from(types).sort();
  }, [currentResults]);

  const hasActiveFilters = useMemo(() => 
    filters.documentType.length > 0 ||
    filters.language.length > 0 ||
    filters.subject.length > 0 || 
    filters.author.length > 0 || // CORRIGIDO: Agora é array
    filters.year || 
    filters.duration,
    [filters]
  );

  const activeFilterCount = useMemo(() => 
    filters.documentType.length +
    filters.language.length +
    filters.subject.length + 
    filters.author.length + // CORRIGIDO: Agora é array
    (filters.year ? 1 : 0) + 
    (filters.duration ? 1 : 0),
    [filters]
  );

  const handleDocumentTypeChange = useCallback((documentTypeId: string, checked: boolean) => {
    const newDocumentTypes = checked
      ? [...filters.documentType, documentTypeId]
      : filters.documentType.filter((dt: string) => dt !== documentTypeId);
    onFiltersChange({ ...filters, documentType: newDocumentTypes });
  }, [filters, onFiltersChange]);

  const handleLanguageChange = useCallback((languageId: string, checked: boolean) => {
    const newLanguages = checked
      ? [...filters.language, languageId]
      : filters.language.filter((lang: string) => lang !== languageId);
    onFiltersChange({ ...filters, language: newLanguages });
  }, [filters, onFiltersChange]);

  const handleSubjectChange = useCallback((subjectId: string, checked: boolean) => {
    const newSubjects = checked 
      ? [...filters.subject, subjectId]
      : filters.subject.filter((s: string) => s !== subjectId);
    onFiltersChange({ ...filters, subject: newSubjects });
  }, [filters, onFiltersChange]);

  const handleYearChange = useCallback((value: string) => {
    const yearValue = value === 'all' ? '' : value;
    onFiltersChange({ ...filters, year: yearValue });
  }, [filters, onFiltersChange]);

  const handleDurationChange = useCallback((value: string) => {
    const durationValue = value === 'all' ? '' : value;
    onFiltersChange({ ...filters, duration: durationValue });
  }, [filters, onFiltersChange]);

  const handleAuthorChange = useCallback((value: string) => {
    // CORRIGIDO: Suportar múltiplos autores
    const authors = value ? [value] : [];
    onFiltersChange({ ...filters, author: authors }, { authorTyping: true });
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    onFiltersChange({
      resourceType: [],
      subject: [],
      author: [], // CORRIGIDO: Array vazio
      year: '',
      duration: '',
      language: [],
      documentType: []
    });
  }, [onFiltersChange]);

  return (
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

      {/* CORRIGIDO: Mostrar autores selecionados como tags */}
      {filters.author.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-blue-700">Autores selecionados:</span>
          {filters.author.map((author, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {author}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-auto p-0 ml-1"
                onClick={() => {
                  const newAuthors = filters.author.filter(a => a !== author);
                  onFiltersChange({ ...filters, author: newAuthors });
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Subject Filter */}
      <Collapsible open={openSections.subject} onOpenChange={() => onToggleSection('subject')}>
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

      {/* Document Type Filter */}
      {availableDocumentTypes.length > 0 && (
        <Collapsible open={openSections.itemType} onOpenChange={() => onToggleSection('itemType')}>
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

      {/* Author Filter */}
      <Collapsible open={openSections.author} onOpenChange={() => onToggleSection('author')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Autor</Label>
            {filters.author.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filters.author.length}
              </Badge>
            )}
          </div>
          {openSections.author ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="p-3 border border-gray-200 rounded-lg bg-white">
            <Label className="text-xs text-gray-600 mb-2 block">Buscar por nome</Label>
            <AuthorInput
              value={filters.author.length > 0 ? filters.author[0] : ''}
              onChange={handleAuthorChange}
              placeholder="Nome do autor"
              currentResults={currentResults}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Language Filter */}
      <Collapsible open={openSections.language} onOpenChange={() => onToggleSection('language')}>
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

      {/* Year Filter */}
      <Collapsible open={openSections.year} onOpenChange={() => onToggleSection('year')}>
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
      <Collapsible open={openSections.duration} onOpenChange={() => onToggleSection('duration')}>
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
});

FilterContent.displayName = 'FilterContent';

export default FilterContent;
