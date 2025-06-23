
import { useEffect, useState } from 'react';
import { Accessibility } from 'lucide-react';

declare global {
  interface Window {
    VLibras: {
      Widget: new (url: string) => void;
    };
  }
}

const VLibrasWidget = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedEnabled = localStorage.getItem('vlibras-enabled');
    if (savedEnabled !== null) {
      setIsEnabled(JSON.parse(savedEnabled));
    }
  }, []);

  useEffect(() => {
    const loadVLibras = () => {
      if (!isEnabled) {
        // Remove VLibras if disabled
        removeVLibras();
        return;
      }

      // Check if already loaded
      if (window.VLibras) {
        setIsLoaded(true);
        setHasError(false);
        return;
      }

      try {
        // Create the VLibras widget container
        if (!document.querySelector('[vw]')) {
          const vwDiv = document.createElement('div');
          vwDiv.setAttribute('vw', '');
          vwDiv.className = 'enabled';
          
          const accessButton = document.createElement('div');
          accessButton.setAttribute('vw-access-button', '');
          accessButton.className = 'active';
          
          const pluginWrapper = document.createElement('div');
          pluginWrapper.setAttribute('vw-plugin-wrapper', '');
          
          const topWrapper = document.createElement('div');
          topWrapper.className = 'vw-plugin-top-wrapper';
          
          pluginWrapper.appendChild(topWrapper);
          vwDiv.appendChild(accessButton);
          vwDiv.appendChild(pluginWrapper);
          document.body.appendChild(vwDiv);
        }

        // Load VLibras script if not already loaded
        if (!document.querySelector('script[src*="vlibras-plugin.js"]')) {
          const script = document.createElement('script');
          script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
          script.onload = () => {
            setTimeout(() => {
              if (window.VLibras) {
                try {
                  new window.VLibras.Widget('https://vlibras.gov.br/app');
                  setIsLoaded(true);
                  setHasError(false);
                } catch (error) {
                  console.warn('VLibras widget initialization error:', error);
                  setHasError(true);
                }
              }
            }, 100);
          };
          script.onerror = () => {
            console.warn('Failed to load VLibras script');
            setHasError(true);
          };
          document.head.appendChild(script);
        }
      } catch (error) {
        console.warn('VLibras setup error:', error);
        setHasError(true);
      }
    };

    const removeVLibras = () => {
      // Remove VLibras elements
      const vwElement = document.querySelector('[vw]');
      if (vwElement) {
        vwElement.remove();
      }
      
      // Remove script
      const script = document.querySelector('script[src*="vlibras-plugin.js"]');
      if (script) {
        script.remove();
      }
      
      setIsLoaded(false);
      setHasError(false);
    };

    loadVLibras();

    // Cleanup on unmount
    return () => {
      if (!isEnabled) {
        removeVLibras();
      }
    };
  }, [isEnabled]);

  // Listen for settings changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedEnabled = localStorage.getItem('vlibras-enabled');
      if (savedEnabled !== null) {
        setIsEnabled(JSON.parse(savedEnabled));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Only show status when enabled and loaded
  if (!isEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 z-40 pointer-events-none">
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border">
        <Accessibility className="h-4 w-4 text-lsb-primary" />
        <span className="text-xs text-gray-700 font-medium">
          {hasError ? 'VLibras com erro' : isLoaded ? 'VLibras Ativo' : 'Carregando VLibras...'}
        </span>
        <div className={`w-2 h-2 rounded-full ${
          hasError ? 'bg-red-500' : isLoaded ? 'bg-green-500' : 'bg-yellow-500'
        }`} />
      </div>
    </div>
  );
};

export default VLibrasWidget;
