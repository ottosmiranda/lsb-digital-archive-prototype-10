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
    icon: Database
  },
  {
    title: 'Suporte ao aprendizado',
    description: 'Facilitar o acesso a informações atualizadas e de qualidade, contribuindo para a formação acadêmica e profissional dos alunos e professores.',
    icon: GraduationCap
  },
  {
    title: 'Promoção da pesquisa',
    description: 'Incentivar a pesquisa acadêmica e a produção de conhecimento, oferecendo ferramentas e recursos que auxiliem os alunos e professores em suas investigações.',
    icon: TrendingUp
  },
  {
    title: 'Ambiente colaborativo',
    description: 'Criar um espaço virtual onde alunos e professores possam compartilhar conhecimentos, experiências e recursos, promovendo a troca de ideias e a inovação.',
    icon: Users
  }
];

const librarianFunctions = [
  {
    title: 'Gestão de recursos',
    description: 'Selecionar, organizar e manter a coleção de materiais disponíveis na Biblioteca Digital Link garantindo que os recursos sejam relevantes e atualizados.',
    icon: Settings
  },
  {
    title: 'Atendimento ao estudante e docente',
    description: 'Realizar pesquisas, levantamentos bibliográficos, oferecer suporte e orientação aos alunos e professores na busca por informações.',
    icon: UserCheck
  },
  {
    title: 'Promoção de capacitação',
    description: 'Realizar treinamentos sobre o uso da Biblioteca Digital Link e da Minha Biblioteca e das ferramentas de pesquisa, capacitando os usuários.',
    icon: GraduationCap
  },
  {
    title: 'Desenvolvimento de políticas',
    description: 'Contribuir para a elaboração de políticas e diretrizes que regulem o uso da biblioteca digital, assegurando que as normas sejam seguidas.',
    icon: FileText
  },
  {
    title: 'Plano de ensino',
    description: 'Validar as bibliografias indicadas pelos professores nos planos de ensino, assegurando sua conformidade com as normas do MEC.',
    icon: BookOpen
  },
  {
    title: 'Marketing',
    description: 'Promover, em parceria com a equipe de Comunicação Interna, ações para divulgação da Biblioteca Digital Link.',
    icon: Megaphone
  },
  {
    title: 'Minha Biblioteca',
    description: 'Extrair relatórios semanais, realizar o monitoramento dos problemas e solucioná-los com a equipe da Minha Biblioteca.',
    icon: BarChart3
  },
  {
    title: 'Clube de Leitura',
    description: 'Promover encontros dos estudantes com autores de livros que contemplem temas de interesse.',
    icon: BookMarked
  }
];

const Sobre = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        {/* Hero Section - Mobile Optimized */}
        <section className="relative py-12 md:py-20 lg:py-32 overflow-hidden" style={{ backgroundColor: '#10284E' }}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          </div>
          
          <div className="lsb-container">
            <div className="lsb-content">
              <div className="relative text-center px-4">
                <div className="animate-fade-in">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold uppercase text-white mb-4 md:mb-6 leading-tight">
                    Sobre a
                    <span className="block text-lsb-accent mt-2">Biblioteca Digital da Link</span>
                  </h1>
                  
                  <p className="p1 text-white max-w-4xl mx-auto leading-relaxed px-4">
                    Oferecemos acesso qualificado à informação e ao conhecimento, promovendo a educação, a pesquisa e a cultura
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Missão Section - Mobile Optimized */}
        <section className="py-12 md:py-16 bg-white">
          <div className="lsb-container">
            <div className="lsb-content">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center px-4">
                <div className="animate-slide-up order-2 lg:order-1">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold uppercase text-gray-900 mb-6">Missão</h2>
                  <div className="prose prose-lg text-gray-600">
                    <p className="p2 leading-relaxed">
                      A Biblioteca Digital Link tem como objetivo proporcionar acesso a uma ampla gama de recursos informacionais, promovendo o aprendizado e a pesquisa no campo da administração de empresas com ênfase em empreendedorismo e outras áreas do conhecimento.
                    </p>
                  </div>
                </div>
                
                <div className="relative order-1 lg:order-2">
                  <div 
                    className="rounded-sm p-6 md:p-8 text-white border" 
                    style={{ 
                      backgroundColor: '#697794',
                      borderColor: '#A7B1C6',
                      borderRadius: '2px'
                    }}
                  >
                    <BookOpen className="h-10 w-10 md:h-12 md:w-12 text-lsb-accent mb-4" />
                    <h3 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4">Conhecimento Acessível</h3>
                    <p className="p2 text-blue-100 leading-relaxed">
                      Democratizamos o acesso ao conhecimento através de uma plataforma digital moderna e intuitiva, conectando estudantes e professores aos melhores recursos acadêmicos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Função da Biblioteca Digital - Mobile Optimized */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="lsb-container">
            <div className="lsb-content px-4">
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold uppercase text-gray-900 mb-4 md:mb-6">Função da Biblioteca Digital Link</h2>
                <p className="p1 text-gray-600 max-w-2xl mx-auto px-4">
                  Compete à Biblioteca Digital Link realizar as seguintes funções
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {libraryFunctions.map((func, index) => {
                  const IconComponent = func.icon;
                  return (
                    <Card key={index} className="relative overflow-hidden hover:shadow-xl transition-all duration-300 group" style={{ borderColor: '#A7B1C6' }}>
                      <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: '#7D8BA5' }}></div>
                      
                      <CardHeader className="pb-3 md:pb-4">
                        <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
                          <div className="p-2 md:p-3 rounded-lg flex-shrink-0" style={{ backgroundColor: '#F1F3F7' }}>
                            <IconComponent className="h-5 w-5 md:h-6 md:w-6" style={{ color: '#7D8BA5' }} />
                          </div>
                        </div>
                        <CardTitle className="text-lg md:text-xl text-gray-900 leading-tight">{func.title}</CardTitle>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <CardDescription className="p2 text-gray-600 leading-relaxed">
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

        {/* Função do Bibliotecário - Mobile Optimized */}
        <section className="py-12 md:py-16 bg-white">
          <div className="lsb-container">
            <div className="lsb-content px-4">
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold uppercase text-gray-900 mb-4 md:mb-6">Função do Bibliotecário</h2>
                <p className="p1 text-gray-600 max-w-2xl mx-auto px-4">
                  O bibliotecário da Link tem um papel fundamental na gestão da Biblioteca Digital Link
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {librarianFunctions.map((func, index) => {
                  const IconComponent = func.icon;
                  return (
                    <Card key={index} className="p-4 md:p-6 lg:p-8 text-center hover:shadow-lg transition-all duration-300 group h-full">
                      <div className="flex flex-col items-center space-y-3 md:space-y-4">
                        <div className="flex-shrink-0">
                          <IconComponent className="h-6 w-6 md:h-8 md:w-8" style={{ color: '#7D8BA5' }} />
                        </div>
                        <CardTitle className="text-sm md:text-base lg:text-lg text-gray-900 uppercase font-bold leading-tight text-center">
                          {func.title}
                        </CardTitle>
                        <CardDescription className="p2 text-gray-600 leading-relaxed text-center">
                          {func.description}
                        </CardDescription>
                      </div>
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
