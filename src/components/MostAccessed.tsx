import { Flame } from 'lucide-react';
import ThumbnailPlaceholder from '@/components/ui/ThumbnailPlaceholder';
import { useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useHomepageContentContext } from '@/contexts/HomepageContentContext';
import { useNavigate } from 'react-router-dom';
import { SearchResult } from '@/types/searchTypes';
import { useTopItems } from './MostAccessed/useTopItems';
import MostAccessedSkeleton from '@/components/skeletons/MostAccessedSkeleton';
import { shouldShowImage } from '@/utils/thumbnailUtils';
import { WipeButton } from '@/components/ui/WipeButton';

const typeBadge = (type: string) => {
  switch (type) {
    case "podcast": return "Podcast";
    case "video": return "Vídeo";
    case "titulo": return "Livro";
    default: return "Conteúdo";
  }
};

const typeBadgeColor = (type: string) => {
  switch (type) {
    case "titulo": return "bg-blue-100 text-blue-800";
    case "video": return "bg-red-100 text-red-800";
    case "podcast": return "bg-purple-100 text-purple-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const MostAccessed = () => {
  const { content, loading } = useHomepageContentContext();
  const navigate = useNavigate();
  
  // FASE 3: Debug component data reception
  console.group('🔥 PHASE 3: MostAccessed Component Diagnostics');
  console.log('Loading state:', loading);
  console.log('Raw content received:', {
    videos: content.videos.length,
    books: content.books.length,
    podcasts: content.podcasts.length
  });
  
  const allData = [...content.videos, ...content.books, ...content.podcasts];
  console.log('Combined data array:', allData.length);
  console.log('Sample combined data:', allData.slice(0, 3));
  console.groupEnd();
  
  const topItems = useTopItems(allData);
  
  // FASE 3: Debug processed data
  console.log('🔥 PHASE 3: MostAccessed processed data:', {
    topItemsCount: topItems.length,
    topItemsSample: topItems.slice(0, 3)
  });

  // Create a stable autoplay plugin instance
  const autoplayPlugin = useRef(
    Autoplay({
      delay: 4500,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    })
  );

  if (loading) {
    return <MostAccessedSkeleton />;
  }

  if (topItems.length === 0) {
    return (
      <section className="py-8 md:py-16 lg:py-24 bg-lsb-section-gray">
        <div className="lsb-container">
          <div className="lsb-content">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold lsb-primary mb-3 md:mb-4">
                Mais Acessados
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
                Veja o que está em alta na plataforma
              </p>
            </div>
            <div className="text-center my-8 md:my-12 text-base md:text-lg text-gray-400">
              Nenhum conteúdo encontrado.
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-16 lg:py-24 bg-lsb-section-gray">
      <div className="lsb-container">
        <div className="lsb-content">
          {/* Section Header */}
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold lsb-primary mb-3 md:mb-4">
              Mais Acessados
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Veja o que está em alta na plataforma
            </p>
          </div>

          {/* Most Accessed Carousel */}
          <div className="relative">
            <Carousel
              plugins={[autoplayPlugin.current]}
              opts={{
                align: "start",
                loop: true,
                dragFree: false,
                containScroll: "trimSnaps",
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {topItems.map((item, index) => (
                  <CarouselItem key={`${item.type}-${item.id}`} className="pl-2 md:pl-4 basis-full xs:basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <Card
                      className="group hover-lift animate-fade-in cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full"
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => navigate(`/recurso/${item.id}`)}
                    >
                      <CardContent className="p-0 h-full flex flex-col">
                        <div className="relative overflow-hidden rounded-t-lg">
                          {shouldShowImage(item.thumbnail, item.type) ? (
                            <img 
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-32 md:h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <ThumbnailPlaceholder
                              type={item.type}
                              className="w-full h-32 md:h-40"
                              size="large"
                            />
                          )}
                          <Badge className="absolute top-2 md:top-3 left-2 md:left-3 bg-lsb-card-accent text-white flex items-center gap-1 text-xs">
                            <Flame className="h-3 w-3" />
                            <span className="hidden sm:inline">Mais Acessado</span>
                            <span className="sm:hidden">Popular</span>
                          </Badge>
                        </div>
                        <div className="p-2 md:p-3 flex-1 flex flex-col">
                          <Badge variant="outline" className={`mb-2 text-xs self-start ${typeBadgeColor(item.type)}`}>
                            {typeBadge(item.type)}
                          </Badge>
                          <h3 className="font-semibold text-xs md:text-sm mb-1 group-hover:text-lsb-primary transition-colors line-clamp-2 leading-tight flex-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-gray-600 mb-2 md:mb-3 line-clamp-1">{item.author}</p>
                          <WipeButton 
                            className="w-full text-xs py-2 px-3 text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/recurso/${item.id}`);
                            }}
                          >
                            Ver Detalhes
                          </WipeButton>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-6 lg:-left-8" />
              <CarouselNext className="hidden md:flex -right-6 lg:-right-8" />
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MostAccessed;
