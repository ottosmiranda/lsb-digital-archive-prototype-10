
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const FeaturedHighlights = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const highlights = [
    {
      id: 1,
      title: "Estratégias de Marketing Digital para Pequenas Empresas",
      type: "Livro",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=500&fit=crop",
      author: "Prof. Ana Silva",
      isTeamChoice: true
    },
    {
      id: 2,
      title: "Fundamentos da Gestão Financeira Moderna",
      type: "Artigo",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=500&fit=crop",
      author: "Dr. Carlos Mendes",
      isTeamChoice: true
    },
    {
      id: 3,
      title: "Liderança Transformacional no Século XXI",
      type: "Vídeo",
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=500&fit=crop",
      author: "Prof. Marina Santos",
      isTeamChoice: true
    },
    {
      id: 4,
      title: "Inovação e Tecnologia nos Negócios",
      type: "Podcast",
      image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=500&fit=crop",
      author: "Equipe LSB",
      isTeamChoice: true
    },
    {
      id: 5,
      title: "Sustentabilidade Empresarial",
      type: "Livro",
      image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=500&fit=crop",
      author: "Prof. João Costa",
      isTeamChoice: true
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.max(1, highlights.length - 3));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.max(1, highlights.length - 3)) % Math.max(1, highlights.length - 3));
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold lsb-primary mb-4">
            Destaques da Semana
          </h2>
          <div className="w-24 h-1 bg-lsb-accent mx-auto rounded-full"></div>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Desktop Grid */}
          <div className="hidden md:block">
            <div className="grid grid-cols-4 gap-6">
              {highlights.slice(currentSlide, currentSlide + 4).map((item, index) => (
                <Card key={item.id} className="group hover-lift animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {item.isTeamChoice && (
                        <Badge className="absolute top-3 left-3 bg-lsb-accent text-lsb-primary">
                          <Star className="h-3 w-3 mr-1" />
                          Escolha da Equipe
                        </Badge>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <Badge variant="outline" className="mb-2 text-xs">
                        {item.type}
                      </Badge>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">{item.author}</p>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-lsb-primary hover:bg-lsb-primary hover:text-white transition-all duration-300"
                        onClick={() => window.location.href = `/detalhe/${item.id}`}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Mobile Carousel */}
          <div className="md:hidden">
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {highlights.map((item, index) => (
                  <div key={item.id} className="w-full flex-shrink-0 px-4">
                    <Card className="group hover-lift">
                      <CardContent className="p-0">
                        <div className="relative overflow-hidden rounded-t-lg">
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {item.isTeamChoice && (
                            <Badge className="absolute top-3 left-3 bg-lsb-accent text-lsb-primary">
                              <Star className="h-3 w-3 mr-1" />
                              Escolha da Equipe
                            </Badge>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <Badge variant="outline" className="mb-2 text-xs">
                            {item.type}
                          </Badge>
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">{item.author}</p>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-lsb-primary hover:bg-lsb-primary hover:text-white"
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <Button
            variant="outline"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full w-10 h-10 p-0 bg-white shadow-lg border-2 border-gray-200 hover:border-lsb-accent"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full w-10 h-10 p-0 bg-white shadow-lg border-2 border-gray-200 hover:border-lsb-accent"
            onClick={nextSlide}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: Math.max(1, highlights.length - 3) }).map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-lsb-accent w-8' : 'bg-gray-300'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedHighlights;
