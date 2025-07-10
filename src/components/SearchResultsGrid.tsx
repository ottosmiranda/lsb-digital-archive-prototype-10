import { Play, Book, Headphones, Clock, User, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SearchResult } from '@/types/searchTypes';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import InfiniteContentSkeleton from '@/components/skeletons/InfiniteContentSkeleton';
import { getTypeBadgeLabel, getTypeBadgeColor } from '@/utils/resourceUtils';
import ThumbnailPlaceholder from '@/components/ui/ThumbnailPlaceholder';
import { useThumbnailFallback } from '@/hooks/useThumbnailFallback';
import { getThumbnailDisplayLogic } from '@/utils/thumbnailUtils';

interface SearchResultsGridProps {
  results: SearchResult[];
  loading: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  enableInfiniteScroll?: boolean;
}

const SearchResultsGrid = ({
  results,
  loading,
  hasMore = false,
  onLoadMore = () => {},
  enableInfiniteScroll = false
}: SearchResultsGridProps) => {
  const navigate = useNavigate();
  
  const { loadingRef, containerRef, shouldShowLoading } = useInfiniteScroll({
    hasMore,
    loading,
    onLoadMore,
    threshold: 70,
    enabled: enableInfiniteScroll
  });

  // ✅ LOG TEMPORÁRIO: Verificar dados dos podcasts
  const podcastResults = results.filter(r => r.type === 'podcast');
  if (podcastResults.length > 0) {
    console.group('🎧 SEARCH GRID - Verificação badges podcasts');
    podcastResults.slice(0, 3).forEach((podcast, index) => {
      console.log(`Podcast ${index + 1}:`, {
        title: podcast.title.substring(0, 40) + '...',
        subject: podcast.subject,
        program: (podcast as any).program,
        badgeOK: podcast.subject !== (podcast as any).program
      });
    });
    console.groupEnd();
  }

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

  const getTypeBadge = (type: string, documentType?: string) => {
    const label = getTypeBadgeLabel(type, documentType);
    const color = getTypeBadgeColor(type);
    return { label, color };
  };

  const handleResourceClick = (result: SearchResult) => {
    console.group('🎯 SEARCH GRID NAVIGATION (REAL IDs FIXED)');
    console.log('📋 Clicked resource:', {
      id: result.id,
      originalId: result.originalId,
      type: result.type,
      title: result.title.substring(0, 50) + '...',
      idCorrection: '✅ Usando ID real da API'
    });
    
    // ✅ CORRIGIDO: Usar o ID real que agora é consistente entre busca e homepage
    const navigationId = String(result.id);
    console.log('🔗 Using REAL API ID for navigation:', navigationId);
    
    const targetRoute = `/recurso/${navigationId}`;
    console.log('🔗 Navigating to:', targetRoute);
    console.groupEnd();
    
    navigate(targetRoute);
  };

  if (loading && results.length === 0) {
    return <InfiniteContentSkeleton count={6} variant="grid" />;
  }

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map(result => {
          const typeBadge = getTypeBadge(result.type, result.documentType);
          const { shouldShowImage, shouldShowPlaceholder, imageUrl } = getThumbnailDisplayLogic(result.thumbnail);
          
          return (
            <Card key={result.id} className="group hover-lift animate-fade-in">
              <CardContent className="p-0">
                <div className="space-y-4">
                  {/* Thumbnail */}
                  <div className="relative h-40 bg-gray-100 rounded-t-lg overflow-hidden">
                    {shouldShowImage ? (
                      <img 
                        src={imageUrl} 
                        alt={result.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ThumbnailPlaceholder
                        type={result.type}
                        className="w-full h-40 rounded-t-lg"
                        size="large"
                      />
                    )}
                    
                    <div className="absolute top-2 left-2">
                      <Badge className={`${typeBadge.color} flex items-center gap-1`}>
                        {getTypeIcon(result.type)}
                        {typeBadge.label}
                      </Badge>
                    </div>
                    
                    {result.duration && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {result.duration}
                      </div>
                    )}
                    
                    {result.pages && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {result.pages} páginas
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-lsb-primary transition-colors">
                      {result.title}
                    </h3>

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

                    <p className="text-sm text-gray-600 line-clamp-3">
                      {result.description}
                    </p>

                    <Badge variant="outline" className="w-fit">
                      {result.subject}
                    </Badge>

                    <Button 
                      className="w-full mt-4 bg-lsb-primary hover:bg-lsb-primary/90 text-white" 
                      onClick={() => handleResourceClick(result)}
                    >
                      {result.type === 'video' && 'Assistir Vídeo'}
                      {result.type === 'podcast' && 'Ouvir Podcast'}
                      {result.type === 'titulo' && (result.documentType === 'Artigo' ? 'Ler Artigo' : 'Ler Agora')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {enableInfiniteScroll && shouldShowLoading && (
        <div ref={loadingRef}>
          <InfiniteContentSkeleton count={3} variant="grid" />
        </div>
      )}

      {!enableInfiniteScroll && hasMore && (
        <div className="text-center mt-8">
          <Button 
            onClick={onLoadMore}
            disabled={loading}
            variant="outline"
            className="border-lsb-primary text-lsb-primary hover:bg-lsb-primary hover:text-white"
          >
            {loading ? 'Carregando...' : 'Carregar Mais'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchResultsGrid;
