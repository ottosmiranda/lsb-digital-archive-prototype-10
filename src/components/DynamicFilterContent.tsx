
import React, { useMemo, useCallback } from 'react';
import { X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { SearchFilters, SearchResult } from '@/types/searchTypes';
import AuthorInput from '@/components/AuthorInput';
import AuthorList from '@/components/AuthorList';
import { useContentAwareFilters } from '@/hooks/useContentAwareFilters';

const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

interface DynamicFilterContentProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters, options?: { authorTyping?: boolean }) => void;
  currentResults: SearchResult[];
  openSections: Record<string, boolean>;
  onToggleSection: (section: string) => void;
  activeContentType: string;
}

const DynamicFilterContent = React.memo(({ 
  filters, 
  onFiltersChange, 
  currentResults, 
  openSections, 
  onToggleSection,
  activeContentType
}: DynamicFilterContentProps) => {
  const { contentStats, filterRelevance } = useContentAwareFilters({
    currentResults,
    activeContentType
  });

  const hasActiveFilters = useMemo(() => 
    filters.language.length > 0 ||
    filters.subject.length > 0 || 
    filters.author || 
    filters.year || 
    filters.duration,
    [filters]
  );

  const activeFilterCount = useMemo(() => 
    filters.language.length +
    filters.subject.length + 
    (filters.author ? 1 : 0) + 
    (filters.year ? 1 : 0) + 
    (filters.duration ? 1 : 0),
    [filters]
  );

  const selectedAuthors = useMemo(() => {
    return filters.author ? [filters.author] : [];
  }, [filters.author]);

  // Handlers
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
    onFiltersChange({ ...filters, author: value }, { authorTyping: true });
  }, [filters, onFiltersChange]);

  const handleAuthorsListChange = useCallback((authors: string[]) => {
    const authorValue = authors.length > 0 ? authors[0] : '';
    onFiltersChange({ ...filters, author: authorValue });
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    onFiltersChange({
      resourceType: filters.resourceType, // Manter o tipo de recurso
      subject: [],
      author: '',
      year: '',
      duration: '',
      language: [],
      documentType: [] // Será removido gradualmente
    });
  }, [onFiltersChange, filters.resourceType]);

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

      {/* Subject Filter - Apenas quando há assuntos disponíveis */}
      {filterRelevance.subject && contentStats.availableSubjects.length > 0 && (
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
              {contentStats.availableSubjects.map((subject) => (
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
            <div className="p-3 border border-gray-200 rounded-lg bg-white">
              <Label className="text-xs text-gray-600 mb-2 block">Buscar por nome</Label>
              <AuthorInput
                value={filters.author}
                onChange={handleAuthorChange}
                placeholder="Nome do autor"
                currentResults={currentResults}
              />
            </div>
            
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

      {/* Language Filter - Apenas quando há idiomas disponíveis */}
      {filterRelevance.language && contentStats.availableLanguages.length > 0 && (
        <Collapsible open={openSections.language} onOpenChange={() => onToggleSection('language')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Idioma</Label>
              {filters.language.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.language.length}
                </Badge>
              )}
              {activeContentType === 'podcast' && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Campo não disponível
                </Badge>
              )}
            </div>
            {openSections.language ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto">
              {contentStats.availableLanguages.map((language) => (
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
      )}

      {/* Year Filter - Apenas para livros e podcasts */}
      {filterRelevance.year && (
        <Collapsible open={openSections.year} onOpenChange={() => onToggleSection('year')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Ano</Label>
              {filters.year && (
                <Badge variant="secondary" className="text-xs">
                  {filters.year}
                </Badge>
              )}
              {activeContentType === 'video' && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Campo não disponível
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
      )}

      {/* Duration Filter - Apenas para vídeos e podcasts */}
      {filterRelevance.duration && (
        <Collapsible open={openSections.duration} onOpenChange={() => onToggleSection('duration')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Duração</Label>
              {filters.duration && (
                <Badge variant="secondary" className="text-xs">
                  1 
                </Badge>
              )}
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                Mídia ({contentStats.videoCount + contentStats.podcastCount})
              </Badge>
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
      )}
    </div>
  );
});

DynamicFilterContent.displayName = 'DynamicFilterContent';

export default DynamicFilterContent;
