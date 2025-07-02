
import { useState, useEffect } from 'react';
import { Search, Clock, TrendingUp, Star, BookOpen, User, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useSearchAnalytics } from '@/hooks/useSearchAnalytics';
import { useIntelligentAutoComplete } from '@/hooks/useIntelligentAutoComplete';

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
  const { recentSearches, trendingSearches } = useSearchAnalytics();
  const { getSuggestions, getPopularTerms, isReady } = useIntelligentAutoComplete();
  
  // Get intelligent suggestions based on the query
  const intelligentSuggestions = query.length > 1 ? getSuggestions(query, 6) : [];
  
  // Get popular terms from real data
  const popularSubjects = isReady ? getPopularTerms('subject', 4) : ['Comunicação', 'Direitos', 'Literatura', 'História'];

  // Helper function to get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'title': return BookOpen;
      case 'subject': return Tag;
      case 'author': return User;
      default: return Search;
    }
  };

  if (!isVisible) return null;

  const showIntelligentSuggestions = intelligentSuggestions.length > 0;
  const showRecent = query.length <= 1 && recentSearches.length > 0;
  const showTrending = query.length <= 1 && trendingSearches.length > 0;
  const showPopular = query.length <= 1 && popularSubjects.length > 0;

  if (!showIntelligentSuggestions && !showRecent && !showTrending && !showPopular) return null;

  return (
    <div className={cn(
      "absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] max-h-96 overflow-y-auto",
      className
    )}>
      {/* Intelligent Search Suggestions */}
      {showIntelligentSuggestions && (
        <div className="p-3">
          <div className="text-xs text-gray-500 px-3 py-2 font-medium flex items-center gap-2">
            <Search className="h-3 w-3" />
            Sugestões para "{query}"
          </div>
          {intelligentSuggestions.map((suggestion, index) => {
            const IconComponent = getCategoryIcon(suggestion.category);
            return (
              <button
                key={`${suggestion.category}-${suggestion.term}-${index}`}
                onClick={() => onSuggestionClick(suggestion.term)}
                className="w-full text-left px-3 py-3 hover:bg-lsb-section rounded-md flex items-center gap-3 text-sm group transition-colors"
              >
                <IconComponent className="h-4 w-4 text-gray-400 group-hover:text-lsb-primary" />
                <span className="flex-1 capitalize">{suggestion.term}</span>
                <div className="flex items-center gap-2">
                  {suggestion.matchType === 'prefix' && (
                    <Badge variant="outline" className="text-xs">
                      {suggestion.category === 'title' ? 'Título' : 
                       suggestion.category === 'subject' ? 'Assunto' : 'Autor'}
                    </Badge>
                  )}
                  {suggestion.frequency > 3 && (
                    <Badge className="bg-lsb-accent text-lsb-primary text-xs">
                      {suggestion.frequency}
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
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
            {popularSubjects.map((topic, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(topic)}
                className="px-3 py-1 bg-lsb-section hover:bg-lsb-primary hover:text-white rounded-full text-xs transition-colors capitalize"
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
