
import { Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

const FeaturedMedia = () => {
  const videos = [
    {
      id: 1,
      title: 'Estratégias de Liderança no Século XXI',
      duration: '24:15',
      thumbnail: '/placeholder.svg',
      author: 'Prof. Maria Silva'
    },
    {
      id: 2,
      title: 'Inovação e Transformação Digital',
      duration: '18:42',
      thumbnail: '/placeholder.svg',
      author: 'Dr. João Santos'
    },
    {
      id: 3,
      title: 'Gestão de Equipes Remotas',
      duration: '31:28',
      thumbnail: '/placeholder.svg',
      author: 'Prof. Ana Costa'
    },
    {
      id: 4,
      title: 'Marketing de Conteúdo Estratégico',
      duration: '22:33',
      thumbnail: '/placeholder.svg',
      author: 'Prof. Carlos Lima'
    }
  ];

  const podcasts = [
    {
      id: 1,
      title: 'O Futuro dos Negócios Digitais',
      duration: '45:12',
      thumbnail: '/placeholder.svg',
      author: 'Business Talk'
    },
    {
      id: 2,
      title: 'Sustentabilidade Empresarial',
      duration: '38:45',
      thumbnail: '/placeholder.svg',
      author: 'Green Business'
    },
    {
      id: 3,
      title: 'Inteligência Artificial nos Negócios',
      duration: '42:18',
      thumbnail: '/placeholder.svg',
      author: 'Tech Leaders'
    },
    {
      id: 4,
      title: 'Empreendedorismo Feminino',
      duration: '35:27',
      thumbnail: '/placeholder.svg',
      author: 'Women in Business'
    }
  ];

  const MediaCard = ({ item, type }: { item: any; type: 'video' | 'podcast' }) => (
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
  );

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {videos.map((video) => (
                <MediaCard key={video.id} item={video} type="video" />
              ))}
            </div>
            <div className="text-center mt-8">
              <Button
                variant="outline"
                className="border-lsb-primary text-lsb-primary hover:bg-lsb-primary hover:text-white"
                onClick={() => window.location.href = '/buscar?tipo=video'}
              >
                Ver Todos os Vídeos
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="podcasts" className="animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {podcasts.map((podcast) => (
                <MediaCard key={podcast.id} item={podcast} type="podcast" />
              ))}
            </div>
            <div className="text-center mt-8">
              <Button
                variant="outline"
                className="border-lsb-primary text-lsb-primary hover:bg-lsb-primary hover:text-white"
                onClick={() => window.location.href = '/buscar?tipo=podcast'}
              >
                Ver Todos os Podcasts
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default FeaturedMedia;
