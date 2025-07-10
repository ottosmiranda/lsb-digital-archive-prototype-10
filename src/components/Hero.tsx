import { Search, Filter, Command, Book, Play, Headphones } from 'lucide-react';
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
    <section className="relative bg-gradient-to-br from-link-dark via-slate-800 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
      </div>

      <div className="link-container">
        <div className="relative py-20 md:py-32">
          <div className="text-center">
            {/* Hero Content */}
            <div className="animate-fade-in">
              <h1 className="link-h1 text-white mb-6">
                Sua fonte aberta de
                <span className="block text-link-cta">conhecimento na LSB</span>
              </h1>
              
              <p className="link-p1 text-link-white/90 mb-16 max-w-3xl mx-auto">
                Explore livros, artigos, vídeos e podcasts sem precisar fazer login.
              </p>
            </div>

            {/* Enhanced Search */}
            <div className="animate-slide-up max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
                <h3 className="link-h3 text-white mb-4">Busca Inteligente</h3>
                  
                  <form onSubmit={handleSearch} className="space-y-4">
                    {/* Search Input */}
                    <div className="relative" ref={searchRef}>
                      <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Digite sua busca aqui... (Ctrl+K)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={handleSearchFocus}
                        className="w-full pl-4 pr-20 py-4 bg-white/95 border-0 rounded-xl text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-lsb-accent text-lg"
                      />
                      <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1">
                        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          <Command className="h-3 w-3" />
                          K
                        </kbd>
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          className="px-4 py-2"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>

                      <EnhancedSearchSuggestions
                        query={searchQuery}
                        onSuggestionClick={handleSuggestionClick}
                        onClose={() => {}}
                        isVisible={showSuggestions}
                        className="bg-white/95 backdrop-blur-sm border-white/20 z-[9999]"
                      />
                    </div>

                    {/* Filter Chips */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {filterOptions.map((filter) => (
                        <Badge
                          key={filter.id}
                          variant={activeFilters.includes(filter.id) ? "default" : "outline"}
                          className={`cursor-pointer transition-all duration-200 px-4 py-2 ${
                            activeFilters.includes(filter.id)
                              ? 'bg-link-cta text-black hover:bg-link-cta/90'
                              : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                          }`}
                          onClick={() => toggleFilter(filter.id)}
                        >
                          <filter.icon className="h-3 w-3 mr-1" />
                          {filter.label}
                        </Badge>
                      ))}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-float opacity-20">
          
        </div>
        <div
          className="absolute bottom-20 right-10 animate-float opacity-20"
          style={{ animationDelay: '1s' }}
        >
          
        </div>
      </section>
  );
};

export default Hero;
