
import { Search, Filter } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const filterOptions = [
    { id: 'titulo', label: 'Título' },
    { id: 'autor', label: 'Autor' },
    { id: 'video', label: 'Vídeo' },
    { id: 'podcast', label: 'Podcast' }
  ];

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (searchQuery.trim()) {
      queryParams.set('q', searchQuery);
    }
    activeFilters.forEach(filter => {
      queryParams.append('filtros', filter);
    });
    window.location.href = `/buscar?${queryParams.toString()}`;
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-lsb-primary via-blue-900 to-indigo-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center">
          {/* Hero Content */}
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Sua fonte aberta de
              <span className="block text-lsb-accent">conhecimento na LSB</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Explore livros, artigos, vídeos e podcasts sem precisar fazer login.
            </p>

            {/* CTA Button */}
            <div className="mb-16">
              <Button
                size="lg"
                className="bg-lsb-accent hover:bg-lsb-accent/90 text-lsb-primary font-semibold px-8 py-4 text-lg rounded-full hover-lift transform transition-all duration-300"
                onClick={() => window.location.href = '/buscar'}
              >
                Explorar Biblioteca
                <Search className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Advanced Search */}
          <div className="animate-slide-up max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4 text-lg">Busca Avançada</h3>
              
              <form onSubmit={handleSearch} className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Digite sua busca aqui..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-white/90 border-0 rounded-xl text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-lsb-accent"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="absolute right-2 top-2 bottom-2 px-4 bg-lsb-accent hover:bg-lsb-accent/90 text-lsb-primary rounded-lg"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {/* Filter Chips */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {filterOptions.map((filter) => (
                    <Badge
                      key={filter.id}
                      variant={activeFilters.includes(filter.id) ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-200 ${
                        activeFilters.includes(filter.id)
                          ? 'bg-lsb-accent text-lsb-primary hover:bg-lsb-accent/90'
                          : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                      }`}
                      onClick={() => toggleFilter(filter.id)}
                    >
                      <Filter className="h-3 w-3 mr-1" />
                      {filter.label}
                    </Badge>
                  ))}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-float opacity-20">
        <div className="w-16 h-16 bg-lsb-accent rounded-full"></div>
      </div>
      <div className="absolute bottom-20 right-10 animate-float opacity-20" style={{ animationDelay: '1s' }}>
        <div className="w-12 h-12 bg-white rounded-full"></div>
      </div>
    </section>
  );
};

export default Hero;
