
import { Book, FileText, Video, Headphones, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const RecentAdditions = () => {
  const recentItems = [
    {
      id: 1,
      title: 'Gestão de Mudanças Organizacionais',
      type: 'livro',
      author: 'Prof. Ricardo Almeida',
      addedDate: '2025-01-10',
      description: 'Estratégias para implementar mudanças eficazes em organizações modernas'
    },
    {
      id: 2,
      title: 'Inteligência Artificial no Marketing',
      type: 'artigo',
      author: 'Dra. Fernanda Costa',
      addedDate: '2025-01-09',
      description: 'Como a IA está revolucionando as estratégias de marketing digital'
    },
    {
      id: 3,
      title: 'Liderança Resiliente em Tempos de Crise',
      type: 'video',
      author: 'Prof. Paulo Santos',
      addedDate: '2025-01-08',
      description: 'Técnicas de liderança para navegar em períodos de incerteza'
    },
    {
      id: 4,
      title: 'Sustentabilidade nos Negócios',
      type: 'podcast',
      author: 'Business Green',
      addedDate: '2025-01-07',
      description: 'Discussão sobre práticas sustentáveis no ambiente corporativo'
    },
    {
      id: 5,
      title: 'Análise Financeira Avançada',
      type: 'livro',
      author: 'Prof. Marina Silva',
      addedDate: '2025-01-06',
      description: 'Métodos avançados de análise e interpretação de dados financeiros'
    },
    {
      id: 6,
      title: 'Design Thinking para Inovação',
      type: 'artigo',
      author: 'Dr. Eduardo Lima',
      addedDate: '2025-01-05',
      description: 'Aplicação do design thinking em processos de inovação empresarial'
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'livro': return Book;
      case 'artigo': return FileText;
      case 'video': return Video;
      case 'podcast': return Headphones;
      default: return Book;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {recentItems.map((item, index) => {
            const IconComponent = getIcon(item.type);
            return (
              <Card
                key={item.id}
                className="group hover-lift animate-fade-in cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => window.location.href = `/item/${item.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-lsb-section rounded-lg flex items-center justify-center">
                        <IconComponent className="h-6 w-6 lsb-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getTypeColor(item.type)}>
                          {item.type}
                        </Badge>
                        <Badge variant="outline" className="bg-lsb-accent text-lsb-primary border-lsb-accent">
                          Novo
                        </Badge>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(item.addedDate)}
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
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="border-lsb-primary text-lsb-primary hover:bg-lsb-primary hover:text-white"
            onClick={() => window.location.href = '/buscar?ordenar=recentes'}
          >
            Ver Todas as Novidades
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RecentAdditions;
