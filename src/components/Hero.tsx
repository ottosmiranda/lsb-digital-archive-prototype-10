
import { Search, Filter, Command, Book, Play, Headphones, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { WipeButton } from '@/components/ui/WipeButton';
import { OutlineWipeButton } from '@/components/ui/OutlineWipeButton';
import { useSearchForm } from '@/hooks/useSearchForm';
import EnhancedSearchSuggestions from '@/components/EnhancedSearchSuggestions';

const Hero = () => {
  const {
    searchQuery,
    setSearchQuery,
    showSuggestions,
    activeFilters,
    toggleFilter,
    searchRef,
    inputRef,
    handleSearch,
    handleSuggestionClick,
    handleSearchFocus
  } = useSearchForm();

  const filterOptions = [{
    id: 'titulo',
    label: 'Livros & Artigos',
    icon: Book
  }, {
    id: 'video',
    label: 'Vídeos',
    icon: Play
  }, {
    id: 'podcast',
    label: 'Podcasts',
    icon: Headphones
  }];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navHeight = 80; // Altura aproximada da navegação
      const elementPosition = element.offsetTop - navHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative min-h-screen bg-[#10284E] overflow-hidden flex items-center">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative flex items-center justify-center min-h-[80vh] md:min-h-screen py-8 md:py-0">
          <div className="text-center w-full max-w-5xl mx-auto">
            {/* Enhanced Hero Content - Mobile optimized */}
            <div className="animate-fade-in mb-8 md:mb-12">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-[-0.04em] leading-[1.1] text-white mb-4 md:mb-6">
                Conhecimento ao
                <span className="block text-lsb-accent bg-gradient-to-r from-lsb-accent to-[#FEC641] bg-clip-text text-transparent">
                  seu alcance
                </span>
              </h1>
              
              <p className="p1 text-white max-w-4xl mx-auto leading-relaxed">
                Explore livros, artigos, vídeos e podcasts em um único lugar
              </p>
            </div>

            {/* Enhanced Search Section - Mobile first */}
            <div className="animate-slide-up max-w-4xl mx-auto mb-8 md:mb-12">
              <div className="bg-white/10 backdrop-blur-lg rounded-lg md:rounded-[2px] p-4 sm:p-6 md:p-8 border border-white/20 shadow-2xl">
                <div className="flex items-center justify-center mb-4 md:mb-6">
                  <Search className="h-5 w-5 md:h-6 md:w-6 text-lsb-accent mr-2 md:mr-3" />
                  <h3 className="text-white font-semibold text-lg md:text-xl">Busca no acervo</h3>
                </div>
                
                <form onSubmit={handleSearch} className="space-y-4 md:space-y-6">
                  {/* Enhanced Search Input - Mobile optimized */}
                  <div className="relative" ref={searchRef}>
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder="Digite sua busca aqui..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={handleSearchFocus}
                      className="w-full pl-4 pr-16 md:pr-24 py-4 md:py-6 bg-white/95 border-0 rounded-lg md:rounded-[2px] text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-lsb-accent text-base md:text-lg shadow-lg"
                    />
                    <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1 md:gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        className="px-3 md:px-6 py-2 md:py-3 bg-lsb-accent hover:bg-lsb-accent/90 text-lsb-primary rounded-lg md:rounded-[2px] font-semibold shadow-lg text-sm md:text-base"
                      >
                        <Search className="h-4 w-4 md:h-5 md:w-5" />
                      </Button>
                    </div>

                    <EnhancedSearchSuggestions
                      query={searchQuery}
                      onSuggestionClick={handleSuggestionClick}
                      onClose={() => {}}
                      isVisible={showSuggestions}
                      className="bg-white/95 backdrop-blur-sm border-white/20 z-[9999] rounded-lg md:rounded-[2px]"
                    />
                  </div>

                  {/* Enhanced Filter Chips - Mobile responsive grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 md:flex md:flex-wrap md:justify-center">
                    {filterOptions.map((filter) => (
                      <Badge
                        key={filter.id}
                        variant={activeFilters.includes(filter.id) ? "default" : "outline"}
                        className={`cursor-pointer transition-all duration-300 px-4 md:px-6 py-2 md:py-3 text-sm md:text-sm text-center ${
                          activeFilters.includes(filter.id)
                            ? 'bg-lsb-accent text-lsb-primary hover:bg-lsb-accent/90 shadow-lg'
                            : 'bg-white/20 text-white border-white/30 hover:bg-white/30 hover:scale-105'
                        } rounded-lg md:rounded-[2px]`}
                        onClick={() => toggleFilter(filter.id)}
                      >
                        <filter.icon className="h-4 w-4 mr-2 inline-block" />
                        <span className="whitespace-nowrap">{filter.label}</span>
                      </Badge>
                    ))}
                  </div>
                </form>
              </div>
            </div>

            {/* CTA Buttons Section */}
            <div className="animate-fade-in flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center max-w-2xl mx-auto">
              <WipeButton
                onClick={() => scrollToSection('destaques-semana')}
                className="w-full sm:w-auto px-8 py-4 text-base md:text-lg"
              >
                Explore Nosso Conteúdo
              </WipeButton>
              
              <OutlineWipeButton
                onClick={() => scrollToSection('minha-biblioteca')}
                className="w-full sm:w-auto px-8 py-4 text-base md:text-lg"
              >
                Descubra a Minha Biblioteca
              </OutlineWipeButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
