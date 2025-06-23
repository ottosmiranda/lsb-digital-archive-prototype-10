
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navigation from '@/components/Navigation';
import SearchWelcomeState from '@/components/SearchWelcomeState';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleQuickSearch = (searchQuery: string) => {
    // Redirect to homepage with search query
    window.location.href = `/?q=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 404 Header */}
        <div className="text-center mb-12">
          <div className="text-8xl font-bold text-lsb-primary mb-4 opacity-20">404</div>
          <h1 className="text-4xl font-bold text-lsb-primary mb-4">
            Oops! Página não encontrada
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A página que você está procurando não existe, mas temos muito conteúdo interessante para você explorar!
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/">
              <Button className="bg-lsb-primary hover:bg-lsb-primary/90 text-white">
                <Home className="h-4 w-4 mr-2" />
                Ir para Página Inicial
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="border-lsb-primary text-lsb-primary hover:bg-lsb-primary hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>

        {/* Helpful Content Discovery */}
        <div className="bg-lsb-section rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-lsb-primary mb-4 text-center">
            Que tal explorar nosso conteúdo?
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Mesmo que a página não tenha sido encontrada, você pode descobrir recursos incríveis em nossa biblioteca digital.
          </p>
        </div>

        {/* Search Welcome State with all exploration features */}
        <SearchWelcomeState onQuickSearch={handleQuickSearch} />
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;
