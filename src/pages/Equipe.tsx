
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Equipe = () => {
  const teamMembers = [
    {
      name: "Dr. Maria Silva",
      role: "Diretora da Biblioteca Digital",
      description: "Especialista em Ciência da Informação com mais de 15 anos de experiência em bibliotecas digitais e gestão de acervos acadêmicos.",
      image: "/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png"
    },
    {
      name: "Prof. João Santos",
      role: "Coordenador Técnico",
      description: "Especialista em tecnologias da informação e sistemas de gerenciamento de conteúdo digital, responsável pela infraestrutura técnica da plataforma.",
      image: "/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png"
    },
    {
      name: "Ana Costa",
      role: "Bibliotecária Especialista",
      description: "Responsável pela curadoria e organização do acervo, com expertise em catalogação e classificação de recursos educacionais.",
      image: "/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png"
    },
    {
      name: "Carlos Oliveira",
      role: "Suporte ao Usuário",
      description: "Responsável pelo atendimento aos usuários e treinamentos sobre o uso da plataforma, garantindo a melhor experiência de acesso aos recursos.",
      image: "/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="lsb-container py-12">
        <div className="lsb-content">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Nossa Equipe
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Conheça os profissionais dedicados que tornam possível o acesso 
                aos recursos educacionais da Biblioteca Digital LSB.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-8 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-6">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-24 h-24 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {member.name}
                      </h3>
                      <p className="text-lsb-primary font-medium mb-3">
                        {member.role}
                      </p>
                      <p className="p2-text">
                        {member.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Missão da Equipe
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-lsb-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-lsb-primary fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Excelência</h3>
                  <p className="p2-text">
                    Comprometidos em oferecer recursos de alta qualidade e serviços excepcionais.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-lsb-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-lsb-primary fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Inovação</h3>
                  <p className="p2-text">
                    Sempre buscando novas tecnologias e metodologias para melhorar a experiência do usuário.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-lsb-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-lsb-primary fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4h2v-7.5c0-.83.67-1.5 1.5-1.5S12 9.67 12 10.5V18h2v-4h3v4h4v2H4v-2z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Colaboração</h3>
                  <p className="p2-text">
                    Trabalhando em equipe para criar um ambiente de aprendizado colaborativo e inclusivo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Equipe;
