import { Star, ImageOff } from 'lucide-react';
import { useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useProgressiveDataLoader } from '@/hooks/useProgressiveDataLoader';
import { useNavigate } from 'react-router-dom';
import { SearchResult } from '@/types/searchTypes';
import FeaturedHighlightsSkeleton from '@/components/skeletons/FeaturedHighlightsSkeleton';

// Helper fallback for missing thumbnails
const FallbackThumb = ({ label = "Miniatura Indisponível" }) => (
  <div className="w-full h-64 bg-gray-200 flex items-center justify-center flex-col gap-2">
    <ImageOff className="w-12 h-12 text-gray-400" />
    <span className="text-gray-500 text-sm">{label}</span>
  </div>
);

// Picks up to 6 items, mixing podcasts, videos, and books with image where possible
function getFeaturedHighlights(allData: SearchResult[]): SearchResult[] {
  if (!allData || allData.length === 0) return [];
  
  // Separate into types using the correct SearchResult structure
  const podcasts = allData.filter(item => item.type === "podcast");
  const videos = allData.filter(item => item.type === "video");
  const livros = allData.filter(item => item.type === "titulo");
  
  // Try to ensure at least 2 of each type
  let picks: SearchResult[] = [];
  if (podcasts[0]) picks.push(podcasts[0]);
  if (podcasts[1]) picks.push(podcasts[1]);
  if (videos[0]) picks.push(videos[0]);
  if (videos[1]) picks.push(videos[1]);
  if (livros[0]) picks.push(livros[0]);
  if (livros[1]) picks.push(livros[1]);
  
  // Fill up to 6 with next-most-recent of any type
  const remaining = [...podcasts.slice(2), ...videos.slice(2), ...livros.slice(2)];
  for (const item of remaining) {
    if (picks.length >= 6) break;
    // Don't duplicate
    if (!picks.find(h => h.id === item.id && h.type === item.type)) picks.push(item);
  }
  
  return picks.slice(0, 6);
}

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

const FeaturedHighlights = () => {
  const { allData, loading, dataLoaded, loadData } = useProgressiveDataLoader();
  
  // Load data on mount
  useEffect(() => {
    if (!dataLoaded && !loading) {
      console.log('🔄 FeaturedHighlights: Loading data on mount');
      loadData();
    }
  }, [dataLoaded, loading, loadData]);
  const navigate = useNavigate();

  // Create a stable autoplay plugin instance with updated configuration
  const autoplayPlugin = useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    })
  );

  // Memoize highlights so we pick new ones only when data changes
  const highlights = useMemo(() => getFeaturedHighlights(allData), [allData]);

  console.log('FeaturedHighlights - allData count:', allData.length);
  console.log('FeaturedHighlights - highlights count:', highlights.length);
  console.log('FeaturedHighlights - highlights:', highlights);

  // Show skeleton while loading
  if (loading) {
    return <FeaturedHighlightsSkeleton />;
  }

  // UI
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold lsb-primary mb-4">
            Destaques da Semana
          </h2>
          <div className="w-24 h-1 bg-lsb-accent mx-auto rounded-full"></div>
        </div>

        {/* Highlights Carousel or empty state */}
        {highlights.length === 0 ? (
          <div className="text-center my-12 text-lg text-gray-400">Nenhum destaque encontrado.</div>
        ) : (
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
                {highlights.map((item, index) => (
                  <CarouselItem key={`${item.type}-${item.id}`} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <Card
                      className="group hover-lift animate-fade-in cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full"
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => navigate(`/recurso/${item.id}`)}
                    >
                      <CardContent className="p-0 h-full flex flex-col">
                        <div className="relative overflow-hidden rounded-t-lg">
                          {item.thumbnail ? (
                            <img 
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-40 bg-gray-200 flex items-center justify-center flex-col gap-2">
                              <ImageOff className="w-8 h-8 text-gray-400" />
                              <span className="text-gray-500 text-xs">Sem imagem</span>
                            </div>
                          )}
                          <Badge className="absolute top-3 left-3 bg-lsb-accent text-lsb-primary flex items-center gap-1 text-xs">
                            <Star className="h-3 w-3" />
                            Escolha da Equipe
                          </Badge>
                        </div>
                        <div className="p-3 flex-1 flex flex-col">
                          <Badge variant="outline" className={`mb-2 text-xs self-start ${typeBadgeColor(item.type)}`}>
                            {typeBadge(item.type)}
                          </Badge>
                          <h3 className="font-semibold text-sm mb-1 group-hover:text-lsb-primary transition-colors line-clamp-2 leading-tight flex-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-gray-600 mb-3">{item.author}</p>
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
        )}
      </div>
    </section>
  );
};

export default FeaturedHighlights;
