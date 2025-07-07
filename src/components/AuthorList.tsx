
import React, { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SearchResult } from '@/types/searchTypes';
import { extractAuthorsFromResults } from '@/utils/searchUtils';

interface AuthorListProps {
  currentResults: SearchResult[];
  selectedAuthors: string[];
  onAuthorsChange: (authors: string[]) => void;
}

const AuthorList = ({ currentResults, selectedAuthors, onAuthorsChange }: AuthorListProps) => {
  const availableAuthors = useMemo(() => {
    return extractAuthorsFromResults(currentResults)
      .slice(0, 10) // Limit to top 10 authors
      .sort((a, b) => b.count - a.count);
  }, [currentResults]);

  const handleAuthorToggle = (authorName: string, checked: boolean) => {
    if (checked) {
      onAuthorsChange([...selectedAuthors, authorName]);
    } else {
      onAuthorsChange(selectedAuthors.filter(a => a !== authorName));
    }
  };

  if (availableAuthors.length === 0) {
    return (
      <div className="text-sm text-gray-500 p-2">
        Nenhum autor encontrado nos resultados atuais
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {availableAuthors.map((author) => (
        <div key={author.name} className="flex items-center space-x-2">
          <Checkbox
            id={`author-${author.name}`}
            checked={selectedAuthors.includes(author.name)}
            onCheckedChange={(checked) => handleAuthorToggle(author.name, !!checked)}
          />
          <Label 
            htmlFor={`author-${author.name}`} 
            className="text-sm cursor-pointer flex-1"
          >
            <div className="flex justify-between items-center">
              <span>{author.name}</span>
              <span className="text-xs text-gray-500">({author.count})</span>
            </div>
          </Label>
        </div>
      ))}
    </div>
  );
};

export default AuthorList;
