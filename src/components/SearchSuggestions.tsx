
import { useState, useEffect } from 'react';
import { Search, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SearchSuggestionsProps {
  query: string;
  onSuggestionClick: (suggestion: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

const SearchSuggestions = ({ query, onSuggestionClick, onClose, isVisible }: SearchSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches] = useState<string[]>([
    'Educação Inclusiva',
    'Cultura Surda',
    'Literatura em Libras'
  ]);

  const trendingTopics = [
    'Intérprete de Libras',
    'Pedagogia Surda',
    'Acessibilidade Digital',
    'História dos Surdos'
  ];

  useEffect(() => {
    if (query.length > 1) {
      // Simulate API call for suggestions
      const mockSuggestions = [
        'Educação de Surdos',
        'Educação Inclusiva',
        'Educação Bilíngue',
        'Cultura Surda Brasileira',
        'Cultura e Identidade Surda',
        'Literatura Surda',
        'Literatura Infantil',
        'Libras Avançado',
        'Libras Básico'
      ].filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      
      setSuggestions(mockSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  if (!isVisible) return null;

  return (
    <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto animate-fade-in">
      <CardContent className="p-4">
        {suggestions.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
              <Search className="h-3 w-3 mr-1" />
              Sugestões
            </h4>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-2"
                  onClick={() => onSuggestionClick(suggestion)}
                >
                  <Search className="h-3 w-3 mr-2 text-gray-400" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {query.length <= 1 && recentSearches.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Buscas Recentes
            </h4>
            <div className="space-y-1">
              {recentSearches.map((search, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-2"
                  onClick={() => onSuggestionClick(search)}
                >
                  <Clock className="h-3 w-3 mr-2 text-gray-400" />
                  {search}
                </Button>
              ))}
            </div>
          </div>
        )}

        {query.length <= 1 && (
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Tópicos em Alta
            </h4>
            <div className="flex flex-wrap gap-2">
              {trendingTopics.map((topic, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-lsb-accent hover:text-lsb-primary transition-colors"
                  onClick={() => onSuggestionClick(topic)}
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchSuggestions;
