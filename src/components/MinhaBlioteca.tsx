
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MinhaBlioteca = () => {
  return (
    <section className="bg-white py-16 md:py-20 lg:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Logo da Minha Biblioteca */}
        <div className="mb-8 md:mb-10">
          <img 
            src="/lovable-uploads/c5513a35-18e1-4801-b43b-9ac995c8979e.png" 
            alt="Minha Biblioteca" 
            className="mx-auto h-16 md:h-20 lg:h-24 w-auto"
          />
        </div>

        {/* Título principal */}
        <h2 className="h2 text-lsb-primary mb-6 md:mb-8">
          Quer ter acesso a milhares de e-books?
        </h2>

        {/* Subtítulo */}
        <p className="p1 text-lsb-subtitle max-w-3xl mx-auto mb-8 md:mb-10">
          Descubra um universo de leitura digital com a Minha Biblioteca, nossa parceira oficial. 
          Acesse milhares de e-books em diversas áreas do conhecimento, de forma rápida, fácil e segura.
        </p>

        {/* CTA Button */}
        <Button 
          asChild
          size="lg"
          className="bg-lsb-accent hover:bg-lsb-accent/90 text-lsb-primary font-semibold px-8 py-3 text-lg"
        >
          <a 
            href="https://app.minhabiblioteca.com.br" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2"
          >
            Acesse agora
            <ExternalLink className="h-5 w-5" />
          </a>
        </Button>
      </div>
    </section>
  );
};

export default MinhaBlioteca;
