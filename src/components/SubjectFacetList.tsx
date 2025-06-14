
import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchResult } from '@/types/searchTypes';
import { extractSubjectFacets, normalizeText } from '@/utils/searchUtils';
import FacetOption from '@/components/FacetOption';

interface SubjectFacetListProps {
  currentResults: SearchResult[];
  selectedSubjects: string[];
  onSubjectsChange: (subjects: string[]) => void;
}

const SubjectFacetList = React.memo(({ 
  currentResults, 
  selectedSubjects, 
  onSubjectsChange 
}: SubjectFacetListProps) => {
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const facets = useMemo(() => {
    return extractSubjectFacets(currentResults);
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

  const handleSubjectChange = useCallback((subjectName: string, checked: boolean) => {
    const newSubjects = checked 
      ? [...selectedSubjects, subjectName]
      : selectedSubjects.filter(name => name !== subjectName);
    onSubjectsChange(newSubjects);
  }, [selectedSubjects, onSubjectsChange]);

  const toggleShowAll = useCallback(() => {
    setShowAll(prev => !prev);
  }, []);

  if (facets.length === 0) {
    return (
      <div className="text-sm text-gray-500 p-3">
        Nenhum assunto encontrado nos resultados atuais
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {facets.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar assuntos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
      )}
      
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {displayedFacets.map((facet) => (
          <FacetOption
            key={facet.name}
            id={`subject-${facet.name}`}
            name={facet.name}
            count={facet.count}
            maxCount={maxCount}
            checked={selectedSubjects.includes(facet.name)}
            onCheckedChange={(checked) => handleSubjectChange(facet.name, checked)}
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

SubjectFacetList.displayName = 'SubjectFacetList';

export default SubjectFacetList;
