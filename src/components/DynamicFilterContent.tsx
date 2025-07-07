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
import { useContentAwareFilters } from '@/hooks/useContentAwareFilters';
import { useAllAuthors } from '@/hooks/useAllAuthors';
import { extractAuthorsFromResults, extractProgramsFromResults, extractChannelsFromResults } from '@/utils/searchUtils';

// MELHORADO: Anos baseados em dados reais, não apenas últimos 10 anos
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => (currentYear - i).toString()).filter(year => parseInt(year) >= 1990);

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

  const { authors: allAuthors, loading: loadingAllAuthors } = useAllAuthors();

  const hasActiveFilters = useMemo(() => 
    filters.language.length > 0 ||
    filters.subject.length > 0 || 
    filters.author.length > 0 ||
    filters.year || 
    filters.duration ||
    filters.program.length > 0 ||
    filters.channel.length > 0,
    [filters]
  );

  const activeFilterCount = useMemo(() => 
    filters.language.length +
    filters.subject.length + 
    filters.author.length +
    (filters.year ? 1 : 0) + 
    (filters.duration ? 1 : 0) +
    filters.program.length +
    filters.channel.length,
    [filters]
  );

  // NOVO: Extrair programas e canais dos resultados atuais
  const currentPagePrograms = useMemo(() => {
    return extractProgramsFromResults(currentResults)
      .sort((a, b) => b.count - a.count);
  }, [currentResults]);

  const currentPageChannels = useMemo(() => {
    return extractChannelsFromResults(currentResults)
      .sort((a, b) => b.count - a.count);
  }, [currentResults]);

  // CORRIGIDO: Autores da página atual para comparação
  const currentPageAuthors = useMemo(() => {
    return extractAuthorsFromResults(currentResults)
      .sort((a, b) => b.count - a.count);
  }, [currentResults]);

  // MELHORADO: Verificar se há anos válidos nos resultados atuais
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    currentResults.forEach(result => {
      if (result.year && result.year > 1900 && result.year <= currentYear) {
        yearSet.add(result.year);
      }
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [currentResults]);

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

  // NOVO: Handlers para programa e canal
  const handleProgramChange = useCallback((programId: string, checked: boolean) => {
    const newPrograms = checked
      ? [...filters.program, programId]
      : filters.program.filter((p: string) => p !== programId);
    onFiltersChange({ ...filters, program: newPrograms });
  }, [filters, onFiltersChange]);

  const handleChannelChange = useCallback((channelId: string, checked: boolean) => {
    const newChannels = checked
      ? [...filters.channel, channelId]
      : filters.channel.filter((c: string) => c !== channelId);
    onFiltersChange({ ...filters, channel: newChannels });
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
    const authors = value ? [value] : [];
    onFiltersChange({ ...filters, author: authors }, { authorTyping: true });
  }, [filters, onFiltersChange]);

  // NOVO: Função para selecionar autores via dropdown
  const handleAuthorSelect = useCallback((authorName: string) => {
    const isSelected = filters.author.includes(authorName);
    const newAuthors = isSelected
      ? filters.author.filter(a => a !== authorName)
      : [...filters.author, authorName];
    onFiltersChange({ ...filters, author: newAuthors });
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    onFiltersChange({
      resourceType: filters.resourceType,
      subject: [],
      author: [],
      year: '',
      duration: '',
      language: [],
      documentType: [],
      program: [],
      channel: []
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

      {/* Tags de filtros selecionados */}
      {(filters.author.length > 0 || filters.program.length > 0 || filters.channel.length > 0) && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
          {filters.author.length > 0 && (
            <>
              <span className="text-sm font-medium text-blue-700">Autores:</span>
              {filters.author.map((author, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {author}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto w-auto p-0 ml-1"
                    onClick={() => handleAuthorSelect(author)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </>
          )}
          
          {filters.program.length > 0 && (
            <>
              <span className="text-sm font-medium text-blue-700">Programas:</span>
              {filters.program.map((program, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {program}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto w-auto p-0 ml-1"
                    onClick={() => handleProgramChange(program, false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </>
          )}

          {filters.channel.length > 0 && (
            <>
              <span className="text-sm font-medium text-blue-700">Canais:</span>
              {filters.channel.map((channel, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {channel}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto w-auto p-0 ml-1"
                    onClick={() => handleChannelChange(channel, false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </>
          )}
        </div>
      )}

      {/* NOVO: Filtro de Programa (apenas para podcasts) */}
      {activeContentType === 'podcast' && currentPagePrograms.length > 0 && (
        <Collapsible open={openSections.program} onOpenChange={() => onToggleSection('program')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Programa</Label>
              {filters.program.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.program.length}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                {currentPagePrograms.length} disponíveis
              </Badge>
            </div>
            {openSections.program ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto">
              {currentPagePrograms.map((program) => (
                <div key={program.name} className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`program-${program.name}`}
                      checked={filters.program.includes(program.name)}
                      onCheckedChange={(checked) => handleProgramChange(program.name, !!checked)}
                    />
                    <Label htmlFor={`program-${program.name}`} className="text-sm cursor-pointer">
                      {program.name}
                    </Label>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {program.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* NOVO: Filtro de Canal (apenas para vídeos) */}
      {activeContentType === 'video' && currentPageChannels.length > 0 && (
        <Collapsible open={openSections.channel} onOpenChange={() => onToggleSection('channel')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Canal</Label>
              {filters.channel.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.channel.length}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                {currentPageChannels.length} disponíveis
              </Badge>
            </div>
            {openSections.channel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto">
              {currentPageChannels.map((channel) => (
                <div key={channel.name} className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`channel-${channel.name}`}
                      checked={filters.channel.includes(channel.name)}
                      onCheckedChange={(checked) => handleChannelChange(channel.name, !!checked)}
                    />
                    <Label htmlFor={`channel-${channel.name}`} className="text-sm cursor-pointer">
                      {channel.name}
                    </Label>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {channel.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

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

      <Collapsible open={openSections.author} onOpenChange={() => onToggleSection('author')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Autor</Label>
            {filters.author.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filters.author.length}
              </Badge>
            )}
            {loadingAllAuthors && (
              <Badge variant="outline" className="text-xs">
                Carregando...
              </Badge>
            )}
          </div>
          {openSections.author ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="space-y-4">
            {/* Busca por nome */}
            <div className="p-3 border border-gray-200 rounded-lg bg-white">
              <Label className="text-xs text-gray-600 mb-2 block">Buscar por nome</Label>
              <AuthorInput
                value={filters.author.length > 0 ? filters.author[0] : ''}
                onChange={handleAuthorChange}
                placeholder="Nome do autor"
                currentResults={currentResults}
              />
            </div>
            
            {/* Dropdown de autores */}
            <div className="p-3 border border-gray-200 rounded-lg bg-white">
              <Label className="text-xs text-gray-600 mb-3 block">
                Selecionar autores ({allAuthors.length} disponíveis)
              </Label>
              <Select value="" onValueChange={handleAuthorSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar autor" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {allAuthors.map((author) => (
                    <SelectItem 
                      key={author.name} 
                      value={author.name}
                      className={filters.author.includes(author.name) ? "font-medium bg-blue-50" : ""}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{author.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">({author.count})</span>
                          {filters.author.includes(author.name) && (
                            <span className="text-xs text-blue-600">✓</span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Indicador de comparação */}
              <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                🌍 Autores globais: {allAuthors.length} | 📄 Autores nesta página: {currentPageAuthors.length}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

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
              {availableYears.length > 0 && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                  {availableYears.length} anos disponíveis
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
                <SelectContent className="max-h-48">
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {availableYears.length > 0 && (
                    <>
                      <SelectItem disabled value="separator-available" className="text-xs text-gray-500 font-medium">
                        Disponíveis nesta busca:
                      </SelectItem>
                      {availableYears.map((year) => (
                        <SelectItem key={`available-${year}`} value={year.toString()}>
                          {year} ✓
                        </SelectItem>
                      ))}
                      <SelectItem disabled value="separator-all" className="text-xs text-gray-500 font-medium">
                        Todos os anos:
                      </SelectItem>
                    </>
                  )}
                  {years.map((year) => (
                    <SelectItem 
                      key={year} 
                      value={year}
                      className={availableYears.includes(parseInt(year)) ? "font-medium" : ""}
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

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
                  <SelectItem value="short">Curta (até 10 min)</SelectItem>
                  <SelectItem value="medium">Média (10-30 min)</SelectItem>
                  <SelectItem value="long">Longa (mais de 30 min)</SelectItem>
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
