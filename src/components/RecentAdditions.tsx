import { Book, Video, Headphones, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useDataLoader } from '@/hooks/useDataLoader';
import { useMemo } from 'react';
import RecentAdditionsSkeleton from '@/components/skeletons/RecentAdditionsSkeleton';

// Fallback image for missing thumbnails
const PLACEHOLDER_THUMB = '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png';

const getIcon = (type: string) => {
  switch (type) {
    case 'titulo': return Book;
    case 'video': return Video;
    case 'podcast': return Headphones;
    default: return Book;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'titulo': return 'bg-blue-100 text-blue-800';
    case 'video': return 'bg-red-100 text-red-800';
    case 'podcast': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'titulo': return 'Livro';
    case 'video': return 'Vídeo';
    case 'podcast': return 'Podcast';
    default: return 'Conteúdo';
  }
};

const formatDate = (year: number) => {
  return new Date(year, 0, 1).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  });
};

const RecentAdditions = () => {
  const { allData, loading } = useDataLoader();

  // Get mixed recent items from real API data
  const recentItems = useMemo(() => {
    if (!allData || allData.length === 0) {
      return [];
    }

    // Sort by year (most recent first) and take up to 6 items
    const sortedItems = allData
      .sort((a, b) => b.year - a.year)
      .slice(0, 6)
      .map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        author: item.author,
        description: item.description,
        thumbnail: item.thumbnail || PLACEHOLDER_THUMB,
        addedDate: item.year.toString(),
      }));

    return sortedItems;
  }, [allData]);

  if (loading) {
    return <RecentAdditionsSkeleton />;
  }

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold lsb-primary mb-4">
            Novidades no Acervo
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Confira os materiais mais recentes adicionados à nossa biblioteca
          </p>
        </div>

        {recentItems.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {recentItems.map((item, index) => {
                const IconComponent = getIcon(item.type);
                return (
                  <Link key={item.type + '-' + item.id} to={`/recurso/${item.id}`}>
                    <Card
                      className="group hover-lift animate-fade-in cursor-pointer"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          {/* Left side: Icon and content */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-lsb-section rounded-lg flex items-center justify-center">
                              <IconComponent className="h-6 w-6 lsb-primary" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={getTypeColor(item.type)}>
                                {getTypeLabel(item.type)}
                              </Badge>
                              <Badge variant="outline" className="bg-lsb-accent text-lsb-primary border-lsb-accent">
                                Novo
                              </Badge>
                              <div className="flex items-center text-xs text-gray-500">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(parseInt(item.addedDate))}
                              </div>
                            </div>
                            <h3 className="font-semibold text-lg mb-1 group-hover:text-lsb-primary transition-colors line-clamp-2">
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">{item.author}</p>
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                          {/* Right side: Thumbnail */}
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                              <img 
                                src={item.thumbnail} 
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Link to="/buscar?ordenar=recentes">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-lsb-primary text-lsb-primary hover:bg-lsb-primary hover:text-white"
                >
                  Ver Todas as Novidades
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Nenhum conteúdo disponível no momento.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentAdditions;
