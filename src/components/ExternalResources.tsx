import { useState, useEffect, useRef } from 'react';
import { ExternalLink, Database, BookOpen, Users, Globe, FileText, Microscope, TrendingUp, GraduationCap, Leaf, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

interface ExternalResource {
  Nome: string;
  Descricao: string;
  Link: string;
}

interface ExternalResourcesData {
  tipo: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  conteudo: ExternalResource[];
}

const ExternalResources = () => {
  const [resources, setResources] = useState<ExternalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create a stable autoplay plugin instance
  const autoplayPlugin = useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );

  useEffect(() => {
    const loadResources = async () => {
      try {
        const response = await fetch('/external-resources.json');
        if (!response.ok) {
          throw new Error('Failed to load external resources');
        }
        const data: ExternalResourcesData = await response.json();
        setResources(data.conteudo);
      } catch (err) {
        console.error('Error loading external resources:', err);
        setError('Erro ao carregar recursos externos');
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, []);

  const getResourceConfig = (nome: string) => {
    const configs = {
      'SciELO Brasil': {
        icon: Microscope,
        category: 'Biblioteca Digital',
        color: 'from-orange-500 to-orange-600',
        highlight: 'Acesso aberto'
      },
      'Portal de Periódicos da CAPES': {
        icon: Database,
        category: 'Base de Dados',
        color: 'from-blue-500 to-blue-600',
        highlight: 'Acesso via instituição'
      },
      'BVS - Biblioteca Virtual em Saúde': {
        icon: BookOpen,
        category: 'Biblioteca Virtual',
        color: 'from-green-500 to-green-600',
        highlight: 'Foco em saúde'
      },
      'IBGE': {
        icon: Globe,
        category: 'Instituto Oficial',
        color: 'from-purple-500 to-purple-600',
        highlight: 'Dados estatísticos'
      },
      'Associação Brasileira de Normas Técnicas – ABNT': {
        icon: FileText,
        category: 'Normas Técnicas',
        color: 'from-indigo-500 to-indigo-600',
        highlight: 'Normas oficiais'
      },
      'Análises Macroeconômicas | Itaú BBA': {
        icon: TrendingUp,
        category: 'Análises Econômicas',
        color: 'from-red-500 to-red-600',
        highlight: 'Insights econômicos'
      },
      'Institute of Education Sciences': {
        icon: GraduationCap,
        category: 'Pesquisa Educacional',
        color: 'from-yellow-500 to-yellow-600',
        highlight: 'Dados educacionais'
      },
      'IPA Instituto de Pesquisas Ambientais': {
        icon: Leaf,
        category: 'Pesquisa Ambiental',
        color: 'from-emerald-500 to-emerald-600',
        highlight: 'Publicações gratuitas'
      },
      'ICE (Instituto de Cidadania Empresarial)': {
        icon: Users,
        category: 'Impacto Social',
        color: 'from-cyan-500 to-cyan-600',
        highlight: 'Negócios de impacto'
      },
      'IPEA Instituto de Pesquisa Econômica Aplicada': {
        icon: BarChart,
        category: 'Pesquisa Econômica',
        color: 'from-violet-500 to-violet-600',
        highlight: 'Políticas públicas'
      }
    };

    return configs[nome as keyof typeof configs] || {
      icon: Globe,
      category: 'Recurso Externo',
      color: 'from-gray-500 to-gray-600',
      highlight: 'Conteúdo especializado'
    };
  };

  const handleResourceClick = (url: string, name: string) => {
    console.log(`Accessing external resource: ${name}`);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <section className="py-16 md:py-20 bg-gradient-to-br from-lsb-section to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">Carregando recursos externos...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 md:py-20 bg-gradient-to-br from-lsb-section to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-lsb-section to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold lsb-primary mb-4">
            Recursos Externos Recomendados
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore bibliotecas digitais e bases de dados brasileiras cuidadosamente selecionadas 
            para complementar sua pesquisa acadêmica
          </p>
        </div>

        <div className="px-4">
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
            <CarouselContent className="-ml-2 md:-ml-4 py-4">
              {resources.map((resource, index) => {
                const config = getResourceConfig(resource.Nome);
                const IconComponent = config.icon;
                
                return (
                  <CarouselItem key={resource.Nome} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <Card
                      className="group hover-lift animate-fade-in cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full mx-2"
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => handleResourceClick(resource.Link, resource.Nome)}
                    >
                      <CardContent className="p-4 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${config.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <Badge className="text-xs bg-green-100 text-green-800 border-0">
                            Gratuito
                          </Badge>
                        </div>
                        
                        <div className="flex-1">
                          <div className="mb-2">
                            <Badge variant="outline" className="text-xs mb-2 border-gray-300">
                              {config.category}
                            </Badge>
                          </div>
                          
                          <h3 className="font-semibold text-sm mb-2 group-hover:text-lsb-primary transition-colors line-clamp-2">
                            {resource.Nome}
                          </h3>
                          
                          <p className="text-xs text-gray-600 mb-2 line-clamp-1 flex-1">
                            {resource.Descricao}
                          </p>
                          
                          <div className="mb-3">
                            <p className="text-xs font-medium text-lsb-primary">
                              {config.highlight}
                            </p>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          className="w-full bg-lsb-primary hover:bg-lsb-primary/90 text-white border-0 group-hover:shadow-md transition-all text-xs"
                        >
                          Acessar
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
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

        <div className="text-center mt-12 space-y-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 max-w-4xl mx-auto border border-gray-200">
            <h3 className="font-semibold text-lsb-primary mb-2">Sobre estes recursos</h3>
            <p className="text-gray-600 text-sm">
              Todos os recursos listados foram cuidadosamente selecionados por nossa equipe acadêmica. 
              Recursos marcados como "Institucional" podem exigir acesso via universidade ou biblioteca. 
              Para dúvidas sobre acesso, consulte nossa equipe de suporte.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExternalResources;
