
import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Globe, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SearchResult } from '@/types/searchTypes';
import { extractAuthorsFromResults } from '@/utils/searchUtils';
import { useAllAuthors } from '@/hooks/useAllAuthors';

interface AuthorListProps {
  currentResults: SearchResult[];
  selectedAuthors: string[];
  onAuthorsChange: (authors: string[]) => void;
}

const AuthorList = React.memo(({ currentResults, selectedAuthors, onAuthorsChange }: AuthorListProps) => {
  const [showAll, setShowAll] = useState(false);
  const [useGlobalAuthors, setUseGlobalAuthors] = useState(true);
  
  const { authors: allAuthors, loading: loadingAllAuthors, error: errorAllAuthors } = useAllAuthors();

  // Autores da página atual
  const currentPageAuthors = useMemo(() => {
    return extractAuthorsFromResults(currentResults)
      .sort((a, b) => b.count - a.count);
  }, [currentResults]);

  // Decidir qual lista usar
  const authorsToUse = useMemo(() => {
    if (!useGlobalAuthors || errorAllAuthors || allAuthors.length === 0) {
      return currentPageAuthors;
    }
    return allAuthors.map(author => ({ name: author.name, count: author.count }));
  }, [useGlobalAuthors, errorAllAuthors, allAuthors, currentPageAuthors]);

  const displayedAuthors = useMemo(() => {
    return showAll ? authorsToUse : authorsToUse.slice(0, 5);
  }, [authorsToUse, showAll]);

  const handleAuthorChange = useCallback((authorName: string, checked: boolean) => {
    const newAuthors = checked 
      ? [...selectedAuthors, authorName]
      : selectedAuthors.filter(name => name !== authorName);
    onAuthorsChange(newAuthors);
  }, [selectedAuthors, onAuthorsChange]);

  const toggleShowAll = useCallback(() => {
    setShowAll(prev => !prev);
  }, []);

  const toggleGlobalAuthors = useCallback(() => {
    setUseGlobalAuthors(prev => !prev);
  }, []);

  if (authorsToUse.length === 0) {
    return (
      <div className="text-sm text-gray-500 p-3">
        Nenhum autor encontrado
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toggle entre autores globais e da página */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={useGlobalAuthors ? "secondary" : "ghost"}
            size="xs"
            onClick={toggleGlobalAuthors}
            disabled={loadingAllAuthors || (errorAllAuthors && allAuthors.length === 0)}
            className="h-6 text-xs"
          >
            <Globe className="h-3 w-3 mr-1" />
            Todos
          </Button>
          <Button
            variant={!useGlobalAuthors ? "secondary" : "ghost"}
            size="xs"
            onClick={toggleGlobalAuthors}
            className="h-6 text-xs"
          >
            <Users className="h-3 w-3 mr-1" />
            Página
          </Button>
        </div>
        
        {useGlobalAuthors && loadingAllAuthors && (
          <Badge variant="outline" className="text-xs">
            Carregando...
          </Badge>
        )}
      </div>

      {/* Lista de autores */}
      <div className="space-y-2">
        {displayedAuthors.map((author) => (
          <div key={author.name} className="flex items-center space-x-2">
            <Checkbox
              id={`author-${author.name}`}
              checked={selectedAuthors.includes(author.name)}
              onCheckedChange={(checked) => handleAuthorChange(author.name, !!checked)}
            />
            <Label 
              htmlFor={`author-${author.name}`} 
              className="text-sm cursor-pointer flex-1 flex items-center justify-between"
            >
              <span className="text-gray-800">{author.name}</span>
              <span className="text-xs text-gray-500">({author.count})</span>
            </Label>
          </div>
        ))}
        
        {authorsToUse.length > 5 && (
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
                Mostrar mais ({authorsToUse.length - 5} outros)
              </>
            )}
          </Button>
        )}
      </div>

      {/* Status indicator */}
      <div className="text-xs text-gray-500 pt-2 border-t">
        {useGlobalAuthors ? (
          errorAllAuthors ? (
            <span className="text-amber-600">
              ⚠️ Usando autores da página (erro ao carregar todos)
            </span>
          ) : (
            <span>
              🌍 Mostrando todos os autores disponíveis ({authorsToUse.length})
            </span>
          )
        ) : (
          <span>
            📄 Mostrando autores desta página ({authorsToUse.length})
          </span>
        )}
      </div>
    </div>
  );
});

AuthorList.displayName = 'AuthorList';

export default AuthorList;
