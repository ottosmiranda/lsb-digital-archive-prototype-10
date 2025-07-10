import { Play, Book, Headphones, Clock, User, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SearchResult } from '@/types/searchTypes';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import InfiniteContentSkeleton from '@/components/skeletons/InfiniteContentSkeleton';
import { getTypeBadgeLabel, getTypeBadgeColor } from '@/utils/resourceUtils';
import { idValidationService } from '@/services/idValidationService';

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
    console.group('🎯 SEARCH GRID NAVIGATION (WITH ID VALIDATION)');
    console.log('📋 Clicked resource:', {
      id: result.id,
      originalId: result.originalId,
      type: result.type,
      title: result.title.substring(0, 50) + '...'
    });
    
    // ✅ NOVA VALIDAÇÃO: Verificar ID antes de navegar
    const validation = idValidationService.validateId(String(result.id));
    
    if (!validation.isValid) {
      console.log('❌ INVALID ID DETECTED IN SEARCH GRID');
      
      // ✅ Rastrear origem do ID inválido
      idValidationService.trackInvalidIdOrigin(
        String(result.id), 
        'SEARCH_GRID_CLICK', 
        {
          resultTitle: result.title,
          resultType: result.type,
          resultOriginalId: result.originalId,
          searchContext: 'grid_view'
        }
      );

      console.log('🔄 Attempting to use originalId as fallback');
      
      // ✅ Tentar usar originalId como fallback
      const originalValidation = result.originalId ? 
        idValidationService.validateId(result.originalId) : 
        { isValid: false };

      if (originalValidation.isValid && result.originalId) {
        console.log('✅ Using valid originalId:', result.originalId);
        navigate(`/recurso/${result.originalId}`);
      } else {
        console.log('❌ Both id and originalId are invalid, redirecting to search');
        navigate('/buscar');
      }
      
      console.groupEnd();
      return;
    }
    
    // ✅ ID válido - prosseguir normalmente
    const navigationId = String(result.id);
    console.log('✅ Using valid ID for navigation:', navigationId);
    
    const targetRoute = `/recurso/${navigationId}`;
    console.log('🔗 Navigating to:', targetRoute);
    console.groupEnd();
    
    navigate(targetRoute);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.style.display = 'none';
    const placeholder = target.nextElementSibling as HTMLElement;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  };

  if (loading && results.length === 0) {
    return <InfiniteContentSkeleton count={6} variant="grid" />;
  }

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map(result => {
          const typeBadge = getTypeBadge(result.type, result.documentType);
          
          // ✅ NOVA VALIDAÇÃO: Marcar visualmente recursos com IDs inválidos
          const validation = idValidationService.validateId(String(result.id));
          const hasInvalidId = !validation.isValid;
          
          return (
            <Card key={result.id} className={`group hover-lift animate-fade-in ${hasInvalidId ? 'border-red-200 bg-red-50' : ''}`}>
              <CardContent className="p-0">
                <div className="space-y-4">
                  {/* ✅ Indicador visual para IDs inválidos */}
                  {hasInvalidId && (
                    <div className="bg-red-100 border border-red-200 rounded-t-lg p-2">
                      <p className="text-xs text-red-600 font-medium">⚠️ ID inválido detectado</p>
                    </div>
                  )}
                  
                  {/* Thumbnail */}
                  <div className="relative h-40 bg-gray-100 rounded-t-lg overflow-hidden">
                    {result.thumbnail ? (
                      <img 
                        src={result.thumbnail} 
                        alt={result.title}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    ) : null}
                    
                    {/* Placeholder */}
                    <div 
                      className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-200"
                      style={{ display: result.thumbnail ? 'none' : 'flex' }}
                    >
                      {getTypeIcon(result.type)}
                      <span className="text-xs mt-2 font-medium">Miniatura</span>
                      <span className="text-xs">Indisponível</span>
                    </div>
                    
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
                      className={`w-full mt-4 ${hasInvalidId ? 'bg-red-500 hover:bg-red-600' : 'bg-lsb-primary hover:bg-lsb-primary/90'} text-white`}
                      onClick={() => handleResourceClick(result)}
                    >
                      {hasInvalidId ? 'Tentar Acessar' : (
                        result.type === 'video' ? 'Assistir Vídeo' :
                        result.type === 'podcast' ? 'Ouvir Podcast' :
                        (result.documentType === 'Artigo' ? 'Ler Artigo' : 'Ler Agora')
                      )}
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

      {/* Load More Button (fallback) */}
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
