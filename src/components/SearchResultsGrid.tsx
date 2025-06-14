import { Play, Book, Headphones, Clock, User, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SearchResult } from '@/types/searchTypes';
interface SearchResultsGridProps {
  results: SearchResult[];
  loading: boolean;
}
const SearchResultsGrid = ({
  results,
  loading
}: SearchResultsGridProps) => {
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
        return {
          label: 'Vídeo',
          color: 'bg-red-100 text-red-800'
        };
      case 'titulo':
        return {
          label: 'Livro',
          color: 'bg-blue-100 text-blue-800'
        };
      case 'podcast':
        return {
          label: 'Podcast',
          color: 'bg-purple-100 text-purple-800'
        };
      default:
        return {
          label: 'Recurso',
          color: 'bg-gray-100 text-gray-800'
        };
    }
  };
  const handleResourceClick = (resourceId: number) => {
    navigate(`/recurso/${resourceId}`);
  };
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.style.display = 'none';
    const placeholder = target.nextElementSibling as HTMLElement;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  };
  if (loading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({
        length: 6
      }).map((_, index) => <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-40 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>)}
      </div>;
  }
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map(result => {
      const typeBadge = getTypeBadge(result.type);
      return <Card key={result.id} className="group hover-lift animate-fade-in">
            <CardContent className="p-0">
              <div className="space-y-4">
                {/* Thumbnail */}
                <div className="relative h-40 bg-gray-100 rounded-t-lg overflow-hidden">
                  {result.thumbnail ? <img src={result.thumbnail} alt={result.title} className="w-full h-full object-cover" onError={handleImageError} /> : null}
                  {/* Placeholder - shown when no image or image fails */}
                  <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-200" style={{
                display: result.thumbnail ? 'none' : 'flex'
              }}>
                    {getTypeIcon(result.type)}
                    <span className="text-xs mt-2 font-medium">Miniatura</span>
                    <span className="text-xs">Unavailable</span>
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge className={`${typeBadge.color} flex items-center gap-1`}>
                      {getTypeIcon(result.type)}
                      {typeBadge.label}
                    </Badge>
                  </div>
                  {result.duration && <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {result.duration}
                    </div>}
                  {result.pages && <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {result.pages} páginas
                    </div>}
                </div>

                <div className="p-4 space-y-3">
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
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {result.description}
                  </p>

                  {/* Subject */}
                  <Badge variant="outline" className="w-fit">
                    {result.subject}
                  </Badge>

                  {/* Action Button */}
                  <Button className="w-full mt-4 bg-lsb-primary hover:bg-lsb-primary/90 text-white" onClick={() => handleResourceClick(result.id)}>
                    {result.type === 'video' && 'Assistir Vídeo'}
                    {result.type === 'podcast' && 'Ouvir Podcast'}
                    {result.type === 'titulo' && 'Ler Agora'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>;
    })}
    </div>;
};
export default SearchResultsGrid;