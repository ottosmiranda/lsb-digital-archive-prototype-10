
import { Eye, TrendingUp, Book, FileText, Video, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const MostAccessed = () => {
  const topItems = [
    {
      rank: 1,
      title: 'Fundamentos de Gestão Estratégica',
      type: 'livro',
      author: 'Prof. Carlos Silva',
      views: 15420,
      trend: 'up'
    },
    {
      rank: 2,
      title: 'Marketing Digital na Era Moderna',
      type: 'video',
      author: 'Dra. Ana Costa',
      views: 12340,
      trend: 'up'
    },
    {
      rank: 3,
      title: 'Finanças Corporativas Aplicadas',
      type: 'artigo',
      author: 'Prof. Ricardo Lima',
      views: 11280,
      trend: 'down'
    },
    {
      rank: 4,
      title: 'Liderança e Motivação de Equipes',
      type: 'podcast',
      author: 'Business Leaders',
      views: 10950,
      trend: 'up'
    },
    {
      rank: 5,
      title: 'Inovação e Empreendedorismo',
      type: 'livro',
      author: 'Dr. Paulo Santos',
      views: 9870,
      trend: 'up'
    },
    {
      rank: 6,
      title: 'Gestão de Recursos Humanos',
      type: 'video',
      author: 'Prof. Marina Oliveira',
      views: 8940,
      trend: 'stable'
    },
    {
      rank: 7,
      title: 'Análise de Mercado e Competitividade',
      type: 'artigo',
      author: 'Dra. Fernanda Costa',
      views: 8120,
      trend: 'up'
    },
    {
      rank: 8,
      title: 'Sustentabilidade nos Negócios',
      type: 'podcast',
      author: 'Green Business',
      views: 7650,
      trend: 'up'
    },
    {
      rank: 9,
      title: 'Transformação Digital Empresarial',
      type: 'livro',
      author: 'Prof. João Almeida',
      views: 7230,
      trend: 'down'
    },
    {
      rank: 10,
      title: 'Comunicação Corporativa Eficaz',
      type: 'video',
      author: 'Dra. Lucia Santos',
      views: 6890,
      trend: 'stable'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'livro': return <Book className="h-4 w-4" />;
      case 'artigo': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'podcast': return <Headphones className="h-4 w-4" />;
      default: return <Book className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'livro': return 'bg-blue-100 text-blue-800';
      case 'artigo': return 'bg-green-100 text-green-800';
      case 'video': return 'bg-red-100 text-red-800';
      case 'podcast': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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
                  key={item.rank}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => window.location.href = `/item/${item.rank}`}
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
                          <span>{item.type}</span>
                        </span>
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge className={getTypeColor(item.type)}>
                      <span className="flex items-center space-x-1">
                        {getTypeIcon(item.type)}
                        <span>{item.type}</span>
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

        <div className="text-center mt-8">
          <Button
            variant="outline"
            className="border-lsb-primary text-lsb-primary hover:bg-lsb-primary hover:text-white"
            onClick={() => window.location.href = '/buscar?ordenar=mais-acessados'}
          >
            Ver Ranking Completo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MostAccessed;
