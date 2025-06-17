import { Search, Filter, Command } from 'lucide-react';
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
    label: 'Livros'
  }, {
    id: 'video',
    label: 'Vídeos'
  }, {
    id: 'podcast',
    label: 'Podcasts'
  }];
  return <section className="relative bg-gradient-to-br from-lsb-primary via-blue-900 to-indigo-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center">
          {/* Hero Content */}
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Sua fonte aberta de
              <span className="block text-lsb-accent">conhecimento na LSB</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-16 max-w-3xl mx-auto leading-relaxed">
              Explore livros, artigos, vídeos e podcasts sem precisar fazer login.
            </p>
          </div>

          {/* Enhanced Search */}
          <div className="animate-slide-up max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4 text-lg">Busca Inteligente</h3>
              
              <form onSubmit={handleSearch} className="space-y-4">
                {/* Search Input */}
                <div className="relative" ref={searchRef}>
                  <Input ref={inputRef} type="text" placeholder="Digite sua busca aqui... (Ctrl+K)" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onFocus={handleSearchFocus} className="w-full pl-4 pr-20 py-4 bg-white/95 border-0 rounded-xl text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-lsb-accent text-lg" />
                  <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1">
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      <Command className="h-3 w-3" />
                      K
                    </kbd>
                    <Button type="submit" size="sm" className="px-4 py-2 bg-lsb-accent hover:bg-lsb-accent/90 text-lsb-primary rounded-lg">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>

                  <EnhancedSearchSuggestions query={searchQuery} onSuggestionClick={handleSuggestionClick} onClose={() => {}} isVisible={showSuggestions} className="bg-white/95 backdrop-blur-sm border-white/20 z-[9999]" />
                </div>

                {/* Filter Chips */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {filterOptions.map(filter => <Badge key={filter.id} variant={activeFilters.includes(filter.id) ? "default" : "outline"} className={`cursor-pointer transition-all duration-200 px-4 py-2 ${activeFilters.includes(filter.id) ? 'bg-lsb-accent text-lsb-primary hover:bg-lsb-accent/90' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}`} onClick={() => toggleFilter(filter.id)}>
                      <Filter className="h-3 w-3 mr-1" />
                      {filter.label}
                    </Badge>)}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-float opacity-20">
        
      </div>
      <div className="absolute bottom-20 right-10 animate-float opacity-20" style={{
      animationDelay: '1s'
    }}>
        
      </div>
    </section>;
};
export default Hero;