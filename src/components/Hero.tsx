
import { Search, Filter, Command, Book, Play, Headphones, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

  const filterOptions = [
    {
      id: 'titulo',
      label: 'Livros & Artigos',
      icon: Book
    },
    {
      id: 'video',
      label: 'Vídeos',
      icon: Play
    },
    {
      id: 'podcast',
      label: 'Podcasts',
      icon: Headphones
    }
  ];

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-lsb-primary via-blue-900 to-indigo-900 overflow-hidden">
      {/* Enhanced Background Patterns */}
      <div className="absolute inset-0">
        {/* Primary gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-transparent to-purple-600/20"></div>
        
        {/* Geometric patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 border border-white/30 rounded-[2px] animate-float"></div>
          <div className="absolute top-40 right-20 w-20 h-20 border border-lsb-accent/50 rounded-[2px] animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-40 left-20 w-24 h-24 border border-white/20 rounded-[2px] animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-20 right-40 w-16 h-16 border border-lsb-accent/40 rounded-[2px] animate-float" style={{ animationDelay: '0.5s' }}></div>
        </div>

        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <Book className="absolute top-32 left-1/4 h-8 w-8 text-white/20 animate-float" style={{ animationDelay: '3s' }} />
          <Play className="absolute top-1/3 right-1/4 h-6 w-6 text-lsb-accent/30 animate-float" style={{ animationDelay: '1.5s' }} />
          <Headphones className="absolute bottom-1/3 left-1/3 h-7 w-7 text-white/25 animate-float" style={{ animationDelay: '2.5s' }} />
          <Sparkles className="absolute bottom-40 right-1/3 h-5 w-5 text-lsb-accent/40 animate-float" style={{ animationDelay: '0.8s' }} />
        </div>

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/20"></div>
      </div>

      <div className="lsb-container relative z-10">
        <div className="lsb-content">
          <div className="relative py-20 md:py-32">
            <div className="text-center">
              {/* Enhanced Hero Content */}
              <div className="animate-fade-in mb-12">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                  Descubra o poder do
                  <span className="block text-lsb-accent bg-gradient-to-r from-lsb-accent to-yellow-300 bg-clip-text text-transparent">
                    conhecimento acessível
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                  Explore nossa biblioteca digital com milhares de recursos educacionais em Libras. 
                  <span className="block mt-2 text-lg text-blue-200">
                    Livros, vídeos, podcasts e muito mais - tudo gratuito e sem necessidade de login.
                  </span>
                </p>
              </div>

              {/* Enhanced Search Section */}
              <div className="animate-slide-up max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-lg rounded-[2px] p-8 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-center mb-6">
                    <Search className="h-6 w-6 text-lsb-accent mr-3" />
                    <h3 className="text-white font-semibold text-xl">Busca Inteligente</h3>
                  </div>
                  
                  <form onSubmit={handleSearch} className="space-y-6">
                    {/* Enhanced Search Input */}
                    <div className="relative" ref={searchRef}>
                      <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Digite sua busca aqui... (Ctrl+K)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={handleSearchFocus}
                        className="w-full pl-4 pr-24 py-6 bg-white/95 border-0 rounded-[2px] text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-lsb-accent text-lg shadow-lg"
                      />
                      <div className="absolute right-2 top-2 bottom-2 flex items-center gap-2">
                        <kbd className="hidden sm:inline-flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-[2px] font-mono">
                          <Command className="h-3 w-3" />
                          K
                        </kbd>
                        <Button
                          type="submit"
                          size="sm"
                          className="px-6 py-3 bg-lsb-accent hover:bg-lsb-accent/90 text-lsb-primary rounded-[2px] font-semibold shadow-lg"
                        >
                          <Search className="h-5 w-5" />
                        </Button>
                      </div>

                      <EnhancedSearchSuggestions
                        query={searchQuery}
                        onSuggestionClick={handleSuggestionClick}
                        onClose={() => {}}
                        isVisible={showSuggestions}
                        className="bg-white/95 backdrop-blur-sm border-white/20 z-[9999] rounded-[2px]"
                      />
                    </div>

                    {/* Enhanced Filter Chips */}
                    <div className="flex flex-wrap gap-3 justify-center">
                      {filterOptions.map((filter) => (
                        <Badge
                          key={filter.id}
                          variant={activeFilters.includes(filter.id) ? "default" : "outline"}
                          className={`cursor-pointer transition-all duration-300 px-6 py-3 text-sm ${
                            activeFilters.includes(filter.id)
                              ? 'bg-lsb-accent text-lsb-primary hover:bg-lsb-accent/90 shadow-lg'
                              : 'bg-white/20 text-white border-white/30 hover:bg-white/30 hover:scale-105'
                          } rounded-[2px]`}
                          onClick={() => toggleFilter(filter.id)}
                        >
                          <filter.icon className="h-4 w-4 mr-2" />
                          {filter.label}
                        </Badge>
                      ))}
                    </div>
                  </form>

                  {/* Search Statistics */}
                  <div className="mt-8 pt-6 border-t border-white/20">
                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div>
                        <div className="text-2xl font-bold text-lsb-accent">1.000+</div>
                        <div className="text-sm text-blue-200">Recursos</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-lsb-accent">50+</div>
                        <div className="text-sm text-blue-200">Categorias</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-lsb-accent">100%</div>
                        <div className="text-sm text-blue-200">Gratuito</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
