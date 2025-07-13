import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Download, Globe, Heart, Mail, Phone, MapPin, Target, Eye, Award, Database, FileText, Video, Headphones, User, Search, Settings, TrendingUp, UserCheck, GraduationCap, Megaphone, BarChart3, BookMarked } from "lucide-react";
const stats = [{
  label: 'Recursos Disponíveis',
  value: '1,026',
  icon: BookOpen
}, {
  label: 'Usuários Ativos',
  value: '15,234',
  icon: Users
}, {
  label: 'Downloads Realizados',
  value: '89,567',
  icon: Download
}, {
  label: 'Países Atendidos',
  value: '45',
  icon: Globe
}];
const teamMembers = [{
  name: 'Dr. Maria Silva',
  role: 'Diretora Acadêmica',
  expertise: 'Educação e Tecnologia'
}, {
  name: 'João Santos',
  role: 'Coordenador Técnico',
  expertise: 'Desenvolvimento de Sistemas'
}, {
  name: 'Ana Costa',
  role: 'Curadora de Conteúdo',
  expertise: 'Ciências Sociais'
}, {
  name: 'Pedro Lima',
  role: 'Designer UX/UI',
  expertise: 'Experiência do Usuário'
}];
const missionVisionValues = [{
  number: "01",
  title: "Missão",
  description: "Contribuir para a evolução do mundo transformando pessoas através da educação",
  icon: Target,
  color: "bg-blue-500"
}, {
  number: "02",
  title: "Visão",
  description: "Ser referência em empreendedorismo, impactando futuras gerações",
  icon: Eye,
  color: "bg-green-500"
}, {
  number: "03",
  title: "Valores",
  description: "Respeito, Coragem, Responsabilidade e Simplicidade",
  icon: Award,
  color: "bg-purple-500"
}];

const libraryFunctions = [
  {
    title: 'Acesso aos recursos',
    description: 'Disponibilizar uma coleção diversificada de livros (e-books), artigos, periódicos, teses, dissertações, podcasts, videoaulas e outros materiais relevantes para o estudo e pesquisa em administração de empresas com foco em empreendedorismo.',
    icon: Database,
    color: 'bg-blue-500'
  },
  {
    title: 'Suporte ao aprendizado',
    description: 'Facilitar o acesso a informações atualizadas e de qualidade, contribuindo para a formação acadêmica e profissional dos alunos e professores.',
    icon: GraduationCap,
    color: 'bg-green-500'
  },
  {
    title: 'Promoção da pesquisa',
    description: 'Incentivar a pesquisa acadêmica e a produção de conhecimento, oferecendo ferramentas e recursos que auxiliem os alunos e professores em suas investigações.',
    icon: TrendingUp,
    color: 'bg-purple-500'
  },
  {
    title: 'Ambiente colaborativo',
    description: 'Criar um espaço virtual onde alunos e professores possam compartilhar conhecimentos, experiências e recursos, promovendo a troca de ideias e a inovação.',
    icon: Users,
    color: 'bg-orange-500'
  }
];

const librarianFunctions = [
  {
    title: 'Gestão de recursos',
    description: 'Selecionar, organizar e manter a coleção de materiais disponíveis na Biblioteca Digital Link garantindo que os recursos sejam relevantes e atualizados.',
    icon: Settings,
    color: 'bg-blue-500'
  },
  {
    title: 'Atendimento ao estudante e docente',
    description: 'Realizar pesquisas, levantamentos bibliográficos, oferecer suporte e orientação aos alunos e professores na busca por informações.',
    icon: UserCheck,
    color: 'bg-green-500'
  },
  {
    title: 'Promoção de capacitação',
    description: 'Realizar treinamentos sobre o uso da Biblioteca Digital Link e da Minha Biblioteca e das ferramentas de pesquisa, capacitando os usuários.',
    icon: GraduationCap,
    color: 'bg-purple-500'
  },
  {
    title: 'Desenvolvimento de políticas',
    description: 'Contribuir para a elaboração de políticas e diretrizes que regulem o uso da biblioteca digital, assegurando que as normas sejam seguidas.',
    icon: FileText,
    color: 'bg-red-500'
  },
  {
    title: 'Plano de ensino',
    description: 'Validar as bibliografias indicadas pelos professores nos planos de ensino, assegurando sua conformidade com as normas do MEC.',
    icon: BookOpen,
    color: 'bg-yellow-500'
  },
  {
    title: 'Marketing',
    description: 'Promover, em parceria com a equipe de Comunicação Interna, ações para divulgação da Biblioteca Digital Link.',
    icon: Megaphone,
    color: 'bg-pink-500'
  },
  {
    title: 'Minha Biblioteca',
    description: 'Extrair relatórios semanais, realizar o monitoramento dos problemas e solucioná-los com a equipe da Minha Biblioteca.',
    icon: BarChart3,
    color: 'bg-indigo-500'
  },
  {
    title: 'Clube de Leitura',
    description: 'Promover encontros dos estudantes com autores de livros que contemplem temas de interesse.',
    icon: BookMarked,
    color: 'bg-teal-500'
  }
];

