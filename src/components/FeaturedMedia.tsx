import { Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useHomepageContentContext } from '@/contexts/HomepageContentContext';
import { useMemo } from 'react';
import FeaturedMediaSkeleton from '@/components/skeletons/FeaturedMediaSkeleton';
import { WipeButton } from '@/components/ui/WipeButton';

const FeaturedMedia = () => {
  const {
    content,
    rotatedContent,
    loading
  } = useHomepageContentContext();
  console.group('🎬 PHASE 3: FeaturedMedia Component with Daily Rotation');
  console.log('Loading state:', loading);
  console.log('Rotated daily media:', {
    videos: rotatedContent.dailyMedia.videos.length,
    podcasts: rotatedContent.dailyMedia.podcasts.length
  });
  console.log('Raw content received:', {
    videos: content.videos.length,
    podcasts: content.podcasts.length
  });
  console.groupEnd();
  const {
    videos,
    podcasts
  } = useMemo(() => {
    console.log('🔄 PHASE 3: Processing FeaturedMedia with rotation logic...');

    // Prioridade 1: Usar conteúdo rotacionado se disponível
    if (rotatedContent.dailyMedia.videos.length > 0 || rotatedContent.dailyMedia.podcasts.length > 0) {
      console.log('✅ Using rotated daily media:', {
        videos: rotatedContent.dailyMedia.videos.length,
        podcasts: rotatedContent.dailyMedia.podcasts.length
      });
      return {
        videos: rotatedContent.dailyMedia.videos,
        podcasts: rotatedContent.dailyMedia.podcasts
      };
    }

    // Prioridade 2: Fallback para dados da API
    console.log('🔄 Fallback: Using API data for featured media...');
    const videoData = content.videos.slice(0, 3).map(video => ({
      id: video.id,
      title: video.title,
      duration: video.duration || 'N/A',
      thumbnail: video.thumbnail,
      author: video.author,
      type: video.type || 'video'
    }));
    const podcastData = content.podcasts.slice(0, 3).map(podcast => ({
      id: podcast.id,
      title: podcast.title,
      duration: podcast.duration || 'N/A',
      thumbnail: podcast.thumbnail,
      author: podcast.author,
      type: podcast.type || 'podcast'
    }));
    console.log('✅ PHASE 3: FeaturedMedia data processed:', {
      source: 'api_fallback',
      processedVideos: videoData.length,
      processedPodcasts: podcastData.length
    });
    return {
      videos: videoData,
      podcasts: podcastData
    };
  }, [content, rotatedContent.dailyMedia]);

  const MediaCard = ({
    item,
    type
  }: {
    item: any;
    type: 'video' | 'podcast';
  }) => <Link to={`/recurso/${item.type || type}/${item.id}`} className="block">
      <Card className="group hover-lift cursor-pointer h-full">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="relative aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="w-10 md:w-12 h-10 md:h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="h-5 w-5 md:h-6 md:w-6 text-lsb-primary ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              <Clock className="inline h-3 w-3 mr-1" />
              {item.duration}
            </div>
          </div>
          <div className="p-3 md:p-4 flex-1 flex flex-col">
            <h3 className="font-semibold text-xs md:text-sm mb-1 line-clamp-2 group-hover:text-lsb-primary transition-colors flex-1">
              {item.title}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-1">{item.author}</p>
          </div>
        </CardContent>
      </Card>
    </Link>;

  if (loading) {
    return <FeaturedMediaSkeleton />;
  }

  return (
    <section className="py-8 md:py-16 lg:py-24 bg-slate-50">
      <div className="lsb-container">
        <div className="lsb-content">
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold lsb-primary mb-3 md:mb-4">
              Mídia em Destaque
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Descubra nossos conteúdos audiovisuais mais populares
            </p>
          </div>

          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="grid w-full max-w-xs md:max-w-md mx-auto grid-cols-2 mb-6 md:mb-8">
              <TabsTrigger value="videos" className="text-sm">Vídeos</TabsTrigger>
              <TabsTrigger value="podcasts" className="text-sm">Podcasts</TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="animate-fade-in">
              {videos.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {videos.map(video => <MediaCard key={video.id} item={video} type="video" />)}
                  </div>
                  <div className="text-center mt-6 md:mt-8">
                    <Link to="/buscar?filtros=video">
                      <WipeButton className="px-6 md:px-8 py-3 md:py-4 text-sm md:text-base">
                        Ver Todos os Vídeos
                      </WipeButton>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 md:py-8">
                  <p className="text-gray-600">Nenhum vídeo disponível no momento.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="podcasts" className="animate-fade-in">
              {podcasts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {podcasts.map(podcast => <MediaCard key={podcast.id} item={podcast} type="podcast" />)}
                  </div>
                  <div className="text-center mt-6 md:mt-8">
                    <Link to="/buscar?filtros=podcast">
                      <WipeButton className="px-6 md:px-8 py-3 md:py-4 text-sm md:text-base">
                        Ver Todos os Podcasts
                      </WipeButton>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 md:py-8">
                  <p className="text-gray-600">Nenhum podcast disponível no momento.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default FeaturedMedia;
