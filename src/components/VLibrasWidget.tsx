
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
  const [isEnabled, setIsEnabled] = useState(true);
  const [status, setStatus] = useState<'loading' | 'active' | 'error' | 'disabled'>('disabled');

  useEffect(() => {
    // Load settings from localStorage
    const savedEnabled = localStorage.getItem('vlibras-enabled');
    if (savedEnabled !== null) {
      setIsEnabled(JSON.parse(savedEnabled));
    }
  }, []);

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

  useEffect(() => {
    console.log('VLibras Widget - isEnabled changed:', isEnabled);
    
    if (!isEnabled) {
      cleanup();
      setStatus('disabled');
      return;
    }

    // Only initialize if enabled
    initializeVLibras();
  }, [isEnabled]);

  const cleanup = () => {
    console.log('VLibras Widget - Cleaning up');
    
    // Remove VLibras elements
    const vwElements = document.querySelectorAll('[vw], [vw-access-button], [vw-plugin-wrapper]');
    vwElements.forEach(el => el.remove());
    
    // Remove script
    const script = document.querySelector('script[src*="vlibras-plugin.js"]');
    if (script) {
      script.remove();
    }
    
    // Clear window reference
    if (window.VLibras) {
      delete window.VLibras;
    }
  };

  const initializeVLibras = () => {
    console.log('VLibras Widget - Initializing');
    setStatus('loading');

    // Clean up any existing instances first
    cleanup();

    // Wait a bit for DOM to be ready
    setTimeout(() => {
      try {
        // Create the basic structure that VLibras expects
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

        console.log('VLibras Widget - DOM structure created');

        // Load the script
        const script = document.createElement('script');
        script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
        
        script.onload = () => {
          console.log('VLibras Widget - Script loaded');
          
          // Wait a bit more before initializing the widget
          setTimeout(() => {
            if (window.VLibras) {
              try {
                console.log('VLibras Widget - Creating widget instance');
                new window.VLibras.Widget('https://vlibras.gov.br/app');
                setStatus('active');
                console.log('VLibras Widget - Successfully initialized');
              } catch (error) {
                console.warn('VLibras Widget - Initialization error:', error);
                setStatus('error');
              }
            } else {
              console.warn('VLibras Widget - VLibras not available on window');
              setStatus('error');
            }
          }, 500);
        };
        
        script.onerror = () => {
          console.warn('VLibras Widget - Failed to load script');
          setStatus('error');
        };
        
        document.head.appendChild(script);
        
      } catch (error) {
        console.warn('VLibras Widget - Setup error:', error);
        setStatus('error');
      }
    }, 100);
  };

  // Don't show anything when disabled
  if (!isEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 z-40 pointer-events-none">
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border">
        <Accessibility className="h-4 w-4 text-blue-600" />
        <span className="text-xs text-gray-700 font-medium">
          {status === 'loading' && 'Carregando VLibras...'}
          {status === 'active' && 'VLibras Ativo'}
          {status === 'error' && 'VLibras com erro'}
        </span>
        <div className={`w-2 h-2 rounded-full ${
          status === 'loading' ? 'bg-yellow-500' :
          status === 'active' ? 'bg-green-500' : 'bg-red-500'
        }`} />
      </div>
    </div>
  );
};

export default VLibrasWidget;
