

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
      <section className="py-16 md:py-24 bg-lsb-section-gray">
        <div className="lsb-container">
          <div className="lsb-content">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Mais Acessados
              </h2>
              <p className="subtitle max-w-2xl mx-auto">
                Os conteúdos mais populares da nossa biblioteca digital
              </p>
            </div>
            <div className="text-center my-12 text-lg text-gray-400">
              Nenhum conteúdo encontrado.
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-lsb-section-gray">
      <div className="lsb-container">
        <div className="lsb-content">
          {/* Section Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Mais Acessados
            </h2>
            <div className="w-24 h-1 bg-lsb-accent mx-auto rounded-full"></div>
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
              <CarouselContent className="-ml-4">
                {topItems.map((item, index) => (
                  <CarouselItem key={`${item.type}-${item.id}`} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
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
                              className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <ThumbnailPlaceholder
                              type={item.type}
                              className="w-full h-40"
                              size="large"
                            />
                          )}
                          <Badge className="absolute top-3 left-3 bg-lsb-accent text-lsb-primary flex items-center gap-1 text-xs">
                            <Flame className="h-3 w-3" />
                            Mais Acessado
                          </Badge>
                        </div>
                        <div className="p-3 flex-1 flex flex-col">
                          <Badge variant="outline" className={`mb-2 text-xs self-start ${typeBadgeColor(item.type)}`}>
                            {typeBadge(item.type)}
                          </Badge>
                          <h3 className="font-semibold text-sm mb-1 group-hover:text-lsb-primary transition-colors line-clamp-2 leading-tight flex-1">
                            {item.title}
                          </h3>
                          <p className="p3-text text-xs mb-3">{item.author}</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-lsb-primary hover:bg-lsb-primary hover:text-white transition-all duration-300 text-xs"
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-8" />
              <CarouselNext className="hidden md:flex -right-8" />
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MostAccessed;
