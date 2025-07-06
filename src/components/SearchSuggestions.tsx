
import { useState, useEffect } from 'react';
import { Search, Clock, TrendingUp, BookOpen, User, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchAnalytics } from '@/hooks/useSearchAnalytics';
import { useIntelligentAutoComplete } from '@/hooks/useIntelligentAutoComplete';

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
  const { recentSearches, trendingSearches } = useSearchAnalytics();
  const { getSuggestions, isReady } = useIntelligentAutoComplete();
  
  // Get intelligent suggestions based on the query
  const intelligentSuggestions = (query.length > 1 && isReady) ? getSuggestions(query, 5) : [];

  // Helper function to get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'title': return BookOpen;
      case 'subject': return Tag;
      case 'author': return User;
      default: return Search;
    }
  };

  // Debug logging
  useEffect(() => {
    if (query.length > 1) {
      console.log('🔍 SearchSuggestions:', {
        query,
        isReady,
        suggestionsCount: intelligentSuggestions.length,
        recentCount: recentSearches.length,
        trendingCount: trendingSearches.length
      });
    }
  }, [query, isReady, intelligentSuggestions.length, recentSearches.length, trendingSearches.length]);

  if (!isVisible) return null;

  const showIntelligentSuggestions = intelligentSuggestions.length > 0;
  const showRecent = query.length <= 1 && recentSearches.length > 0;
  const showTrending = query.length <= 1 && trendingSearches.length > 0;

  if (!showIntelligentSuggestions && !showRecent && !showTrending) {
    // Show loading state if data is still loading
    if (query.length > 1 && !isReady) {
      return (
        <div className={cn(
          "absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] max-h-80 overflow-y-auto",
          className
        )}>
          <div className="p-3 text-center text-sm text-gray-500">
            Carregando sugestões...
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={cn(
      "absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] max-h-80 overflow-y-auto",
      className
    )}>
      {/* Intelligent Search Suggestions */}
      {showIntelligentSuggestions && (
        <div className="p-2">
          <div className="text-xs text-gray-500 px-3 py-2 font-medium">Sugestões</div>
          {intelligentSuggestions.map((suggestion, index) => {
            const IconComponent = getCategoryIcon(suggestion.category);
            return (
              <button
                key={`${suggestion.category}-${suggestion.term}-${index}`}
                onClick={() => onSuggestionClick(suggestion.term)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md flex items-center gap-2 text-sm"
              >
                <IconComponent className="h-4 w-4 text-gray-400" />
                <span className="capitalize">{suggestion.term}</span>
                {suggestion.frequency > 1 && (
                  <span className="ml-auto text-xs text-gray-400">
                    {suggestion.frequency}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Recent Searches */}
      {showRecent && (
        <div className="p-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 px-3 py-2 font-medium">Buscas Recentes</div>
          {recentSearches.slice(0, 5).map((search, index) => (
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
          {trendingSearches.slice(0, 4).map((search, index) => (
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
