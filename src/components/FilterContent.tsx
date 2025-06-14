
import React, { useMemo, useCallback } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { SearchFilters, SearchResult } from '@/types/searchTypes';
import AuthorInput from '@/components/AuthorInput';
import AuthorList from '@/components/AuthorList';
import SubjectFacetList from '@/components/SubjectFacetList';
import LanguageFacetList from '@/components/LanguageFacetList';

// Static data moved outside component to prevent re-creation
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
    filters.author || 
    filters.year || 
    filters.duration,
    [filters]
  );

  const activeFilterCount = useMemo(() => 
    filters.documentType.length +
    filters.language.length +
    filters.subject.length + 
    (filters.author ? 1 : 0) + 
    (filters.year ? 1 : 0) + 
    (filters.duration ? 1 : 0),
    [filters]
  );

  // Convert single author string to array for compatibility
  const selectedAuthors = useMemo(() => {
    return filters.author ? [filters.author] : [];
  }, [filters.author]);

  const handleDocumentTypeChange = useCallback((documentTypeId: string, checked: boolean) => {
    const newDocumentTypes = checked
      ? [...filters.documentType, documentTypeId]
      : filters.documentType.filter((dt: string) => dt !== documentTypeId);
    onFiltersChange({ ...filters, documentType: newDocumentTypes });
  }, [filters, onFiltersChange]);

  const handleSubjectsChange = useCallback((subjects: string[]) => {
    onFiltersChange({ ...filters, subject: subjects });
  }, [filters, onFiltersChange]);

  const handleLanguagesChange = useCallback((languages: string[]) => {
    onFiltersChange({ ...filters, language: languages });
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
    onFiltersChange({ ...filters, author: value }, { authorTyping: true });
  }, [filters, onFiltersChange]);

  const handleAuthorsListChange = useCallback((authors: string[]) => {
    // For now, we'll take the first selected author to maintain compatibility
    const authorValue = authors.length > 0 ? authors[0] : '';
    onFiltersChange({ ...filters, author: authorValue });
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    onFiltersChange({
      resourceType: [],
      subject: [],
      author: '',
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

      {/* Subject Filter with Facet Counts */}
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
          <div className="p-3 border border-gray-200 rounded-lg bg-white">
            <SubjectFacetList
              currentResults={currentResults}
              selectedSubjects={filters.subject}
              onSubjectsChange={handleSubjectsChange}
            />
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
                  <input
                    type="checkbox"
                    id={`docType-${docType}`}
                    checked={filters.documentType.includes(docType)}
                    onChange={(e) => handleDocumentTypeChange(docType, e.target.checked)}
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
            {filters.author && (
              <Badge variant="secondary" className="text-xs">
                1
              </Badge>
            )}
          </div>
          {openSections.author ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="space-y-4">
            {/* Author Input */}
            <div className="p-3 border border-gray-200 rounded-lg bg-white">
              <Label className="text-xs text-gray-600 mb-2 block">Buscar por nome</Label>
              <AuthorInput
                value={filters.author}
                onChange={handleAuthorChange}
                placeholder="Nome do autor"
                currentResults={currentResults}
              />
            </div>
            
            {/* Author List */}
            <div className="p-3 border border-gray-200 rounded-lg bg-white">
              <Label className="text-xs text-gray-600 mb-3 block">Autores nos resultados</Label>
              <AuthorList
                currentResults={currentResults}
                selectedAuthors={selectedAuthors}
                onAuthorsChange={handleAuthorsListChange}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Language Filter with Facet Counts */}
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
          <div className="p-3 border border-gray-200 rounded-lg bg-white">
            <LanguageFacetList
              currentResults={currentResults}
              selectedLanguages={filters.language}
              onLanguagesChange={handleLanguagesChange}
            />
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
