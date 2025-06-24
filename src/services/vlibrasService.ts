
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
      // Check if script already exists
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
        resolve();
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

    // Create VLibras widget container
    const widget = document.createElement('div');
    widget.setAttribute('vw', '');
    widget.className = 'enabled vlibras-widget';
    
    // Create the accessibility plugin div
    const accessibilityDiv = document.createElement('div');
    accessibilityDiv.setAttribute('vw-access-button', '');
    accessibilityDiv.className = 'active';
    
    // Create the plugin wrapper
    const pluginWrapper = document.createElement('div');
    pluginWrapper.setAttribute('vw-plugin-wrapper', '');
    
    // Create the plugin top div
    const pluginTop = document.createElement('div');
    pluginTop.className = 'vw-plugin-top-wrapper';
    
    pluginWrapper.appendChild(pluginTop);
    widget.appendChild(accessibilityDiv);
    widget.appendChild(pluginWrapper);
    
    // Apply configuration and debugging styles
    this.applyWidgetConfiguration(widget, config);
    
    // Add to DOM
    document.body.appendChild(widget);
    this.widgetElement = widget;
    
    console.log('VLibras: Widget element created and added to DOM');
    console.log('VLibras: Widget element styles:', widget.style.cssText);
    console.log('VLibras: Widget element classes:', widget.className);
    
    // Initialize VLibras if available
    if (window.VLibras && typeof window.VLibras.Widget === 'function') {
      try {
        console.log('VLibras: Initializing VLibras.Widget');
        new window.VLibras.Widget('https://vlibras.gov.br/app');
        console.log('VLibras: VLibras.Widget initialized successfully');
      } catch (error) {
        console.warn('VLibras: VLibras.Widget initialization warning:', error);
      }
    } else {
      console.warn('VLibras: window.VLibras.Widget not available');
    }
  }

  private applyWidgetConfiguration(element: HTMLElement, config: VLibrasConfig): void {
    console.log('VLibras: Applying widget configuration:', config);
    
    // Apply position styles with maximum z-index and debugging
    element.style.position = 'fixed';
    element.style.zIndex = '2147483647'; // Maximum z-index
    element.style.pointerEvents = 'auto';
    element.style.visibility = 'visible';
    element.style.display = 'block';
    
    // Add position class for CSS targeting
    element.classList.add(config.position);
    
    switch (config.position) {
      case 'top-left':
        element.style.top = '20px';
        element.style.left = '20px';
        break;
      case 'top-right':
        element.style.top = '20px';
        element.style.right = '20px';
        break;
      case 'bottom-left':
        element.style.bottom = '20px';
        element.style.left = '20px';
        break;
      case 'bottom-right':
      default:
        element.style.bottom = '20px';
        element.style.right = '20px';
        break;
    }
    
    // Apply opacity
    element.style.opacity = config.opacity.toString();
    
    // Add debugging background (temporary)
    element.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
    element.style.border = '2px solid red';
    element.style.minWidth = '60px';
    element.style.minHeight = '60px';
    
    console.log('VLibras: Applied final styles:', element.style.cssText);
  }

  showWidget(): void {
    if (this.widgetElement) {
      console.log('VLibras: Showing widget');
      this.widgetElement.style.display = 'block';
      this.widgetElement.style.visibility = 'visible';
      this.widgetElement.classList.remove('vlibras-hidden');
      console.log('VLibras: Widget visibility after show:', this.widgetElement.style.cssText);
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
