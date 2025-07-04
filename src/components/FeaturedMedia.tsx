import { Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useProgressiveDataLoader } from '@/hooks/useProgressiveDataLoader';
import { useMemo, useEffect } from 'react';
import FeaturedMediaSkeleton from '@/components/skeletons/FeaturedMediaSkeleton';

const FeaturedMedia = () => {
  const { allData, loading, dataLoaded, loadData } = useProgressiveDataLoader();
  
  // Load data on mount
  useEffect(() => {
    if (!dataLoaded && !loading) {
      console.log('🔄 FeaturedMedia: Loading data on mount');
      loadData();
    }
  }, [dataLoaded, loading, loadData]);

  // Get featured content from real API data
  const { videos, podcasts } = useMemo(() => {
    if (!allData || allData.length === 0) {
      return { videos: [], podcasts: [] };
    }

    // Get first 3 videos
    const videoData = allData
      .filter(item => item.type === 'video')
      .slice(0, 3)
      .map(video => ({
        id: video.id,
        title: video.title,
        duration: video.duration || 'N/A',
        thumbnail: video.thumbnail || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
        author: video.author
      }));

    // Get first 3 podcasts
    const podcastData = allData
      .filter(item => item.type === 'podcast')
      .slice(0, 3)
      .map(podcast => ({
        id: podcast.id,
        title: podcast.title,
        duration: podcast.episodes || 'N/A',
        thumbnail: podcast.thumbnail || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
        author: podcast.author
      }));

    return { videos: videoData, podcasts: podcastData };
  }, [allData]);

  const MediaCard = ({ item, type }: { item: any; type: 'video' | 'podcast' }) => (
    <Link to={`/recurso/${item.id}`}>
      <Card className="group hover-lift cursor-pointer">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="h-6 w-6 text-lsb-primary ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              <Clock className="inline h-3 w-3 mr-1" />
              {item.duration}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-lsb-primary transition-colors">
              {item.title}
            </h3>
            <p className="text-xs text-gray-600">{item.author}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  if (loading) {
    return <FeaturedMediaSkeleton />;
  }

  return (
    <section className="py-16 md:py-24 bg-lsb-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold lsb-primary mb-4">
            Mídia em Destaque
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubra nossos conteúdos audiovisuais mais populares
          </p>
        </div>

        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="videos">Vídeos</TabsTrigger>
            <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="animate-fade-in">
            {videos.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {videos.map((video) => (
                    <MediaCard key={video.id} item={video} type="video" />
                  ))}
                </div>
                <div className="text-center mt-8">
                  <Link to="/buscar?filtros=video">
                    <Button
                      variant="outline"
                      className="border-lsb-primary text-lsb-primary hover:bg-lsb-primary hover:text-white"
                    >
                      Ver Todos os Vídeos
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Nenhum vídeo disponível no momento.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="podcasts" className="animate-fade-in">
            {podcasts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {podcasts.map((podcast) => (
                    <MediaCard key={podcast.id} item={podcast} type="podcast" />
                  ))}
                </div>
                <div className="text-center mt-8">
                  <Link to="/buscar?filtros=podcast">
                    <Button
                      variant="outline"
                      className="border-lsb-primary text-lsb-primary hover:bg-lsb-primary hover:text-white"
                    >
                      Ver Todos os Podcasts
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Nenhum podcast disponível no momento.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default FeaturedMedia;
