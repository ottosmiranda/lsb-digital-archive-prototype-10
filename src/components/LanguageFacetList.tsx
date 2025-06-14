
import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchResult } from '@/types/searchTypes';
import { extractLanguageFacets, normalizeText } from '@/utils/searchUtils';
import FacetOption from '@/components/FacetOption';

interface LanguageFacetListProps {
  currentResults: SearchResult[];
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
}

const LanguageFacetList = React.memo(({ 
  currentResults, 
  selectedLanguages, 
  onLanguagesChange 
}: LanguageFacetListProps) => {
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const facets = useMemo(() => {
    return extractLanguageFacets(currentResults);
  }, [currentResults]);

  const filteredFacets = useMemo(() => {
    if (!searchTerm) return facets;
    const normalizedSearch = normalizeText(searchTerm);
    return facets.filter(facet => 
      normalizeText(facet.name).includes(normalizedSearch)
    );
  }, [facets, searchTerm]);

  const displayedFacets = useMemo(() => {
    return showAll ? filteredFacets : filteredFacets.slice(0, 5);
  }, [filteredFacets, showAll]);

  const maxCount = useMemo(() => {
    return Math.max(...facets.map(f => f.count), 1);
  }, [facets]);

  const handleLanguageChange = useCallback((languageName: string, checked: boolean) => {
    const newLanguages = checked 
      ? [...selectedLanguages, languageName]
      : selectedLanguages.filter(name => name !== languageName);
    onLanguagesChange(newLanguages);
  }, [selectedLanguages, onLanguagesChange]);

  const toggleShowAll = useCallback(() => {
    setShowAll(prev => !prev);
  }, []);

  if (facets.length === 0) {
    return (
      <div className="text-sm text-gray-500 p-3">
        Nenhum idioma encontrado nos resultados atuais
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {facets.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar idiomas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
      )}
      
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {displayedFacets.map((facet) => (
          <FacetOption
            key={facet.name}
            id={`language-${facet.name}`}
            name={facet.name}
            count={facet.count}
            maxCount={maxCount}
            checked={selectedLanguages.includes(facet.name)}
            onCheckedChange={(checked) => handleLanguageChange(facet.name, checked)}
          />
        ))}
      </div>
      
      {filteredFacets.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleShowAll}
          className="w-full justify-center text-xs text-gray-600 hover:text-gray-800"
        >
          {showAll ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Mostrar mais ({filteredFacets.length - 5} outros)
            </>
          )}
        </Button>
      )}
    </div>
  );
});

LanguageFacetList.displayName = 'LanguageFacetList';

export default LanguageFacetList;
