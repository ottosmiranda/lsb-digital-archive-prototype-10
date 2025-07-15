import { Play, Book, Headphones, Clock, User, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WipeButton } from '@/components/ui/WipeButton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchResult } from '@/types/searchTypes';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import InfiniteContentSkeleton from '@/components/skeletons/InfiniteContentSkeleton';
import { getTypeBadgeLabel, getTypeBadgeColor } from '@/utils/resourceUtils';
import ThumbnailPlaceholder from '@/components/ui/ThumbnailPlaceholder';
import { shouldShowImage } from '@/utils/thumbnailUtils';

interface SearchResultsListProps {
  results: SearchResult[];
  loading: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  enableInfiniteScroll?: boolean;
}

const SearchResultsList = ({ 
  results, 
  loading,
  hasMore = false,
  onLoadMore = () => {},
  enableInfiniteScroll = false
}: SearchResultsListProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
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
    console.group('🎧 SEARCH LIST - Verificação badges podcasts');
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
    console.group('🎯 SEARCH LIST NAVIGATION (REAL IDs FIXED)');
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
    
    // Preserve current search state in the detail page URL
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set('from', 'buscar');
    
    const targetRoute = `/recurso/${navigationId}?${currentParams.toString()}`;
    console.log('🔗 Navigating to with preserved state:', targetRoute);
    console.groupEnd();
    
    navigate(targetRoute);
  };

  if (loading && results.length === 0) {
    return <InfiniteContentSkeleton count={6} variant="list" />;
  }

  return (
    <div ref={containerRef} className="space-y-4 md:space-y-6">
      <div className="space-y-3 md:space-y-4">
        {results.map((result) => {
          const typeBadge = getTypeBadge(result.type, result.documentType);
          
          return (
            <Card key={result.id} className="group hover-lift animate-fade-in">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  {/* Thumbnail - Increased height for better visualization */}
                  <div className="relative w-full sm:w-32 md:w-36 h-32 md:h-36 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                    {shouldShowImage(result.thumbnail, result.type) ? (
                      <img 
                        src={result.thumbnail} 
                        alt={result.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ThumbnailPlaceholder
                        type={result.type}
                        className="w-full h-full"
                        size="medium"
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2 md:space-y-3 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`${typeBadge.color} flex items-center gap-1 text-xs`}>
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

                    <h3 className="font-semibold text-base md:text-lg line-clamp-2 group-hover:text-lsb-primary transition-colors">
                      {result.title}
                    </h3>

                    <div className="flex flex-col sm:flex-row sm:items-center text-xs md:text-sm text-gray-600 space-y-1 sm:space-y-0 sm:space-x-4">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{result.author}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                        {result.year}
                      </div>
                      <Badge variant="outline" className="w-fit text-xs">
                        {result.subject}
                      </Badge>
                    </div>

                    <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
                      {result.description}
                    </p>
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <WipeButton 
                      className="w-full sm:w-auto text-sm"
                      onClick={() => handleResourceClick(result)}
                    >
                      {result.type === 'video' && 'Assistir'}
                      {result.type === 'podcast' && 'Ouvir'}
                      {result.type === 'titulo' && (result.documentType === 'Artigo' ? 'Ler' : 'Ler')}
                    </WipeButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Infinite Scroll Loading */}
      {enableInfiniteScroll && shouldShowLoading && (
        <div ref={loadingRef}>
          <InfiniteContentSkeleton count={3} variant="list" />
        </div>
      )}

      {/* Load More Button (fallback) */}
      {!enableInfiniteScroll && hasMore && (
        <div className="text-center mt-6 md:mt-8">
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

export default SearchResultsList;
