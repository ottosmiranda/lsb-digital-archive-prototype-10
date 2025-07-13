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
  return <section className="relative h-screen bg-[#10284E] overflow-hidden">
      <div className="lsb-container relative z-10 h-full">
        <div className="lsb-content h-full">
          <div className="relative h-full flex items-center justify-center">
            <div className="text-center w-full">
              {/* Enhanced Hero Content */}
              <div className="animate-fade-in mb-12">
                <h1 className="text-6xl font-bold tracking-[-0.04em] leading-none text-white mb-6">
                  Conhecimento ao
                  <span className="block text-lsb-accent bg-gradient-to-r from-lsb-accent to-[#FEC641] bg-clip-text text-transparent">
                    seu alcance
                  </span>
                </h1>
                
                <p className="text-2xl font-normal tracking-[-0.02em] leading-[1.4] mb-6 text-[#FFFFFF] max-w-4xl mx-auto">
                  Explore livros, artigos, vídeos e podcasts em um único lugar
                </p>
              </div>

              {/* Enhanced Search Section */}
              <div className="animate-slide-up max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-lg rounded-[2px] p-8 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-center mb-6">
                    <Search className="h-6 w-6 text-lsb-accent mr-3" />
                    <h3 className="text-white font-semibold text-xl">Busca no acervo</h3>
                  </div>
                  
                  <form onSubmit={handleSearch} className="space-y-6">
                    {/* Enhanced Search Input */}
                    <div className="relative" ref={searchRef}>
                      <Input ref={inputRef} type="text" placeholder="Digite sua busca aqui... (Ctrl+K)" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onFocus={handleSearchFocus} className="w-full pl-4 pr-24 py-6 bg-white/95 border-0 rounded-[2px] text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-lsb-accent text-lg shadow-lg" />
                      <div className="absolute right-2 top-2 bottom-2 flex items-center gap-2">
                        
                        <Button type="submit" size="sm" className="px-6 py-3 bg-lsb-accent hover:bg-lsb-accent/90 text-lsb-primary rounded-[2px] font-semibold shadow-lg">
                          <Search className="h-5 w-5" />
                        </Button>
                      </div>

                      <EnhancedSearchSuggestions query={searchQuery} onSuggestionClick={handleSuggestionClick} onClose={() => {}} isVisible={showSuggestions} className="bg-white/95 backdrop-blur-sm border-white/20 z-[9999] rounded-[2px]" />
                    </div>

                    {/* Enhanced Filter Chips */}
                    <div className="flex flex-wrap gap-3 justify-center">
                      {filterOptions.map(filter => <Badge key={filter.id} variant={activeFilters.includes(filter.id) ? "default" : "outline"} className={`cursor-pointer transition-all duration-300 px-6 py-3 text-sm ${activeFilters.includes(filter.id) ? 'bg-lsb-accent text-lsb-primary hover:bg-lsb-accent/90 shadow-lg' : 'bg-white/20 text-white border-white/30 hover:bg-white/30 hover:scale-105'} rounded-[2px]`} onClick={() => toggleFilter(filter.id)}>
                          <filter.icon className="h-4 w-4 mr-2" />
                          {filter.label}
                        </Badge>)}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;