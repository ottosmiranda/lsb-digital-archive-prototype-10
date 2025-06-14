
import { Eye, TrendingUp, Book, FileText, Video, Headphones } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDataLoader } from '@/hooks/useDataLoader';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

const MostAccessed = () => {
  const { allData, loading } = useDataLoader();
  const navigate = useNavigate();

  // Generate consistent view counts and trends based on item properties
  const generateViewData = (item: any, index: number) => {
    // Use item ID and type to generate consistent pseudo-random numbers
    const seed = (item.id || 1) * 17 + item.type.charCodeAt(0) * 31;
    const baseViews = 5000 + (seed % 12000); // Random between 5k-17k
    const views = Math.floor(baseViews - (index * 800)); // Decrease by rank
    
    // Generate trend based on content characteristics
    const trendSeed = seed % 10;
    let trend = 'stable';
    if (trendSeed < 4) trend = 'up';
    else if (trendSeed > 7) trend = 'down';
    
    return { views, trend };
  };

  // Create top 10 items from real data
  const topItems = useMemo(() => {
    if (!allData || allData.length === 0) return [];
    
    // Mix different content types and take top 10
    const shuffled = [...allData].sort((a, b) => {
      // Sort by a mix of ID and type for consistent but varied results
      const aScore = (a.id || 1) * (a.type === 'podcast' ? 3 : a.type === 'video' ? 2 : 1);
      const bScore = (b.id || 1) * (b.type === 'podcast' ? 3 : b.type === 'video' ? 2 : 1);
      return bScore - aScore;
    });

    return shuffled.slice(0, 10).map((item, index) => {
      const { views, trend } = generateViewData(item, index);
      
      return {
        rank: index + 1,
        id: item.id,
        title: item.title,
        type: item.type,
        author: item.author,
        views,
        trend
      };
    });
  }, [allData]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'titulo': return <Book className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'podcast': return <Headphones className="h-4 w-4" />;
      default: return <Book className="h-4 w-4" />;
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down': return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
      default: return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
  };

  const handleItemClick = (id: number) => {
    navigate(`/recurso/${id}`);
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-lsb-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold lsb-primary mb-4">
              Mais Acessados
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Os conteúdos mais populares da nossa biblioteca digital
            </p>
          </div>
          <div className="text-center my-12 text-lg text-gray-400 animate-pulse">
            Carregando ranking...
          </div>
        </div>
      </section>
    );
  }

  if (topItems.length === 0) {
    return (
      <section className="py-16 md:py-24 bg-lsb-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold lsb-primary mb-4">
              Mais Acessados
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Os conteúdos mais populares da nossa biblioteca digital
            </p>
          </div>
          <div className="text-center my-12 text-lg text-gray-400">
            Nenhum conteúdo encontrado.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-lsb-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold lsb-primary mb-4">
            Mais Acessados
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Os conteúdos mais populares da nossa biblioteca digital
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-slide-up">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead className="hidden lg:table-cell">Autor</TableHead>
                <TableHead className="text-right">Visualizações</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topItems.map((item) => (
                <TableRow 
                  key={`${item.id}-${item.type}`}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleItemClick(item.id)}
                >
                  <TableCell className="font-medium">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      item.rank <= 3 ? 'bg-lsb-accent text-lsb-primary' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.rank}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm mb-1 line-clamp-1 hover:text-lsb-primary transition-colors">
                      {item.title}
                    </div>
                    <div className="md:hidden">
                      <Badge className={`${getTypeColor(item.type)} mr-2`}>
                        <span className="flex items-center space-x-1">
                          {getTypeIcon(item.type)}
                          <span>{getTypeLabel(item.type)}</span>
                        </span>
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge className={getTypeColor(item.type)}>
                      <span className="flex items-center space-x-1">
                        {getTypeIcon(item.type)}
                        <span>{getTypeLabel(item.type)}</span>
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-gray-600">
                    {item.author}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Eye className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-medium">{formatViews(item.views)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTrendIcon(item.trend)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
};

export default MostAccessed;
