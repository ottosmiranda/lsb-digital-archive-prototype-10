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
      return;
    }

    // Initialize VLibras using the official method
    initializeVLibras();
  }, [isEnabled]);

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
    console.log('VLibras Widget - Starting simplified initialization');

    // Clean up any existing instances first
    cleanup();

    // Wait for DOM to be ready
    setTimeout(() => {
      try {
        console.log('VLibras Widget - Creating standard VLibras container');
        
        // Create the simple container that VLibras expects (official pattern)
        const vwDiv = document.createElement('div');
        vwDiv.setAttribute('vw', '');
        vwDiv.className = 'enabled';
        
        // Add to body and let VLibras handle the rest
        document.body.appendChild(vwDiv);
        console.log('VLibras Widget - Standard container created');

        // Load the official VLibras script
        const script = document.createElement('script');
        script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
        
        script.onload = () => {
          console.log('VLibras Widget - Script loaded, initializing widget');
          
          setTimeout(() => {
            if (window.VLibras && window.VLibras.Widget) {
              try {
                console.log('VLibras Widget - Creating official widget instance');
                new window.VLibras.Widget('https://vlibras.gov.br/app');
                
                // After widget creation, position it in the middle-right
                setTimeout(() => {
                  positionVLibrasWidget();
                }, 1000);
                
              } catch (error) {
                console.error('VLibras Widget - Initialization error:', error);
              }
            } else {
              console.warn('VLibras Widget - VLibras not available on window');
            }
          }, 500);
        };
        
        script.onerror = (error) => {
          console.error('VLibras Widget - Failed to load script:', error);
        };
        
        document.head.appendChild(script);
        
      } catch (error) {
        console.error('VLibras Widget - Setup error:', error);
      }
    }, 100);
  };

  const positionVLibrasWidget = () => {
    console.log('VLibras Widget - Attempting to position widget in middle-right');
    
    // Find the VLibras container and reposition it
    const vwContainer = document.querySelector('[vw]');
    if (vwContainer) {
      const container = vwContainer as HTMLElement;
      container.style.position = 'fixed';
      container.style.right = '20px';
      container.style.top = '50%';
      container.style.transform = 'translateY(-50%)';
      container.style.zIndex = '9998';
      container.style.pointerEvents = 'auto';
      
      console.log('VLibras Widget - Successfully positioned in middle-right');
      
      // Debug: Check if widget is visible
      setTimeout(() => {
        const accessButton = document.querySelector('[vw-access-button]');
        if (accessButton) {
          const button = accessButton as HTMLElement;
          console.log('VLibras Widget - Access button found, visibility:', button.style.display !== 'none' ? 'visible' : 'hidden');
          console.log('VLibras Widget - Button dimensions:', button.offsetWidth, 'x', button.offsetHeight);
        } else {
          console.warn('VLibras Widget - Access button not found after positioning');
        }
      }, 500);
    } else {
      console.warn('VLibras Widget - VLibras container not found for positioning');
    }
  };

  // Add CSS to ensure proper styling
  useEffect(() => {
    if (isEnabled) {
      const style = document.createElement('style');
      style.textContent = `
        [vw] {
          position: fixed !important;
          right: 20px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          z-index: 9998 !important;
          pointer-events: auto !important;
        }
        
        [vw-access-button] {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
      `;
      style.id = 'vlibras-custom-positioning';
      document.head.appendChild(style);
      
      return () => {
        const existingStyle = document.getElementById('vlibras-custom-positioning');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [isEnabled]);

  return null;
};

export default VLibrasWidget;
