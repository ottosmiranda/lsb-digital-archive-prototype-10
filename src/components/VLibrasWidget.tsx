
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    VLibras: {
      Widget: new (url: string) => void;
    };
  }
}

const VLibrasWidget = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load settings from localStorage with proper default
    const savedEnabled = localStorage.getItem('vlibras-enabled');
    const shouldEnable = savedEnabled ? JSON.parse(savedEnabled) : true;
    console.log('VLibras Widget - Loading from localStorage:', shouldEnable);
    setIsEnabled(shouldEnable);

    // If no setting exists, save the default
    if (savedEnabled === null) {
      localStorage.setItem('vlibras-enabled', JSON.stringify(true));
    }
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
    
    // Remove VLibras elements
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
        
        // Position the VLibras button in the middle-right of the page
        vwDiv.style.position = 'fixed';
        vwDiv.style.right = '20px';
        vwDiv.style.top = '50%';
        vwDiv.style.transform = 'translateY(-50%)';
        vwDiv.style.zIndex = '9998'; // Lower than footer button to avoid conflicts
        vwDiv.style.pointerEvents = 'auto';
        
        document.body.appendChild(vwDiv);

        console.log('VLibras Widget - DOM structure created and positioned in middle-right');

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
                setIsInitialized(true);
                console.log('VLibras Widget - Successfully initialized in middle-right position');
                
              } catch (error) {
                console.error('VLibras Widget - Initialization error:', error);
              }
            } else {
              console.warn('VLibras Widget - VLibras not available on window');
            }
          }, 1000);
        };
        
        script.onerror = (error) => {
          console.error('VLibras Widget - Failed to load script:', error);
        };
        
        document.head.appendChild(script);
        
      } catch (error) {
        console.error('VLibras Widget - Setup error:', error);
      }
    }, 200);
  };

  // Return null - no custom status indicator needed
  return null;
};

export default VLibrasWidget;
