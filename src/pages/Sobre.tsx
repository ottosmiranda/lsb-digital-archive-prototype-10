
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Download, Globe, Heart, Mail, Phone, MapPin } from "lucide-react";

const stats = [
  { label: 'Recursos Disponíveis', value: '1,026', icon: BookOpen },
  { label: 'Usuários Ativos', value: '15,234', icon: Users },
  { label: 'Downloads Realizados', value: '89,567', icon: Download },
  { label: 'Países Atendidos', value: '45', icon: Globe }
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

const Sobre = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sobre a Biblioteca Digital LSB
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Democratizando o acesso ao conhecimento através de uma plataforma digital 
            aberta e colaborativa para toda a comunidade lusófona.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-12">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Nossa Missão</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg mx-auto">
              <p className="text-gray-600 text-center">
                Promover o acesso livre e gratuito ao conhecimento, oferecendo uma 
                biblioteca digital abrangente que conecta pessoas, ideias e recursos 
                educacionais de qualidade. Acreditamos que o conhecimento deve ser 
                acessível a todos, independentemente de localização ou condição social.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center mb-8">Nossa Comunidade</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card key={index} className="text-center">
                  <CardHeader className="pb-3">
                    <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center mb-8">Nossos Valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="p-2 rounded-lg bg-blue-50 w-fit">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Acesso Livre</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Conhecimento deve ser gratuito e acessível a todos, 
                  sem barreiras geográficas ou econômicas.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="p-2 rounded-lg bg-green-50 w-fit">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Colaboração</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Construímos uma comunidade onde todos podem contribuir 
                  e compartilhar conhecimento.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="p-2 rounded-lg bg-purple-50 w-fit">
                  <Heart className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Qualidade</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Curamos cuidadosamente nosso acervo para garantir 
                  conteúdo relevante e de alta qualidade.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center mb-8">Nossa Equipe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-3"></div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription>{member.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="text-xs">
                    {member.expertise}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-center mb-6">Entre em Contato</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Email</div>
                <div className="text-sm text-gray-600">contato@lsb.digital</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Telefone</div>
                <div className="text-sm text-gray-600">+55 (11) 3456-7890</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Endereço</div>
                <div className="text-sm text-gray-600">São Paulo, Brasil</div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <Button>
              Enviar Mensagem
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Sobre;
