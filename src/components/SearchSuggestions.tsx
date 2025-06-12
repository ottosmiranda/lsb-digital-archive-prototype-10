
import { useState, useEffect } from 'react';
import { Search, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchSuggestionsProps {
  query: string;
  onSuggestionClick: (suggestion: string) => void;
  onClose: () => void;
  isVisible: boolean;
  className?: string;
}

const SearchSuggestions = ({ 
  query, 
  onSuggestionClick, 
  onClose, 
  isVisible,
  className
}: SearchSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches] = useState(['Libras básico', 'Gramática', 'Alfabeto', 'Números']);
  const [trendingSearches] = useState(['Educação inclusiva', 'Interpretação', 'Cultura surda']);

  useEffect(() => {
    if (query.length > 1) {
      // Simulate API call for suggestions
      const mockSuggestions = [
        'Libras básico para iniciantes',
        'Gramática da língua de sinais',
        'Alfabeto em libras',
        'Números e quantidades',
        'Interpretação de libras',
        'Cultura surda brasileira'
      ].filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
      );
      
      setSuggestions(mockSuggestions.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [query]);

  if (!isVisible) return null;

  const showSuggestions = suggestions.length > 0;
  const showRecent = query.length <= 1 && recentSearches.length > 0;
  const showTrending = query.length <= 1 && trendingSearches.length > 0;

  if (!showSuggestions && !showRecent && !showTrending) return null;

  return (
    <div className={cn(
      "absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto",
      className
    )}>
      {/* Search Suggestions */}
      {showSuggestions && (
        <div className="p-2">
          <div className="text-xs text-gray-500 px-3 py-2 font-medium">Sugestões</div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center gap-2 text-sm"
            >
              <Search className="h-4 w-4 text-gray-400" />
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {/* Recent Searches */}
      {showRecent && (
        <div className="p-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 px-3 py-2 font-medium">Buscas Recentes</div>
          {recentSearches.map((search, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(search)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center gap-2 text-sm"
            >
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{search}</span>
            </button>
          ))}
        </div>
      )}

      {/* Trending Searches */}
      {showTrending && (
        <div className="p-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 px-3 py-2 font-medium">Em Alta</div>
          {trendingSearches.map((search, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(search)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center gap-2 text-sm"
            >
              <TrendingUp className="h-4 w-4 text-gray-400" />
              <span>{search}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
