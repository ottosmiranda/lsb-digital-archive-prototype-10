
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Video, Headphones, Users, TrendingUp, Heart, Brain, Briefcase, Globe, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const subjects = [
  {
    id: 'educacao',
    name: 'Educação',
    description: 'Recursos educacionais para todos os níveis',
    icon: BookOpen,
    count: 245,
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'tecnologia',
    name: 'Tecnologia',
    description: 'Inovações e desenvolvimento tecnológico',
    icon: Zap,
    count: 189,
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'saude',
    name: 'Saúde',
    description: 'Bem-estar e cuidados médicos',
    icon: Heart,
    count: 156,
    color: 'bg-red-100 text-red-800'
  },
  {
    id: 'psicologia',
    name: 'Psicologia',
    description: 'Mente, comportamento e desenvolvimento humano',
    icon: Brain,
    count: 134,
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'negocios',
    name: 'Negócios',
    description: 'Empreendedorismo e gestão empresarial',
    icon: Briefcase,
    count: 98,
    color: 'bg-orange-100 text-orange-800'
  },
  {
    id: 'sociedade',
    name: 'Sociedade',
    description: 'Questões sociais e culturais',
    icon: Users,
    count: 87,
    color: 'bg-indigo-100 text-indigo-800'
  },
  {
    id: 'ciencias',
    name: 'Ciências',
    description: 'Pesquisa e descobertas científicas',
    icon: Globe,
    count: 76,
    color: 'bg-teal-100 text-teal-800'
  },
  {
    id: 'tendencias',
    name: 'Tendências',
    description: 'Assuntos em alta e discussões atuais',
    icon: TrendingUp,
    count: 65,
    color: 'bg-yellow-100 text-yellow-800'
  }
];

const Assuntos = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Explorar por Assuntos</h1>
          <p className="text-lg text-gray-600">
            Navegue por nossa coleção organizada por áreas de conhecimento
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {subjects.map((subject) => {
            const IconComponent = subject.icon;
            return (
              <Link key={subject.id} to={`/buscar?categoria=${subject.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors">
                        <IconComponent className="h-6 w-6 text-gray-600" />
                      </div>
                      <Badge className={subject.color}>
                        {subject.count} recursos
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {subject.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Não encontrou o que procura?</h2>
          <p className="text-gray-600 mb-4">
            Use nossa busca avançada para encontrar recursos específicos ou explore nossa coleção completa.
          </p>
          <div className="flex gap-4">
            <Link 
              to="/buscar" 
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Busca Avançada
            </Link>
            <Link 
              to="/midia" 
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              Explorar Mídia
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Assuntos;
