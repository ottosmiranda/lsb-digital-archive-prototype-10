
import { useState, useEffect } from 'react';
import { Search, Menu, X, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useLocation } from 'react-router-dom';
import SearchSuggestions from '@/components/SearchSuggestions';
import { useSearchForm } from '@/hooks/useSearchForm';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const {
    searchQuery,
    setSearchQuery,
    showSuggestions,
    setShowSuggestions,
    searchRef,
    inputRef,
    handleSearch,
    handleSuggestionClick,
    handleSearchFocus,
  } = useSearchForm();

  // Second search form for mobile
  const mobileSearchForm = useSearchForm();

  const navItems = [
    { label: 'Assuntos', href: '/assuntos' },
    { label: 'Mídia', href: '/midia' },
    { label: 'Sobre', href: '/sobre' }
  ];

  // Hide search on homepage to avoid duplication with Hero search
  const isHomePage = location.pathname === '/';

  // Update search query from URL on page load
  useEffect(() => {
    if (location.pathname === '/buscar') {
      const urlParams = new URLSearchParams(location.search);
      const query = urlParams.get('q');
      if (query) {
        setSearchQuery(query);
        mobileSearchForm.setSearchQuery(query);
      }
    }
  }, [location, setSearchQuery, mobileSearchForm.setSearchQuery]);

  return (
    <nav className="sticky top-0 z-50 glass-effect border-b border-lsb-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/c5513a35-18e1-4801-b43b-9ac995c8979e.png" 
                alt="Biblioteca Link" 
                className="h-10 w-auto"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='80' viewBox='0 0 200 80'%3E%3Crect width='200' height='80' fill='%23003366'/%3E%3Ctext x='100' y='45' text-anchor='middle' fill='white' font-family='Arial, sans-serif' font-size='16' font-weight='bold'%3EBIBLIOTECA LINK%3C/text%3E%3C/svg%3E";
                }}
              />
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

          {/* Search Bar - Hidden on homepage */}
          {!isHomePage && (
            <div className="hidden md:block flex-1 max-w-md mx-8" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Pesquisar... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  className="w-full pl-4 pr-20 py-2 rounded-full border-2 border-gray-200 focus:border-lsb-accent focus:ring-2 focus:ring-lsb-accent/20"
                />
                <div className="absolute right-1 top-1 bottom-1 flex items-center gap-1">
                  <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    <Command className="h-3 w-3" />
                    K
                  </kbd>
                  <Button
                    type="submit"
                    size="sm"
                    className="px-3 bg-lsb-accent hover:bg-lsb-accent/90 text-lsb-primary rounded-full"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                <SearchSuggestions
                  query={searchQuery}
                  onSuggestionClick={handleSuggestionClick}
                  onClose={() => setShowSuggestions(false)}
                  isVisible={showSuggestions}
                />
              </form>
            </div>
          )}

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
              {/* Mobile Search - Hidden on homepage */}
              {!isHomePage && (
                <div className="relative mb-4" ref={mobileSearchForm.searchRef}>
                  <form onSubmit={mobileSearchForm.handleSearch}>
                    <Input
                      ref={mobileSearchForm.inputRef}
                      type="text"
                      placeholder="Pesquisar..."
                      value={mobileSearchForm.searchQuery}
                      onChange={(e) => mobileSearchForm.setSearchQuery(e.target.value)}
                      onFocus={mobileSearchForm.handleSearchFocus}
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

                  <SearchSuggestions
                    query={mobileSearchForm.searchQuery}
                    onSuggestionClick={mobileSearchForm.handleSuggestionClick}
                    onClose={() => mobileSearchForm.setShowSuggestions(false)}
                    isVisible={mobileSearchForm.showSuggestions}
                  />
                </div>
              )}

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
