
import { Play, Book, Headphones, Clock, User, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchResult } from '@/types/searchTypes';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import InfiniteContentSkeleton from '@/components/skeletons/InfiniteContentSkeleton';
import { getTypeBadgeLabel, getTypeBadgeColor } from '@/utils/resourceUtils';
import ThumbnailPlaceholder from '@/components/ui/ThumbnailPlaceholder';
import { shouldShowImage } from '@/utils/thumbnailUtils';

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
    console.group('🎯 SEARCH GRID NAVIGATION - VALIDAÇÃO RIGOROSA');
    console.log('📋 Clicked resource:', {
      id: result.id,
      originalId: result.originalId,
      type: result.type,
      title: result.title.substring(0, 50) + '...',
      filtroAtual: searchParams.get('filtros')
    });
    
    // ✅ FASE 4: Validação Rigorosa de ID antes da navegação
    const invalidIds = ['', '0', 'undefined', 'null', 'missing-id', null, undefined];
    const navigationId = String(result.id);
    
    if (invalidIds.includes(navigationId) || !navigationId.trim()) {
      console.error('❌ ID INVÁLIDO DETECTADO - NAVEGAÇÃO BLOQUEADA:', {
        resultId: result.id,
        originalId: result.originalId,
        navigationId: navigationId,
        type: result.type,
        title: result.title.substring(0, 30) + '...',
        invalidReason: invalidIds.includes(navigationId) ? 'ID na lista de inválidos' : 'ID vazio após trim'
      });
      console.groupEnd();
      
      // Mostrar feedback visual para o usuário
      console.warn('🚫 Navegação bloqueada: ID inválido para este item');
      return;
    }
    
    console.log('✅ ID VÁLIDO - PROSSEGUINDO COM NAVEGAÇÃO:', {
      validId: navigationId,
      type: result.type,
      title: result.title.substring(0, 40) + '...'
    });
    
    // Preserve current search state in the detail page URL
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set('from', 'buscar');
    
    const targetRoute = `/recurso/${navigationId}?${currentParams.toString()}`;
    console.log('🔗 Navigating to with preserved state:', targetRoute);
    console.groupEnd();
    
    navigate(targetRoute);
  };

  if (loading && results.length === 0) {
    return <InfiniteContentSkeleton count={6} variant="grid" />;
  }

  return (
    <div ref={containerRef} className="space-y-4 md:space-y-6">
      {/* Mobile: Single column, Tablet: 2 columns, Desktop: 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {results.map(result => {
          const typeBadge = getTypeBadge(result.type, result.documentType);
          
          // ✅ VALIDAÇÃO ADICIONAL: Log de IDs suspeitos durante render
          const invalidIds = ['', '0', 'undefined', 'null', 'missing-id'];
          if (!result.id || invalidIds.includes(String(result.id))) {
            console.warn('⚠️ ITEM COM ID SUSPEITO RENDERIZADO:', {
              id: result.id,
              originalId: result.originalId,
              title: result.title.substring(0, 30) + '...',
              type: result.type,
              willBlockNavigation: true
            });
          }
          
          return (
            <Card key={result.id} className="group hover-lift animate-fade-in">
              <CardContent className="p-0">
                <div className="space-y-3 md:space-y-4">
                  {/* Thumbnail - Responsive height */}
                  <div className="relative h-32 sm:h-36 md:h-40 bg-gray-100 rounded-t-lg overflow-hidden">
                    {shouldShowImage(result.thumbnail, result.type) ? (
                      <img 
                        src={result.thumbnail} 
                        alt={result.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ThumbnailPlaceholder
                        type={result.type}
                        className="w-full h-full rounded-t-lg"
                        size="large"
                      />
                    )}
                    
                    <div className="absolute top-2 left-2">
                      <Badge className={`${typeBadge.color} flex items-center gap-1 text-xs`}>
                        {getTypeIcon(result.type)}
                        <span className="hidden sm:inline">{typeBadge.label}</span>
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

                  <div className="p-3 md:p-4 space-y-2 md:space-y-3">
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
                    </div>

                    <p className="text-xs md:text-sm text-gray-600 line-clamp-2 md:line-clamp-3">
                      {result.description}
                    </p>

                    <Badge variant="outline" className="w-fit text-xs">
                      {result.subject}
                    </Badge>

                    <Button 
                      className="w-full mt-3 md:mt-4 bg-lsb-primary hover:bg-lsb-primary/90 text-white text-sm md:text-base py-2" 
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

      {/* Infinite Scroll Loading */}
      {enableInfiniteScroll && shouldShowLoading && (
        <div ref={loadingRef}>
          <InfiniteContentSkeleton count={3} variant="grid" />
        </div>
      )}

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

export default SearchResultsGrid;
