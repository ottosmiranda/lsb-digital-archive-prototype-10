
import React from 'react';
import { SearchResult } from '@/types/searchTypes';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { extractAuthorsFromResults } from '@/utils/searchUtils';

interface AuthorListProps {
  currentResults: SearchResult[];
  selectedAuthors: string[];
  onAuthorsChange: (authors: string[]) => void;
}

const AuthorList = ({ currentResults, selectedAuthors, onAuthorsChange }: AuthorListProps) => {
  const availableAuthors = extractAuthorsFromResults(currentResults);

  const handleAuthorToggle = (authorName: string, checked: boolean) => {
    const newAuthors = checked
      ? [...selectedAuthors, authorName]
      : selectedAuthors.filter(author => author !== authorName);
    onAuthorsChange(newAuthors);
  };

  if (availableAuthors.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-2">
        Nenhum autor encontrado nos resultados
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-32 overflow-y-auto">
      {availableAuthors.slice(0, 10).map(({ name, count }) => (
        <div key={name} className="flex items-center space-x-2">
          <Checkbox
            id={`author-${name}`}
            checked={selectedAuthors.includes(name)}
            onCheckedChange={(checked) => handleAuthorToggle(name, !!checked)}
          />
          <Label htmlFor={`author-${name}`} className="text-sm cursor-pointer flex-1">
            {name} ({count})
          </Label>
        </div>
      ))}
    </div>
  );
};

export default AuthorList;
