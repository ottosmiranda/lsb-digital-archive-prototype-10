
import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SearchResult } from '@/types/searchTypes';
import { extractAuthorsFromResults } from '@/utils/searchUtils';

interface AuthorListProps {
  currentResults: SearchResult[];
  selectedAuthors: string[];
  onAuthorsChange: (authors: string[]) => void;
}

const AuthorList = React.memo(({ currentResults, selectedAuthors, onAuthorsChange }: AuthorListProps) => {
  const [showAll, setShowAll] = useState(false);

  const authors = useMemo(() => {
    return extractAuthorsFromResults(currentResults)
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [currentResults]);

  const displayedAuthors = useMemo(() => {
    return showAll ? authors : authors.slice(0, 5);
  }, [authors, showAll]);

  const handleAuthorChange = useCallback((authorName: string, checked: boolean) => {
    const newAuthors = checked 
      ? [...selectedAuthors, authorName]
      : selectedAuthors.filter(name => name !== authorName);
    onAuthorsChange(newAuthors);
  }, [selectedAuthors, onAuthorsChange]);

  const toggleShowAll = useCallback(() => {
    setShowAll(prev => !prev);
  }, []);

  if (authors.length === 0) {
    return (
      <div className="text-sm text-gray-500 p-3">
        Nenhum autor encontrado nos resultados atuais
      </div>
    );
  }

  return (
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
      
      {authors.length > 5 && (
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
              Mostrar mais ({authors.length - 5} outros)
            </>
          )}
        </Button>
      )}
    </div>
  );
});

AuthorList.displayName = 'AuthorList';

export default AuthorList;
