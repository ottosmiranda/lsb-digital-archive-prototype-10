
import { ArrowUp, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const institutionalLinks = [
    { label: 'Sobre a LSB', href: '/sobre' },
    { label: 'Nossa História', href: '/historia' },
    { label: 'Equipe', href: '/equipe' },
    { label: 'Missão e Valores', href: '/missao' }
  ];

  const quickLinks = [
    { label: 'Catálogo Completo', href: '/buscar' },
    { label: 'Novidades', href: '/buscar?ordenar=recentes' },
    { label: 'Mais Acessados', href: '/buscar?ordenar=mais-acessados' },
    { label: 'Coleções', href: '/colecoes' }
  ];

  return (
    <footer className="bg-lsb-primary text-white relative">
      <div className="lsb-container">
        <div className="lsb-content">
          <div className="py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Logo and Description */}
              <div className="lg:col-span-1">
                <div className="flex items-center space-x-2 mb-4">
                  <img 
                    src="/lovable-uploads/71002455-3c64-4df7-8cad-1b228571014d.png" 
                    alt="Biblioteca Link" 
                    className="h-10 w-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-10 h-10 bg-lsb-accent rounded-lg flex items-center justify-center">
                    <span className="text-lsb-primary font-bold text-xl">LSB</span>
                  </div>
                </div>
                <p className="text-blue-200 leading-relaxed">
                  Democratizando o acesso ao conhecimento através de uma plataforma digital 
                  aberta e inclusiva para toda a comunidade acadêmica.
                </p>
              </div>

              {/* Institutional Links */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-lsb-accent">Institucional</h3>
                <ul className="space-y-2">
                  {institutionalLinks.map((link) => (
                    <li key={link.label}>
                      <a 
                        href={link.href}
                        className="text-blue-200 hover:text-white transition-colors duration-150 text-sm"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-lsb-accent">Links Rápidos</h3>
                <ul className="space-y-2">
                  {quickLinks.map((link) => (
                    <li key={link.label}>
                      <a 
                        href={link.href}
                        className="text-blue-200 hover:text-white transition-colors duration-150 text-sm"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-lsb-accent">Contato</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-lsb-accent" />
                    <a 
                      href="mailto:biblioteca@lsb.edu.br"
                      className="text-blue-200 hover:text-white transition-colors duration-150 text-sm"
                    >
                      biblioteca@lsb.edu.br
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-lsb-accent" />
                    <span className="text-blue-200 text-sm">(11) 3456-7890</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-lsb-accent mt-0.5" />
                    <span className="text-blue-200 text-sm">
                      Rua do Conhecimento, 123<br />
                      São Paulo, SP - 01234-567
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-blue-800 mt-12 pt-8">
              <div className="text-center">
                <p className="text-blue-200 text-sm">
                  © 2025 Link School of Business. Todos os direitos reservados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <Button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-lsb-accent hover:bg-lsb-accent/90 text-lsb-primary shadow-lg hover-lift"
        size="sm"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </footer>
  );
};

export default Footer;
