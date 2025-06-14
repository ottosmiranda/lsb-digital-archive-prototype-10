
import React, { useMemo } from 'react';
import { SearchResult } from '@/types/searchTypes';
import { extractAuthorsFromResults, normalizeText } from '@/utils/searchUtils';

interface AuthorSuggestionsProps {
  query: string;
  currentResults: SearchResult[];
  onSelect: (authorName: string) => void;
}

const AuthorSuggestions = React.memo(({ query, currentResults, onSelect }: AuthorSuggestionsProps) => {
  const suggestions = useMemo(() => {
    const authors = extractAuthorsFromResults(currentResults);
    const queryNormalized = normalizeText(query);
    
    return authors
      .filter(author => normalizeText(author.name).includes(queryNormalized))
      .slice(0, 8) // Limit to 8 suggestions
      .sort((a, b) => {
        // Sort by relevance (exact match first, then by count)
        const aExact = normalizeText(a.name).startsWith(queryNormalized);
        const bExact = normalizeText(b.name).startsWith(queryNormalized);
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        return b.count - a.count;
      });
  }, [query, currentResults]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
      <div className="p-2">
        <div className="text-xs text-gray-500 mb-2 px-2">Autores sugeridos</div>
        {suggestions.map((author, index) => (
          <button
            key={`${author.name}-${index}`}
            onClick={() => onSelect(author.name)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-between"
          >
            <span className="text-gray-800">{author.name}</span>
            <span className="text-xs text-gray-500">({author.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
});

AuthorSuggestions.displayName = 'AuthorSuggestions';

export default AuthorSuggestions;
