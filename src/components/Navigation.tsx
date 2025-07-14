
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ExternalLink } from "lucide-react";
import CompactSearchBar from "@/components/CompactSearchBar";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Check if we're on the home page
  const isHomePage = location.pathname === "/";
  const navItems = [
    {
      path: "/sobre",
      label: "Sobre nós"
    },
    {
      path: "/regulamento",
      label: "Regulamento"
    },
    {
      path: "/equipe",
      label: "Equipe"
    },
    {
      path: "https://lsb.edu.br/en/",
      label: "Portal Link",
      external: true
    }
  ];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="lsb-container">
        <div className="lsb-content">
          <div className="flex justify-between items-center h-14 md:h-16 px-4 md:px-0">
            {/* Logo - Responsive sizing */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img 
                  alt="Biblioteca Digital & Link" 
                  className="h-7 md:h-9 w-auto" 
                  src="/lovable-uploads/72ecc68a-ee89-4b03-a37b-1d2c8813f321.png" 
                />
              </Link>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden lg:flex items-center justify-end flex-1 min-w-0">
              {/* Navigation Links Container */}
              <div className="flex items-center space-x-2 xl:space-x-3 flex-shrink-0">
                {navItems.map((item) => (
                  item.external ? (
                    <a
                      key={item.path}
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors whitespace-nowrap"
                    >
                      {item.label}
                      <ExternalLink className="ml-1 h-3 w-3 flex-shrink-0" />
                    </a>
                  ) : (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center px-2 py-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive(item.path)
                          ? "border-lsb-primary text-lsb-primary"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                ))}
              </div>

              {/* Compact Search Bar - Desktop only */}
              {!isHomePage && (
                <div className="ml-4 flex-shrink-0">
                  <CompactSearchBar />
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Menu principal"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu - Improved styling and transitions */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              item.external ? (
                <a
                  key={item.path}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-3 py-3 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors rounded-r-md"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-3 border-l-4 text-base font-medium transition-colors rounded-r-md ${
                    isActive(item.path)
                      ? "bg-lsb-section border-lsb-primary text-lsb-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              )
            ))}
            
            {/* Mobile Search Bar - Only show on internal pages */}
            {!isHomePage && (
              <div className="px-3 py-3 border-t border-gray-200 mt-2">
                <CompactSearchBar />
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
