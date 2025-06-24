
import { VLibrasConfig } from '@/types/vlibrasTypes';

class VLibrasService {
  private isScriptLoaded = false;
  private widgetElement: HTMLElement | null = null;
  private readonly VLIBRAS_SCRIPT_URL = 'https://vlibras.gov.br/app/vlibras-plugin.js';
  private readonly SCRIPT_TIMEOUT = 10000;

  async loadScript(): Promise<void> {
    if (this.isScriptLoaded) {
      console.log('VLibras: Script already loaded');
      return;
    }

    console.log('VLibras: Loading script from', this.VLIBRAS_SCRIPT_URL);

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${this.VLIBRAS_SCRIPT_URL}"]`);
      if (existingScript) {
        console.log('VLibras: Script element already exists in DOM');
        this.isScriptLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = this.VLIBRAS_SCRIPT_URL;
      script.async = true;
      
      const timeout = setTimeout(() => {
        console.error('VLibras: Script loading timeout');
        reject(new Error('Timeout ao carregar script do VLibras'));
      }, this.SCRIPT_TIMEOUT);

      script.onload = () => {
        console.log('VLibras: Script loaded successfully');
        clearTimeout(timeout);
        this.isScriptLoaded = true;
        
        // Wait a bit for the script to be ready
        setTimeout(() => {
          resolve();
        }, 500);
      };

      script.onerror = () => {
        console.error('VLibras: Script loading failed');
        clearTimeout(timeout);
        reject(new Error('Falha ao carregar script do VLibras'));
      };

      document.head.appendChild(script);
    });
  }

  async initializeWidget(config: VLibrasConfig): Promise<void> {
    try {
      console.log('VLibras: Initializing widget with config:', config);
      await this.loadScript();
      this.createWidgetElement(config);
      
      // Initialize VLibras after DOM is ready
      setTimeout(() => {
        this.initializeVLibrasScript();
      }, 100);
      
      console.log('VLibras: Widget initialization complete');
    } catch (error) {
      console.error('VLibras: Widget initialization failed:', error);
      throw error;
    }
  }

  private createWidgetElement(config: VLibrasConfig): void {
    console.log('VLibras: Creating widget element');
    
    // Remove existing widget
    this.destroyWidget();

    // Create simple VLibras container - let VLibras handle the rest
    const widget = document.createElement('div');
    widget.setAttribute('vw', '');
    widget.className = 'enabled';
    
    // Apply position class for CSS targeting
    widget.classList.add(`vlibras-${config.position}`);
    
    // Add to DOM
    document.body.appendChild(widget);
    this.widgetElement = widget;
    
    console.log('VLibras: Simple widget container created and added to DOM');
  }

  private initializeVLibrasScript(): void {
    if (window.VLibras && typeof window.VLibras.Widget === 'function') {
      try {
        console.log('VLibras: Initializing VLibras.Widget');
        new window.VLibras.Widget('https://vlibras.gov.br/app');
        console.log('VLibras: VLibras.Widget initialized successfully');
      } catch (error) {
        console.warn('VLibras: VLibras.Widget initialization error:', error);
      }
    } else {
      console.warn('VLibras: window.VLibras.Widget not available, retrying...');
      // Retry after a short delay
      setTimeout(() => {
        this.initializeVLibrasScript();
      }, 1000);
    }
  }

  showWidget(): void {
    if (this.widgetElement) {
      console.log('VLibras: Showing widget');
      this.widgetElement.style.display = 'block';
      this.widgetElement.style.visibility = 'visible';
      this.widgetElement.classList.remove('vlibras-hidden');
    } else {
      console.warn('VLibras: Cannot show widget - element not found');
    }
  }

  hideWidget(): void {
    if (this.widgetElement) {
      console.log('VLibras: Hiding widget');
      this.widgetElement.style.display = 'none';
      this.widgetElement.classList.add('vlibras-hidden');
    } else {
      console.warn('VLibras: Cannot hide widget - element not found');
    }
  }

  destroyWidget(): void {
    if (this.widgetElement) {
      console.log('VLibras: Destroying widget');
      this.widgetElement.remove();
      this.widgetElement = null;
    }
  }

  isWidgetReady(): boolean {
    return this.isScriptLoaded && this.widgetElement !== null;
  }

  getDefaultConfig(): VLibrasConfig {
    return {
      enabled: false,
      position: 'bottom-right',
      avatar: 'icaro',
      opacity: 1,
      width: 220,
      height: 280
    };
  }

  saveConfig(config: VLibrasConfig): void {
    try {
      localStorage.setItem('vlibras_config', JSON.stringify(config));
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  }

  loadConfig(): VLibrasConfig {
    try {
      const saved = localStorage.getItem('vlibras_config');
      return saved ? { ...this.getDefaultConfig(), ...JSON.parse(saved) } : this.getDefaultConfig();
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      return this.getDefaultConfig();
    }
  }
}

export const vlibrasService = new VLibrasService();
