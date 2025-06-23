
import { useEffect, useState } from 'react';
import { Accessibility } from 'lucide-react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    VLibras: {
      Widget: new (url: string) => void;
    };
  }
}

const VLibrasWidget = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if VLibras is already loaded
    if (window.VLibras) {
      setIsLoaded(true);
      return;
    }

    // Listen for VLibras script load
    const checkVLibras = () => {
      if (window.VLibras) {
        setIsLoaded(true);
      } else {
        setTimeout(checkVLibras, 100);
      }
    };

    checkVLibras();
  }, []);

  const toggleWidget = () => {
    const vwElement = document.querySelector('[vw]') as HTMLElement;
    if (vwElement) {
      if (isVisible) {
        vwElement.style.display = 'none';
      } else {
        vwElement.style.display = 'block';
      }
      setIsVisible(!isVisible);
    }
  };

  // Custom button for better integration with LSB design
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        onClick={toggleWidget}
        className="w-12 h-12 rounded-full bg-lsb-primary hover:bg-lsb-primary/90 text-white shadow-lg hover-lift"
        size="sm"
        title={isVisible ? 'Ocultar VLibras' : 'Mostrar VLibras'}
        aria-label={isVisible ? 'Ocultar widget de acessibilidade VLibras' : 'Mostrar widget de acessibilidade VLibras'}
      >
        <Accessibility className="h-5 w-5" />
      </Button>
      
      {/* Status indicator */}
      {isLoaded && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" 
             title="VLibras carregado" />
      )}
    </div>
  );
};

export default VLibrasWidget;
