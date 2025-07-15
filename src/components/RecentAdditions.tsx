import { Book, Video, Headphones, Calendar, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useHomepageContentContext } from '@/contexts/HomepageContentContext';
import { useMemo } from 'react';
import RecentAdditionsSkeleton from '@/components/skeletons/RecentAdditionsSkeleton';
import ThumbnailPlaceholder from '@/components/ui/ThumbnailPlaceholder';
import { shouldShowImage } from '@/utils/thumbnailUtils';
import { useThumbnailFallback } from '@/hooks/useThumbnailFallback';
import { WipeButton } from '@/components/ui/WipeButton';

const getIcon = (type: string) => {
  switch (type) {
    case 'titulo':
      return Book;
    case 'video':
      return Video;
    case 'podcast':
      return Headphones;
    case 'artigo':
      return Book;
    default:
      return Book;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'titulo':
      return 'bg-blue-100 text-blue-800';
    case 'video':
      return 'bg-red-100 text-red-800';
    case 'podcast':
      return 'bg-purple-100 text-purple-800';
    case 'artigo':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'titulo':
      return 'Livro';
    case 'video':
      return 'Vídeo';
    case 'podcast':
      return 'Podcast';
    case 'artigo':
      return 'Artigo';
    default:
      return 'Conteúdo';
  }
};

const formatDate = (year: number) => {
  return new Date(year, 0, 1).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  });
};

const RecentAdditions = () => {
  const {
    content,
    rotatedContent,
    loading,
    error
  } = useHomepageContentContext();
  const {
    handleImageError
  } = useThumbnailFallback();

  console.log('🆕 RecentAdditions - Rendering with context data and rotation:', {
    loading,
    error,
    videosCount: content.videos.length,
    booksCount: content.books.length,
    podcastsCount: content.podcasts.length,
    articlesCount: content.articles.length,
    rotatedItemsCount: rotatedContent.recentAdditions.items.length,
    isRealContent: rotatedContent.recentAdditions.isRealContent
  });

  // Get mixed recent items - prioritize real content over rotated
  const recentItems = useMemo(() => {
    const allItems = [...content.videos, ...content.books, ...content.podcasts, ...content.articles];
    console.log('🆕 RecentAdditions - Processing items:', {
      totalRealItems: allItems.length,
      rotatedItems: rotatedContent.recentAdditions.items.length,
      useRotated: rotatedContent.recentAdditions.items.length > 0
    });

    // Check if we should use rotated content
    if (rotatedContent.recentAdditions.items.length > 0) {
      // Use rotated content from database
      console.log('🎲 Using rotated content from database');
      return rotatedContent.recentAdditions.items.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        author: item.author,
        description: item.description,
        thumbnail: item.thumbnail,
        addedDate: item.year.toString(),
        isRotated: !rotatedContent.recentAdditions.isRealContent
      }));
    }

    // Fallback to real content if no rotation available
    if (allItems.length === 0) {
      return [];
    }
    return allItems.sort((a, b) => b.year - a.year).slice(0, 6).map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      author: item.author,
      description: item.description,
      thumbnail: item.thumbnail,
      addedDate: item.year.toString(),
      isRotated: false
    }));
  }, [content, rotatedContent]);

  console.log('🆕 RecentAdditions - Final items:', recentItems);

  if (loading) {
    console.log('🆕 RecentAdditions - Showing skeleton loader');
    return <RecentAdditionsSkeleton />;
  }

  if (error) {
    console.log('🆕 RecentAdditions - Error state:', error);
  }

  return (
    <section className="py-12 md:py-16 lg:py-24 bg-lsb-section-gray">
      <div className="lsb-container">
        <div className="lsb-content">
          <div className="text-center mb-8 md:mb-12 animate-fade-in px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold lsb-primary mb-3 md:mb-4">
              Novidades no Acervo
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Confira os materiais mais recentes adicionados à nossa biblioteca
            </p>
          </div>

          {error && (
            <div className="bg-[#FEC641]/10 border border-[#FEC641]/30 rounded-lg p-3 md:p-4 mb-6 md:mb-8 mx-4">
              <p className="text-[#B78A00] text-center text-sm md:text-base">
                ⚠️ Problemas ao carregar conteúdo recente. Mostrando dados disponíveis.
              </p>
            </div>
          )}

          {recentItems.length > 0 ? (
            <>
              {/* Mobile: Single column, Tablet: 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 px-4">
                {recentItems.map((item, index) => {
                  const IconComponent = getIcon(item.type);
                  return (
                    <Link key={item.type + '-' + item.id} to={`/recurso/${item.id}`}>
                      <Card className="group hover-lift animate-fade-in cursor-pointer h-full" style={{
                        animationDelay: `${index * 0.1}s`
                      }}>
                        <CardContent className="p-4 md:p-6 h-full">
                          <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4 h-full">
                            <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-start">
                              <div className="w-12 h-12 bg-lsb-section rounded-lg flex items-center justify-center">
                                <IconComponent className="h-6 w-6 lsb-primary" />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0 text-center sm:text-left">
                              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2 md:mb-3">
                                <Badge className={getTypeColor(item.type)}>
                                  {getTypeLabel(item.type)}
                                </Badge>
                                {item.isRotated ? (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    <Star className="h-3 w-3 mr-1" />
                                    Destacado
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-lsb-accent text-lsb-primary border-lsb-accent">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Novo
                                  </Badge>
                                )}
                              </div>
                              
                              <h3 className="font-semibold text-base md:text-lg mb-1 md:mb-2 group-hover:text-lsb-primary transition-colors line-clamp-2">
                                {item.title}
                              </h3>
                              <p className="text-sm text-gray-600 mb-1 md:mb-2 truncate">{item.author}</p>
                              <p className="text-xs md:text-sm text-gray-700 line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                            
                            <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-end">
                              <div className="w-16 h-16 sm:w-20 sm:h-20 relative overflow-hidden rounded">
                                {shouldShowImage(item.thumbnail, item.type) ? (
                                  <img 
                                    src={item.thumbnail} 
                                    alt={item.title} 
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                    onError={handleImageError} 
                                  />
                                ) : (
                                  <ThumbnailPlaceholder 
                                    type={item.type as 'titulo' | 'video' | 'podcast'} 
                                    className="w-16 h-16 sm:w-20 sm:h-20" 
                                    size="small" 
                                    style={{
                                      display: item.thumbnail ? 'none' : 'flex'
                                    }} 
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              <div className="text-center mt-8 md:mt-12 px-4">
                <Link to="/buscar?ordenar=recentes">
                  <WipeButton className="px-6 md:px-8 py-3 md:py-4">
                    Ver Todas as Novidades
                  </WipeButton>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-6 md:py-8 px-4">
              <p className="text-gray-600 text-sm md:text-base">
                {loading ? 'Carregando novidades...' : 'Nenhum conteúdo disponível no momento.'}
              </p>
              {!loading && (
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  className="mt-4"
                >
                  Tentar Novamente
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RecentAdditions;
