
import { ExternalLink, Database, BookOpen, Users, Globe, FileText, Microscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ExternalResources = () => {
  const resources = [
    {
      name: 'Biblioteca Digital Brasileira',
      description: 'Acervo digital de teses, dissertações e livros brasileiros',
      url: 'https://bdtd.ibict.br',
      category: 'Repositório Nacional',
      type: 'free',
      icon: BookOpen,
      color: 'from-emerald-500 to-emerald-600',
      highlight: 'Mais de 600.000 documentos'
    },
    {
      name: 'Portal CAPES',
      description: 'Periódicos científicos nacionais e internacionais',
      url: 'https://periodicos.capes.gov.br',
      category: 'Base de Dados',
      type: 'institutional',
      icon: Database,
      color: 'from-blue-500 to-blue-600',
      highlight: 'Acesso via instituição'
    },
    {
      name: 'SciELO Brasil',
      description: 'Biblioteca científica eletrônica online brasileira',
      url: 'https://scielo.br',
      category: 'Biblioteca Digital',
      type: 'free',
      icon: Microscope,
      color: 'from-orange-500 to-orange-600',
      highlight: 'Acesso aberto'
    },
    {
      name: 'Repositório Institucional UNESP',
      description: 'Produção científica da Universidade Estadual Paulista',
      url: 'https://repositorio.unesp.br',
      category: 'Repositório Institucional',
      type: 'free',
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      highlight: 'Especializado em educação'
    },
    {
      name: 'Domínio Público',
      description: 'Biblioteca digital do governo brasileiro',
      url: 'http://domíniopublico.gov.br',
      category: 'Biblioteca Pública',
      type: 'free',
      icon: Globe,
      color: 'from-green-500 to-green-600',
      highlight: 'Conteúdo livre'
    },
    {
      name: 'Academia.edu Brasil',
      description: 'Rede social acadêmica com foco em pesquisadores brasileiros',
      url: 'https://usp.academia.edu',
      category: 'Rede Acadêmica',
      type: 'freemium',
      icon: Users,
      color: 'from-indigo-500 to-indigo-600',
      highlight: 'Networking acadêmico'
    }
  ];

  const handleResourceClick = (url: string, name: string) => {
    // Analytics tracking would go here
    console.log(`Accessing external resource: ${name}`);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'free': return 'bg-green-100 text-green-800';
      case 'institutional': return 'bg-blue-100 text-blue-800';
      case 'freemium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'free': return 'Gratuito';
      case 'institutional': return 'Institucional';
      case 'freemium': return 'Básico gratuito';
      default: return type;
    }
  };

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {resources.map((resource, index) => {
            const IconComponent = resource.icon;
            return (
              <Card
                key={resource.name}
                className="group hover-lift animate-fade-in cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handleResourceClick(resource.url, resource.name)}
              >
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${resource.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="h-7 w-7 text-white" />
                    </div>
                    <Badge className={`text-xs ${getTypeColor(resource.type)} border-0`}>
                      {getTypeLabel(resource.type)}
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <div className="mb-2">
                      <Badge variant="outline" className="text-xs mb-2 border-gray-300">
                        {resource.category}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-lsb-primary transition-colors line-clamp-2">
                      {resource.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1">
                      {resource.description}
                    </p>
                    
                    <div className="mb-4">
                      <p className="text-xs font-medium text-lsb-primary">
                        {resource.highlight}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    className="w-full bg-lsb-primary hover:bg-lsb-primary/90 text-white border-0 group-hover:shadow-md transition-all"
                  >
                    Acessar Recurso
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
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
