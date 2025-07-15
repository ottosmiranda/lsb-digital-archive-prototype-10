
import React from 'react';
import { WipeButton } from '@/components/ui/WipeButton';
import { ExternalLink } from 'lucide-react';

const MinhaBlibioteca = () => {
  return (
    <section className="bg-gradient-to-r from-lsb-primary to-blue-600 py-16 md:py-20">
      <div className="lsb-container">
        <div className="lsb-content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Logo Section */}
            <div className="flex justify-center lg:justify-start">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <img 
                  src="/lovable-uploads/a3b0d514-f114-4afd-98b1-d72b06be18fc.png" 
                  alt="Minha Biblioteca - Logo" 
                  className="h-16 md:h-20 w-auto"
                />
              </div>
            </div>
            
            {/* Content Section */}
            <div className="text-center lg:text-left space-y-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white uppercase leading-tight">
                Quer ter acesso a<br />
                <span className="text-lsb-accent">Milhares de e-books?</span>
              </h2>
              
              <div className="inline-block bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                Disponível 24 horas, 7 dias da semana
              </div>
              
              <div className="pt-4">
                <WipeButton 
                  className="inline-flex items-center gap-2 text-lg px-8 py-4"
                  onClick={() => window.open('https://minhabiblioteca.com.br', '_blank')}
                >
                  Acesse agora a Minha Biblioteca
                  <ExternalLink className="h-5 w-5" />
                </WipeButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MinhaBlibioteca;
