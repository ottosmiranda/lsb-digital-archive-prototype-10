
import { useState, useEffect } from 'react';
import { Search, Clock, TrendingUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useSearchAnalytics } from '@/hooks/useSearchAnalytics';

interface EnhancedSearchSuggestionsProps {
  query: string;
  onSuggestionClick: (suggestion: string) => void;
  onClose: () => void;
  isVisible: boolean;
  className?: string;
}

const EnhancedSearchSuggestions = ({ 
  query, 
  onSuggestionClick, 
  onClose, 
  isVisible,
  className
}: EnhancedSearchSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { recentSearches, trendingSearches } = useSearchAnalytics();
  
  // Popular topics remain static as they're editorial content
  const [popularTopics] = useState(['Comunicação', 'Direitos', 'Literatura', 'História']);

  useEffect(() => {
    if (query.length > 1) {
      // Enhanced suggestions with better matching
      const mockSuggestions = [
        'Libras básico para iniciantes',
        'Gramática da língua de sinais',
        'Alfabeto em libras',
        'Números e quantidades',
        'Interpretação de libras',
        'Cultura surda brasileira',
        'Educação inclusiva',
        'História da comunidade surda',
        'Tecnologia assistiva para surdos',
        'Literatura surda brasileira'
      ].filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
      );
      
      setSuggestions(mockSuggestions.slice(0, 6));
    } else {
      setSuggestions([]);
    }
  }, [query]);

  if (!isVisible) return null;

  const showSuggestions = suggestions.length > 0;
  const showRecent = query.length <= 1 && recentSearches.length > 0;
  const showTrending = query.length <= 1 && trendingSearches.length > 0;
  const showPopular = query.length <= 1 && popularTopics.length > 0;

  if (!showSuggestions && !showRecent && !showTrending && !showPopular) return null;

  return (
    <div className={cn(
      "absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] max-h-96 overflow-y-auto",
      className
    )}>
      {/* Search Suggestions */}
      {showSuggestions && (
        <div className="p-3">
          <div className="text-xs text-gray-500 px-3 py-2 font-medium flex items-center gap-2">
            <Search className="h-3 w-3" />
            Sugestões para "{query}"
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              className="w-full text-left px-3 py-3 hover:bg-lsb-section rounded-md flex items-center gap-3 text-sm group transition-colors"
            >
              <Search className="h-4 w-4 text-gray-400 group-hover:text-lsb-primary" />
              <span className="flex-1">{suggestion}</span>
              {index < 3 && (
                <Badge variant="outline" className="text-xs">
                  Popular
                </Badge>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Recent Searches */}
      {showRecent && (
        <div className="p-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 px-3 py-2 font-medium flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Buscas Recentes
          </div>
          {recentSearches.slice(0, 6).map((search, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(search)}
              className="w-full text-left px-3 py-3 hover:bg-lsb-section rounded-md flex items-center gap-3 text-sm group transition-colors"
            >
              <Clock className="h-4 w-4 text-gray-400 group-hover:text-lsb-primary" />
              <span>{search}</span>
            </button>
          ))}
        </div>
      )}

      {/* Trending Searches */}
      {showTrending && (
        <div className="p-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 px-3 py-2 font-medium flex items-center gap-2">
            <TrendingUp className="h-3 w-3" />
            Em Alta
          </div>
          {trendingSearches.map((search, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(search)}
              className="w-full text-left px-3 py-3 hover:bg-lsb-section rounded-md flex items-center gap-3 text-sm group transition-colors"
            >
              <TrendingUp className="h-4 w-4 text-red-500 group-hover:text-red-600" />
              <span>{search}</span>
              <Badge className="bg-red-100 text-red-700 text-xs">
                Trending
              </Badge>
            </button>
          ))}
        </div>
      )}

      {/* Popular Topics */}
      {showPopular && (
        <div className="p-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 px-3 py-2 font-medium flex items-center gap-2">
            <Star className="h-3 w-3" />
            Tópicos Populares
          </div>
          <div className="flex flex-wrap gap-2 px-3">
            {popularTopics.map((topic, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(topic)}
                className="px-3 py-1 bg-lsb-section hover:bg-lsb-primary hover:text-white rounded-full text-xs transition-colors"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchSuggestions;
