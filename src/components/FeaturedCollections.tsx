
import { Book, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FeaturedCollections = () => {
  const collections = [
    {
      id: 1,
      name: 'Administração Estratégica',
      description: 'Teorias e práticas de gestão estratégica empresarial',
      itemCount: 245,
      banner: '/placeholder.svg',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 2,
      name: 'Marketing Digital',
      description: 'Estratégias e ferramentas do marketing moderno',
      itemCount: 189,
      banner: '/placeholder.svg',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 3,
      name: 'Finanças Corporativas',
      description: 'Gestão financeira e análise de investimentos',
      itemCount: 167,
      banner: '/placeholder.svg',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 4,
      name: 'Empreendedorismo',
      description: 'Inovação e desenvolvimento de negócios',
      itemCount: 134,
      banner: '/placeholder.svg',
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 5,
      name: 'Recursos Humanos',
      description: 'Gestão de pessoas e desenvolvimento organizacional',
      itemCount: 198,
      banner: '/placeholder.svg',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 6,
      name: 'Sustentabilidade',
      description: 'Negócios sustentáveis e responsabilidade social',
      itemCount: 112,
      banner: '/placeholder.svg',
      color: 'from-teal-500 to-teal-600'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="lsb-container">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold lsb-primary mb-4">
            Coleções em Destaque
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore nossas coleções temáticas cuidadosamente curadas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {collections.map((collection, index) => (
            <Card
              key={collection.id}
              className="group hover-lift animate-fade-in cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => window.location.href = `/colecoes/${collection.id}`}
            >
              <CardHeader className="p-0">
                <div className={`h-32 bg-gradient-to-br ${collection.color} rounded-t-lg flex items-center justify-center relative overflow-hidden`}>
                  <Book className="h-12 w-12 text-white" />
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="text-xl mb-2 group-hover:text-lsb-primary transition-colors">
                  {collection.name}
                </CardTitle>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {collection.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {collection.itemCount} itens
                  </span>
                  <Button
                    size="sm"
                    className="bg-lsb-accent hover:bg-lsb-accent/90 text-lsb-primary"
                  >
                    Ver Coleção
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="border-lsb-primary text-lsb-primary hover:bg-lsb-primary hover:text-white"
            onClick={() => window.location.href = '/colecoes'}
          >
            Ver Todas as Coleções
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollections;
