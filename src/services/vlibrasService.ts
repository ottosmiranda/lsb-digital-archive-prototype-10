
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
    
    // Remove VLibras elements
    const elements = document.querySelectorAll('[vw]');
    elements.forEach(el => el.remove());
    
    // Remove script if exists
    const script = document.querySelector('script[src*="vlibras-plugin.js"]');
    if (script) {
      script.remove();
    }
    
    // Clear global reference
    if (window.VLibras) {
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

    // Create simple VLibras container (official pattern)
    const container = document.createElement('div');
    container.setAttribute('vw', '');
    container.className = 'enabled';
    document.body.appendChild(container);

    // Load official script
    this.loadScript();
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
        } catch (error) {
          console.error('VLibras Service - Widget creation error:', error);
        }
      } else {
        console.warn('VLibras Service - VLibras not available');
      }
    }, 1000);
  }

  init(): void {
    if (this.isEnabled) {
      this.initialize();
    }
  }
}

// Single instance (SSOT)
export const vlibrasService = new VLibrasService();
