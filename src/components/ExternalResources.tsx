
import { ExternalLink, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const ExternalResources = () => {
  const resources = [
    {
      name: 'Google Scholar',
      description: 'Pesquise literatura acadêmica em diversas disciplinas',
      url: 'https://scholar.google.com',
      logo: '/placeholder.svg',
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'JSTOR',
      description: 'Acesso a artigos acadêmicos, livros e fontes primárias',
      url: 'https://jstor.org',
      logo: '/placeholder.svg',
      color: 'from-red-500 to-red-600'
    },
    {
      name: 'SciELO',
      description: 'Biblioteca eletrônica científica online',
      url: 'https://scielo.org',
      logo: '/placeholder.svg',
      color: 'from-green-500 to-green-600'
    },
    {
      name: 'ResearchGate',
      description: 'Rede social para cientistas e pesquisadores',
      url: 'https://researchgate.net',
      logo: '/placeholder.svg',
      color: 'from-teal-500 to-teal-600'
    },
    {
      name: 'CAPES Periódicos',
      description: 'Portal de periódicos científicos brasileiros',
      url: 'https://periodicos.capes.gov.br',
      logo: '/placeholder.svg',
      color: 'from-purple-500 to-purple-600'
    },
    {
      name: 'Academia.edu',
      description: 'Plataforma para compartilhamento de pesquisas acadêmicas',
      url: 'https://academia.edu',
      logo: '/placeholder.svg',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const handleResourceClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold lsb-primary mb-4">
            Descubra Mais
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore recursos acadêmicos externos para complementar sua pesquisa
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {resources.map((resource, index) => (
            <Card
              key={resource.name}
              className="group hover-lift animate-fade-in cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => handleResourceClick(resource.url)}
            >
              <CardContent className="p-6">
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${resource.color} rounded-xl flex items-center justify-center`}>
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-lsb-primary transition-colors">
                    {resource.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {resource.description}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-lsb-primary text-lsb-primary hover:bg-lsb-primary hover:text-white"
                  >
                    Acessar Recurso
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 text-sm">
            Estes recursos externos são mantidos por terceiros e podem exigir cadastro ou assinatura
          </p>
        </div>
      </div>
    </section>
  );
};

export default ExternalResources;