const Sobre = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <section className="relative bg-lsb-primary py-20 md:py-32 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          </div>
          
          <div className="lsb-container">
            <div className="lsb-content">
              <div className="relative text-center">
                <div className="animate-fade-in">
                  <h1 className="hero-title text-white mb-6">
                    Sobre a
                    <span className="block text-lsb-accent">Biblioteca Digital da Link</span>
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                    Oferecemos acesso qualificado à informação e ao conhecimento, promovendo a educação, a pesquisa e a cultura
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Missão Section */}
        <section className="py-16 bg-white">
          <div className="lsb-container">
            <div className="lsb-content">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="animate-slide-up">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Missão</h2>
                  <div className="prose prose-lg text-gray-600">
                    <p className="leading-relaxed">
                      A Biblioteca Digital Link tem como objetivo proporcionar acesso a uma ampla gama de recursos informacionais, promovendo o aprendizado e a pesquisa no campo da administração de empresas com ênfase em empreendedorismo e outras áreas do conhecimento.
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="bg-gradient-to-br from-lsb-primary to-blue-600 rounded-2xl p-8 text-white">
                    <BookOpen className="h-12 w-12 text-lsb-accent mb-4" />
                    <h3 className="text-2xl font-semibold mb-4">Conhecimento Acessível</h3>
                    <p className="text-blue-100 leading-relaxed">
                      Democratizamos o acesso ao conhecimento através de uma plataforma digital moderna e intuitiva, conectando estudantes e professores aos melhores recursos acadêmicos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Função da Biblioteca Digital */}
        <section className="py-16 bg-gray-50">
          <div className="lsb-container">
            <div className="lsb-content">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Função da Biblioteca Digital Link</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Compete à Biblioteca Digital Link realizar as seguintes funções
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {libraryFunctions.map((func, index) => {
                  const IconComponent = func.icon;
                  return (
                    <Card key={index} className="relative overflow-hidden hover:shadow-xl transition-all duration-300 group">
                      <div className={`absolute top-0 left-0 w-2 h-full ${func.color}`}></div>
                      
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-4 mb-3">
                          <div className={`p-3 rounded-lg ${func.color.replace('bg-', 'bg-').replace('-500', '-50')}`}>
                            <IconComponent className={`h-6 w-6 ${func.color.replace('bg-', 'text-')}`} />
                          </div>
                        </div>
                        <CardTitle className="text-xl text-gray-900">{func.title}</CardTitle>
                      </CardHeader>
                      
                      <CardContent>
                        <CardDescription className="text-gray-600 leading-relaxed">
                          {func.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Função do Bibliotecário */}
        <section className="py-16 bg-white">
          <div className="lsb-container">
            <div className="lsb-content">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Função do Bibliotecário</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  O bibliotecário da Link tem um papel fundamental na gestão da Biblioteca Digital Link
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {librarianFunctions.map((func, index) => {
                  const IconComponent = func.icon;
                  return (
                    <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${func.color.replace('bg-', 'bg-').replace('-500', '-50')}`}>
                            <IconComponent className={`h-5 w-5 ${func.color.replace('bg-', 'text-')}`} />
                          </div>
                        </div>
                        <CardTitle className="text-lg text-gray-900 leading-tight">{func.title}</CardTitle>
                      </CardHeader>
                      
                      <CardContent>
                        <CardDescription className="text-gray-600 leading-relaxed text-sm">
                          {func.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Sobre;
