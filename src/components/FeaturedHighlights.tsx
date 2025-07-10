import { Star } from 'lucide-react';
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
import FeaturedHighlightsSkeleton from '@/components/skeletons/FeaturedHighlightsSkeleton';
import { useThumbnailFallback } from '@/hooks/useThumbnailFallback';
import { getThumbnailDisplayLogic } from '@/utils/thumbnailUtils';

// Função inteligente de mesclagem para garantir variedade incluindo artigos
function getIntelligentMixedHighlights(allData: SearchResult[]): SearchResult[] {
  if (!allData || allData.length === 0) return [];
  
  const podcasts = allData.filter(item => item.type === "podcast");
  const videos = allData.filter(item => item.type === "video");
  const livrosEArtigos = allData.filter(item => item.type === "titulo");
  
  console.log('🎯 Intelligent mixing - Available (including articles):', {
    podcasts: podcasts.length,
    videos: videos.length,
    booksAndArticles: livrosEArtigos.length
  });
  
  // Padrão de mesclagem: livro/artigo, podcast, vídeo, livro/artigo, podcast, vídeo
  const pattern = ['titulo', 'podcast', 'video'];
  let picks: SearchResult[] = [];
  
  for (let i = 0; i < 6; i++) {
    const targetType = pattern[i % 3];
    const slotIndex = Math.floor(i / 3); // 0 ou 1 para cada tipo
    
    let item = null;
    if (targetType === 'titulo' && livrosEArtigos[slotIndex]) {
      item = livrosEArtigos[slotIndex];
    } else if (targetType === 'podcast' && podcasts[slotIndex]) {
      item = podcasts[slotIndex];
    } else if (targetType === 'video' && videos[slotIndex]) {
      item = videos[slotIndex];
    }
    
    // Fallback: se não tem o tipo desejado, pega qualquer um disponível
    if (!item) {
      const remaining = [...podcasts, ...videos, ...livrosEArtigos];
      const usedIds = picks.map(p => p.id);
      item = remaining.find(r => !usedIds.includes(r.id));
    }
    
    if (item && !picks.find(p => p.id === item.id)) {
      picks.push(item);
    }
  }
  
  console.log('✅ Intelligent mixing result (including articles):', {
    total: picks.length,
    byType: {
      videos: picks.filter(p => p.type === 'video').length,
      booksAndArticles: picks.filter(p => p.type === 'titulo').length,
      podcasts: picks.filter(p => p.type === 'podcast').length
    },
    items: picks.map(p => `${p.type}: ${p.title?.substring(0, 30)}...`)
  });
  
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
  const { content, rotatedContent, loading } = useHomepageContentContext();
  const navigate = useNavigate();

  console.group('⭐ PHASE 3: FeaturedHighlights Component with Rotation Support and Articles');
  console.log('Loading state:', loading);
  console.log('Rotated weekly highlights:', rotatedContent.weeklyHighlights.length);
  console.log('Raw content received (including articles):', {
    videos: content.videos.length,
    books: content.books.length,
    podcasts: content.podcasts.length,
    articles: content.articles.length
  });
  console.groupEnd();

  const autoplayPlugin = useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    })
  );

  const highlights = useMemo(() => {
    console.log('🔄 PHASE 3: Processing FeaturedHighlights with rotation logic and articles...');
    
    // Prioridade 1: Usar conteúdo rotacionado se disponível
    if (rotatedContent.weeklyHighlights.length > 0) {
      console.log('✅ Using rotated weekly highlights:', rotatedContent.weeklyHighlights.length);
      return rotatedContent.weeklyHighlights;
    }
    
    // Prioridade 2: Fallback para lógica inteligente com dados da API incluindo artigos
    console.log('🔄 Fallback: Using intelligent mixing from API data including articles...');
    const allItems = [...content.videos, ...content.books, ...content.podcasts, ...content.articles];
    const intelligentHighlights = getIntelligentMixedHighlights(allItems);
    
    console.log('✅ PHASE 3: FeaturedHighlights processing completed (with articles):', {
      source: rotatedContent.weeklyHighlights.length > 0 ? 'rotated_database' : 'intelligent_api_fallback',
      finalHighlightsCount: intelligentHighlights.length,
      highlightsByType: {
        videos: intelligentHighlights.filter(h => h.type === 'video').length,
        booksAndArticles: intelligentHighlights.filter(h => h.type === 'titulo').length,
        podcasts: intelligentHighlights.filter(h => h.type === 'podcast').length
      }
    });
    
    return intelligentHighlights;
  }, [content, rotatedContent.weeklyHighlights]);

  console.log('🎯 PHASE 3: FeaturedHighlights final state (with articles):', {
    loading,
    highlightsCount: highlights.length,
    usingRotatedContent: rotatedContent.weeklyHighlights.length > 0
  });

  if (loading) {
    return <FeaturedHighlightsSkeleton />;
  }

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold lsb-primary mb-4">
            Destaques da Semana
          </h2>
          <div className="w-24 h-1 bg-lsb-accent mx-auto rounded-full"></div>
        </div>

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
                {highlights.map((item, index) => {
                  const { shouldShowImage, shouldShowPlaceholder, imageUrl } = getThumbnailDisplayLogic(item.thumbnail);
                  
                  return (
                    <CarouselItem key={`${item.type}-${item.id}`} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                      <Card
                        className="group hover-lift animate-fade-in cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full"
                        style={{ animationDelay: `${index * 0.1}s` }}
                        onClick={() => navigate(`/recurso/${item.id}`)}
                      >
                        <CardContent className="p-0 h-full flex flex-col">
                          <div className="relative overflow-hidden rounded-t-lg">
                            {shouldShowImage ? (
                              <img 
                                src={imageUrl}
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
                  );
                })}
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
