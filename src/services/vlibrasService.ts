
// VLibras Service - Single Responsibility: Handle all VLibras operations
class VLibrasService {
  private isInitialized = false;
  private isEnabled = false;

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    const savedEnabled = localStorage.getItem('vlibras-enabled');
    this.isEnabled = savedEnabled ? JSON.parse(savedEnabled) : true;
    
    if (savedEnabled === null) {
      localStorage.setItem('vlibras-enabled', JSON.stringify(true));
    }
  }

  isVLibrasEnabled(): boolean {
    return this.isEnabled;
  }

  setEnabled(enabled: boolean): void {
    console.log('VLibras Service - Setting enabled:', enabled);
    this.isEnabled = enabled;
    localStorage.setItem('vlibras-enabled', JSON.stringify(enabled));
    
    if (enabled) {
      this.initialize();
    } else {
      this.cleanup();
    }
  }

  private cleanup(): void {
    console.log('VLibras Service - Cleaning up');
    
    // Remove VLibras elements with more comprehensive selectors
    const selectors = [
      '[vw]', 
      '[vw-access-button]', 
      '[vw-plugin-wrapper]', 
      '.vpw-access-button', 
      '.vw-plugin-wrapper',
      '.enabled[vw]'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      console.log(`VLibras Service - Found ${elements.length} elements for selector: ${selector}`);
      elements.forEach(el => el.remove());
    });
    
    // Remove script if exists
    const script = document.querySelector('script[src*="vlibras-plugin.js"]');
    if (script) {
      console.log('VLibras Service - Removing script');
      script.remove();
    }
    
    // Clear global reference
    if (window.VLibras) {
      console.log('VLibras Service - Clearing window.VLibras');
      delete window.VLibras;
    }
    
    this.isInitialized = false;
  }

  private initialize(): void {
    if (this.isInitialized) {
      console.log('VLibras Service - Already initialized');
      return;
    }

    console.log('VLibras Service - Starting initialization');
    this.cleanup(); // Ensure clean state

    // Wait for DOM to be ready
    setTimeout(() => {
      // Create simple VLibras container (official pattern)
      const container = document.createElement('div');
      container.setAttribute('vw', '');
      container.className = 'enabled';
      document.body.appendChild(container);
      console.log('VLibras Service - Container created');

      // Load official script
      this.loadScript();
    }, 100);
  }

  private loadScript(): void {
    const script = document.createElement('script');
    script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    
    script.onload = () => {
      console.log('VLibras Service - Script loaded');
      this.initializeWidget();
    };
    
    script.onerror = (error) => {
      console.error('VLibras Service - Script load error:', error);
    };
    
    document.head.appendChild(script);
  }

  private initializeWidget(): void {
    // Wait for VLibras to be available
    setTimeout(() => {
      if (window.VLibras && window.VLibras.Widget) {
        try {
          console.log('VLibras Service - Creating widget');
          new window.VLibras.Widget('https://vlibras.gov.br/app');
          this.isInitialized = true;
          console.log('VLibras Service - Widget created successfully');
          
          // Apply positioning after widget is created
          this.applyPositioning();
        } catch (error) {
          console.error('VLibras Service - Widget creation error:', error);
        }
      } else {
        console.warn('VLibras Service - VLibras not available');
      }
    }, 1000);
  }

  private applyPositioning(): void {
    // Wait for VLibras to create its DOM elements
    setTimeout(() => {
      console.log('VLibras Service - Applying positioning');
      
      // Find VLibras container and access button
      const container = document.querySelector('[vw]') as HTMLElement;
      const accessButton = document.querySelector('[vw-access-button]') as HTMLElement;
      
      if (container) {
        console.log('VLibras Service - Container found, applying positioning');
        container.style.cssText = `
          position: fixed !important;
          right: 20px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          z-index: 9998 !important;
          pointer-events: auto !important;
        `;
      }
      
      if (accessButton) {
        console.log('VLibras Service - Access button found and positioned');
        accessButton.style.cssText = `
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        `;
      } else {
        console.warn('VLibras Service - Access button not found, checking again...');
        // Try again after a longer delay
        setTimeout(() => {
          const button = document.querySelector('[vw-access-button]') as HTMLElement;
          if (button) {
            console.log('VLibras Service - Access button found on retry');
            button.style.cssText = `
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
            `;
          } else {
            console.error('VLibras Service - Access button still not found after retry');
          }
        }, 2000);
      }
    }, 1500);
  }

  init(): void {
    if (this.isEnabled) {
      this.initialize();
    }
  }
}

// Single instance (SSOT)
export const vlibrasService = new VLibrasService();

// Global declaration for TypeScript
declare global {
  interface Window {
    VLibras: {
      Widget: new (url: string) => void;
    };
  }
}
