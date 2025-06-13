
import { Play, Book, Headphones, Clock, User, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SearchResult } from '@/types/searchTypes';

interface SearchResultsListProps {
  results: SearchResult[];
  loading: boolean;
}

const SearchResultsList = ({ results, loading }: SearchResultsListProps) => {
  const navigate = useNavigate();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'titulo':
        return <Book className="h-4 w-4" />;
      case 'podcast':
        return <Headphones className="h-4 w-4" />;
      default:
        return <Book className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'video':
        return { label: 'Vídeo', color: 'bg-red-100 text-red-800' };
      case 'titulo':
        return { label: 'Livro', color: 'bg-blue-100 text-blue-800' };
      case 'podcast':
        return { label: 'Podcast', color: 'bg-purple-100 text-purple-800' };
      default:
        return { label: 'Recurso', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const handleResourceClick = (resourceId: number) => {
    navigate(`/recurso/${resourceId}`);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-200 rounded flex-shrink-0"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => {
        const typeBadge = getTypeBadge(result.type);
        
        return (
          <Card key={result.id} className="group hover-lift animate-fade-in">
            <CardContent className="p-6">
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="relative w-24 h-24 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                  {result.thumbnail ? (
                    <img 
                      src={result.thumbnail} 
                      alt={result.title}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    {getTypeIcon(result.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`${typeBadge.color} flex items-center gap-1`}>
                        {getTypeIcon(result.type)}
                        {typeBadge.label}
                      </Badge>
                      {result.duration && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {result.duration}
                        </div>
                      )}
                      {result.pages && (
                        <div className="text-xs text-gray-500">
                          {result.pages} páginas
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-lsb-primary transition-colors">
                    {result.title}
                  </h3>

                  {/* Author and Year */}
                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {result.author}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {result.year}
                    </div>
                    <Badge variant="outline" className="w-fit">
                      {result.subject}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {result.description}
                  </p>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  <Button 
                    className="bg-lsb-primary hover:bg-lsb-primary/90 text-white"
                    onClick={() => handleResourceClick(result.id)}
                  >
                    {result.type === 'video' && 'Assistir'}
                    {result.type === 'podcast' && 'Ouvir'}
                    {result.type === 'titulo' && 'Ler'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SearchResultsList;
