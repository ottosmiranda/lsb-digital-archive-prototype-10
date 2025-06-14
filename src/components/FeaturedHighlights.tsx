
import { ChevronLeft, ChevronRight, Star, ImageOff } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDataLoader } from '@/hooks/useDataLoader';
import { useNavigate } from 'react-router-dom';

// Helper fallback for missing thumbnails
const FallbackThumb = ({ label = "Miniatura Indisponível" }) => (
  <div className="w-full h-64 bg-gray-200 flex items-center justify-center flex-col gap-2">
    <ImageOff className="w-12 h-12 text-gray-400" />
    <span className="text-gray-500 text-sm">{label}</span>
  </div>
);

// Picks up to 4 items, mixing podcasts, videos, and books with image where possible
function getFeaturedHighlights(allData) {
  if (!allData || allData.length === 0) return [];
  // Separate into types
  const podcasts = allData.filter(item => item.type === "podcast");
  const videos = allData.filter(item => item.type === "video");
  const livros = allData.filter(item => item.type === "titulo" || item.type === "livro");
  // Try to ensure at least 1 of each type
  let picks = [];
  if (podcasts[0]) picks.push(podcasts[0]);
  if (videos[0]) picks.push(videos[0]);
  if (livros[0]) picks.push(livros[0]);
  // Fill up to 4 with next-most-recent of any type
  const all = [...podcasts.slice(1), ...videos.slice(1), ...livros.slice(1)];
  for (const item of all) {
    if (picks.length >= 4) break;
    // Don't duplicate
    if (!picks.find(h => h.id === item.id && h.type === item.type)) picks.push(item);
  }
  return picks.slice(0, 4);
}

const typeBadge = (type) => {
  switch (type) {
    case "podcast": return "Podcast";
    case "video": return "Vídeo";
    case "titulo":
    case "livro":
      return "Livro";
    default: return "Conteúdo";
  }
};

const typeBadgeColor = (type) => {
  switch (type) {
    case "livro":
    case "titulo": return "bg-blue-100 text-blue-800";
    case "video": return "bg-red-100 text-red-800";
    case "podcast": return "bg-purple-100 text-purple-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const FeaturedHighlights = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { allData, loading } = useDataLoader();
  const navigate = useNavigate();

  // Memoize highlights so we pick new ones only when data changes
  const highlights = useMemo(() => getFeaturedHighlights(allData), [allData]);
  const maxSlide = Math.max(1, highlights.length - 3);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % maxSlide);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + maxSlide) % maxSlide);

  // UI
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

        {/* LOADING, fallback, or Highlights Grid/Carousel */}
        {loading ? (
          <div className="text-center my-12 text-lg text-gray-400 animate-pulse">Carregando destaques…</div>
        ) : highlights.length === 0 ? (
          <div className="text-center my-12 text-lg text-gray-400">Nenhum destaque encontrado.</div>
        ) : (
          <div className="relative">
            {/* Desktop Grid */}
            <div className="hidden md:block">
              <div className="grid grid-cols-4 gap-6">
                {highlights.slice(currentSlide, currentSlide + 4).map((item, index) => (
                  <Card key={item.id + '-' + item.type} className="group hover-lift animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardContent className="p-0">
                      <div className="relative overflow-hidden rounded-t-lg">
                        {item.thumbnail || item.imagem_url ? (
                          <img 
                            src={item.thumbnail || item.imagem_url}
                            alt={item.title}
                            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <FallbackThumb />
                        )}
                        <Badge className="absolute top-3 left-3 bg-lsb-accent text-lsb-primary flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Escolha da Equipe
                        </Badge>
                      </div>
                      <div className="p-4">
                        <Badge variant="outline" className={`mb-2 text-xs ${typeBadgeColor(item.type)}`}>
                          {typeBadge(item.type)}
                        </Badge>
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">{item.author}</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-lsb-primary hover:bg-lsb-primary hover:text-white transition-all duration-300"
                          onClick={() => navigate(`/recurso/${item.id}`)}
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
                    <div key={item.id + '-' + item.type} className="w-full flex-shrink-0 px-4">
                      <Card className="group hover-lift">
                        <CardContent className="p-0">
                          <div className="relative overflow-hidden rounded-t-lg">
                            {item.thumbnail || item.imagem_url ? (
                              <img 
                                src={item.thumbnail || item.imagem_url}
                                alt={item.title}
                                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <FallbackThumb />
                            )}
                            <Badge className="absolute top-3 left-3 bg-lsb-accent text-lsb-primary flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Escolha da Equipe
                            </Badge>
                          </div>
                          <div className="p-4">
                            <Badge variant="outline" className={`mb-2 text-xs ${typeBadgeColor(item.type)}`}>
                              {typeBadge(item.type)}
                            </Badge>
                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">{item.author}</p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full text-lsb-primary hover:bg-lsb-primary hover:text-white"
                              onClick={() => navigate(`/recurso/${item.id}`)}
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
              disabled={highlights.length <= 4}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full w-10 h-10 p-0 bg-white shadow-lg border-2 border-gray-200 hover:border-lsb-accent"
              onClick={nextSlide}
              disabled={highlights.length <= 4}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Dots Indicator */}
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: maxSlide }).map((_, index) => (
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
