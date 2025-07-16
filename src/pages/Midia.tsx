import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, BookOpen, Headphones, Play, Download, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";

const mediaTypes = [
  {
    id: 'videos',
    name: 'Vídeos',
    description: 'Palestras, documentários e conteúdo audiovisual',
    icon: Video,
    count: 342,
    totalDuration: '1,250 horas',
    color: 'bg-red-100 text-red-800'
  },
  {
    id: 'livros',
    name: 'Livros e Artigos',
    description: 'Publicações, pesquisas e material de leitura',
    icon: BookOpen,
    count: 528,
    totalDuration: '2.3M páginas',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'podcasts',
    name: 'Podcasts',
    description: 'Conversas, entrevistas e séries de áudio',
    icon: Headphones,
    count: 156,
    totalDuration: '890 episódios',
    color: 'bg-green-100 text-green-800'
  }
];

const featuredContent = [
  {
    id: 1,
    title: 'Inteligência Artificial no Futuro',
    type: 'video',
    duration: '45 min',
    views: '12.5K',
    thumbnail: '/placeholder.svg'
  },
  {
    id: 2,
    title: 'Manual de Sustentabilidade Empresarial',
    type: 'titulo',
    duration: '324 páginas',
    views: '8.2K',
    thumbnail: '/placeholder.svg'
  },
  {
    id: 3,
    title: 'Conversas sobre Inovação',
    type: 'podcast',
    duration: '12 episódios',
    views: '5.7K',
    thumbnail: '/placeholder.svg'
  }
];

const Midia = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="lsb-container">
        <div className="lsb-content">
          <div className="py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Explorar Mídia</h1>
              <p className="p1 text-gray-600">
                Acesse nossa coleção completa de vídeos, livros e podcasts
              </p>
            </div>

            {/* Media Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {mediaTypes.map((mediaType) => {
                const IconComponent = mediaType.icon;
                return (
                  <Link key={mediaType.id} to={`/buscar?tipo=${mediaType.id}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardHeader className="text-center pb-4">
                        <div className="mx-auto p-3 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors w-fit">
                          <IconComponent className="h-8 w-8 text-gray-600" />
                        </div>
                        <CardTitle className="text-xl">{mediaType.name}</CardTitle>
                        <CardDescription className="p2">{mediaType.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="text-center">
                        <div className="space-y-2">
                          <Badge className={mediaType.color}>
                            {mediaType.count} itens
                          </Badge>
                          <p className="text-sm text-gray-500">{mediaType.totalDuration}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Featured Content */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-6">Conteúdo em Destaque</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredContent.map((content) => (
                  <Link key={content.id} to={`/recurso/${content.type}/${content.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="aspect-video relative overflow-hidden rounded-t-lg">
                        <img 
                          src={content.thumbnail} 
                          alt={content.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Play className="h-12 w-12 text-white" />
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg line-clamp-2">{content.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {content.duration}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {content.views}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Acesso Rápido</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                  <Download className="h-5 w-5" />
                  <span className="text-sm">Downloads</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm">Recentes</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Populares</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                  <Video className="h-5 w-5" />
                  <span className="text-sm">Ao Vivo</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Midia;
