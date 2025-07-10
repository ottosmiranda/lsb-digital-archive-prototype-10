
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Download, Globe, Heart, Mail, Phone, MapPin, Target, Eye, Award } from "lucide-react";

const stats = [
  {
    label: 'Recursos Disponíveis',
    value: '1,026',
    icon: BookOpen
  },
  {
    label: 'Usuários Ativos',
    value: '15,234',
    icon: Users
  },
  {
    label: 'Downloads Realizados',
    value: '89,567',
    icon: Download
  },
  {
    label: 'Países Atendidos',
    value: '45',
    icon: Globe
  }
];

const teamMembers = [
  {
    name: 'Dr. Maria Silva',
    role: 'Diretora Acadêmica',
    expertise: 'Educação e Tecnologia'
  },
  {
    name: 'João Santos',
    role: 'Coordenador Técnico',
    expertise: 'Desenvolvimento de Sistemas'
  },
  {
    name: 'Ana Costa',
    role: 'Curadora de Conteúdo',
    expertise: 'Ciências Sociais'
  },
  {
    name: 'Pedro Lima',
    role: 'Designer UX/UI',
    expertise: 'Experiência do Usuário'
  }
];

const missionVisionValues = [
  {
    number: "01",
    title: "Missão",
    description: "Contribuir para a evolução do mundo transformando pessoas através da educação",
    icon: Target,
    color: "bg-blue-500"
  },
  {
    number: "02",
    title: "Visão",
    description: "Ser referência em empreendedorismo, impactando futuras gerações",
    icon: Eye,
    color: "bg-green-500"
  },
  {
    number: "03",
    title: "Valores",
    description: "Respeito, Coragem, Responsabilidade e Simplicidade",
    icon: Award,
    color: "bg-purple-500"
  }
];

const Sobre = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20 md:py-32 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          </div>
          
          <div className="lsb-container">
            <div className="lsb-content">
              <div className="relative text-center">
                <div className="animate-fade-in">
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                    Sobre a
                    <span className="block text-lsb-accent">Link School of Business</span>
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                    Transformando vidas através da educação e do empreendedorismo desde 2020
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Link Section */}
        <section className="py-16 bg-white">
          <div className="lsb-container">
            <div className="lsb-content">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="animate-slide-up">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Quem Somos</h2>
                  <div className="prose prose-lg text-gray-600 space-y-4">
                    <p>
                      A Link School of Business é uma faculdade inovadora fundada em 2020, 
                      dedicada a formar empreendedores e líderes preparados para os desafios 
                      do mundo moderno.
                    </p>
                    <p>
                      Nossa abordagem pedagógica combina teoria e prática, proporcionando 
                      aos estudantes uma experiência educacional única que os prepara para 
                      criar impacto real no mercado.
                    </p>
                    <p>
                      Com um método inovador e foco no desenvolvimento de competências 
                      empreendedoras, formamos profissionais capazes de transformar ideias 
                      em realidade e gerar valor para a sociedade.
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="bg-gradient-to-br from-lsb-primary to-blue-600 rounded-2xl p-8 text-white">
                    <h3 className="text-2xl font-semibold mb-4">Nossa Biblioteca Digital</h3>
                    <p className="text-blue-100 leading-relaxed">
                      Como extensão de nossa missão educacional, a Biblioteca Digital LSB 
                      democratiza o acesso ao conhecimento, oferecendo recursos gratuitos 
                      e de qualidade para toda a comunidade acadêmica e profissional.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission, Vision, Values */}
        <section className="py-16 bg-gray-50">
          <div className="lsb-container">
            <div className="lsb-content">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Nossos Pilares</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Os valores que guiam nossa jornada na transformação da educação
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {missionVisionValues.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <Card key={index} className="relative overflow-hidden hover:shadow-xl transition-all duration-300 group">
                      <div className={`absolute top-0 left-0 w-2 h-full ${item.color}`}></div>
                      
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-4 mb-3">
                          <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center text-white font-bold text-lg`}>
                            {item.number}
                          </div>
                          <div className={`p-2 rounded-lg ${item.color.replace('bg-', 'bg-').replace('-500', '-50')}`}>
                            <IconComponent className={`h-6 w-6 ${item.color.replace('bg-', 'text-')}`} />
                          </div>
                        </div>
                        <CardTitle className="text-xl text-gray-900">{item.title}</CardTitle>
                      </CardHeader>
                      
                      <CardContent>
                        <CardDescription className="text-gray-600 leading-relaxed">
                          {item.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        {/* Team Section */}
        {/* Contact Section */}
      </main>

      <Footer />
    </div>
  );
};

export default Sobre;
