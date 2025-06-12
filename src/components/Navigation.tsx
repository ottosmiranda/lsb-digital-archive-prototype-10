
import { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, Link } from 'react-router-dom';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const navItems = [
    { label: 'Assuntos', href: '/assuntos' },
    { label: 'Mídia', href: '/midia' },
    { label: 'Sobre', href: '/sobre' }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-effect border-b border-lsb-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-lsb-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">LSB</span>
              </div>
              <span className="hidden sm:block font-bold text-xl lsb-primary">
                Biblioteca Digital
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-gray-700 hover:text-lsb-primary px-3 py-2 text-sm font-medium transition-colors duration-150"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Pesquisar livro, autor, vídeo ou palavra-chave"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-2 rounded-full border-2 border-gray-200 focus:border-lsb-accent focus:ring-2 focus:ring-lsb-accent/20"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1 bottom-1 px-3 bg-lsb-accent hover:bg-lsb-accent/90 text-lsb-primary rounded-full"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden animate-fade-in">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-lsb-gray">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative mb-4">
                <Input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-12 py-2 rounded-full"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1 top-1 bottom-1 px-3 bg-lsb-accent hover:bg-lsb-accent/90 text-lsb-primary rounded-full"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              {/* Mobile Menu Items */}
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-lsb-primary hover:bg-gray-50 rounded-md transition-colors duration-150"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
