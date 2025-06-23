
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
  const [isEnabled, setIsEnabled] = useState(false); // Start with false to avoid race conditions
  const [status, setStatus] = useState<'loading' | 'active' | 'error' | 'disabled'>('disabled');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load settings from localStorage with proper default
    const savedEnabled = localStorage.getItem('vlibras-enabled');
    const shouldEnable = savedEnabled ? JSON.parse(savedEnabled) : true; // Default to true if not set
    console.log('VLibras Widget - Loading from localStorage:', shouldEnable);
    setIsEnabled(shouldEnable);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedEnabled = localStorage.getItem('vlibras-enabled');
      if (savedEnabled !== null) {
        const newEnabled = JSON.parse(savedEnabled);
        console.log('VLibras Widget - Storage change detected:', newEnabled);
        setIsEnabled(newEnabled);
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
      setIsInitialized(false);
      return;
    }

    // Only initialize if enabled and not already initialized
    if (!isInitialized) {
      initializeVLibras();
    }
  }, [isEnabled, isInitialized]);

  const cleanup = () => {
    console.log('VLibras Widget - Cleaning up');
    
    // Remove VLibras elements with more specific selectors
    const vwElements = document.querySelectorAll('[vw], [vw-access-button], [vw-plugin-wrapper], .vpw-access-button, .vw-plugin-wrapper');
    console.log('VLibras Widget - Found elements to remove:', vwElements.length);
    vwElements.forEach(el => {
      console.log('VLibras Widget - Removing element:', el.className);
      el.remove();
    });
    
    // Remove script
    const script = document.querySelector('script[src*="vlibras-plugin.js"]');
    if (script) {
      console.log('VLibras Widget - Removing script');
      script.remove();
    }
    
    // Clear window reference
    if (window.VLibras) {
      console.log('VLibras Widget - Clearing window.VLibras');
      delete window.VLibras;
    }
  };

  const initializeVLibras = () => {
    console.log('VLibras Widget - Starting initialization');
    setStatus('loading');

    // Clean up any existing instances first
    cleanup();

    // Wait a bit for DOM to be ready
    setTimeout(() => {
      try {
        console.log('VLibras Widget - Creating DOM structure');
        
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
        
        // Make sure it's visible
        vwDiv.style.position = 'fixed';
        vwDiv.style.zIndex = '9999';
        vwDiv.style.pointerEvents = 'auto';
        
        document.body.appendChild(vwDiv);

        console.log('VLibras Widget - DOM structure created, elements:', {
          vwDiv: vwDiv.className,
          accessButton: accessButton.className,
          pluginWrapper: pluginWrapper.className
        });

        // Load the script
        const script = document.createElement('script');
        script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
        
        script.onload = () => {
          console.log('VLibras Widget - Script loaded successfully');
          
          // Wait a bit more before initializing the widget
          setTimeout(() => {
            if (window.VLibras && window.VLibras.Widget) {
              try {
                console.log('VLibras Widget - Creating widget instance');
                new window.VLibras.Widget('https://vlibras.gov.br/app');
                setStatus('active');
                setIsInitialized(true);
                console.log('VLibras Widget - Successfully initialized');
                
                // Add debugging info about rendered elements
                setTimeout(() => {
                  const renderedElements = document.querySelectorAll('[vw], [vw-access-button], [vw-plugin-wrapper], .vpw-access-button, .vw-plugin-wrapper');
                  console.log('VLibras Widget - Elements after initialization:', renderedElements.length);
                  renderedElements.forEach((el, index) => {
                    console.log(`Element ${index}:`, {
                      tagName: el.tagName,
                      className: el.className,
                      id: el.id,
                      style: el.getAttribute('style'),
                      visible: window.getComputedStyle(el).display !== 'none'
                    });
                  });
                }, 1000);
                
              } catch (error) {
                console.error('VLibras Widget - Initialization error:', error);
                setStatus('error');
              }
            } else {
              console.warn('VLibras Widget - VLibras not available on window, available:', Object.keys(window.VLibras || {}));
              setStatus('error');
            }
          }, 1000); // Increased wait time
        };
        
        script.onerror = (error) => {
          console.error('VLibras Widget - Failed to load script:', error);
          setStatus('error');
        };
        
        document.head.appendChild(script);
        
      } catch (error) {
        console.error('VLibras Widget - Setup error:', error);
        setStatus('error');
      }
    }, 200); // Increased initial wait time
  };

  // Show status indicator when enabled
  if (!isEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-30 pointer-events-none">
      <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border border-blue-200">
        <Accessibility className="h-4 w-4 text-blue-600" />
        <span className="text-xs text-gray-700 font-medium">
          {status === 'loading' && 'Carregando VLibras...'}
          {status === 'active' && 'VLibras Ativo'}
          {status === 'error' && 'VLibras com erro'}
        </span>
        <div className={`w-2 h-2 rounded-full ${
          status === 'loading' ? 'bg-yellow-500 animate-pulse' :
          status === 'active' ? 'bg-green-500' : 'bg-red-500'
        }`} />
      </div>
    </div>
  );
};

export default VLibrasWidget;
