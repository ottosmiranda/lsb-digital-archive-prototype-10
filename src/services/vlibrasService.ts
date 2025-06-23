
import { VLibrasConfig } from '@/types/vlibrasTypes';

class VLibrasService {
  private isScriptLoaded = false;
  private widgetElement: HTMLElement | null = null;
  private readonly VLIBRAS_SCRIPT_URL = 'https://vlibras.gov.br/app/vlibras-plugin.js';
  private readonly SCRIPT_TIMEOUT = 10000;

  async loadScript(): Promise<void> {
    if (this.isScriptLoaded) return;

    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector(`script[src="${this.VLIBRAS_SCRIPT_URL}"]`);
      if (existingScript) {
        this.isScriptLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = this.VLIBRAS_SCRIPT_URL;
      script.async = true;
      
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao carregar script do VLibras'));
      }, this.SCRIPT_TIMEOUT);

      script.onload = () => {
        clearTimeout(timeout);
        this.isScriptLoaded = true;
        resolve();
      };

      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Falha ao carregar script do VLibras'));
      };

      document.head.appendChild(script);
    });
  }

  async initializeWidget(config: VLibrasConfig): Promise<void> {
    try {
      await this.loadScript();
      this.createWidgetElement(config);
    } catch (error) {
      throw error;
    }
  }

  private createWidgetElement(config: VLibrasConfig): void {
    // Remove existing widget
    this.destroyWidget();

    // Create VLibras widget container
    const widget = document.createElement('div');
    widget.setAttribute('vw', '');
    widget.className = 'enabled';
    
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
    
    // Apply configuration
    this.applyWidgetConfiguration(widget, config);
    
    // Add to DOM
    document.body.appendChild(widget);
    this.widgetElement = widget;
    
    // Initialize VLibras if available
    if (window.VLibras && typeof window.VLibras.Widget === 'function') {
      try {
        new window.VLibras.Widget('https://vlibras.gov.br/app');
      } catch (error) {
        console.warn('VLibras initialization warning:', error);
      }
    }
  }

  private applyWidgetConfiguration(element: HTMLElement, config: VLibrasConfig): void {
    // Apply position styles
    element.style.position = 'fixed';
    element.style.zIndex = '999999';
    
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
  }

  showWidget(): void {
    if (this.widgetElement) {
      this.widgetElement.style.display = 'block';
    }
  }

  hideWidget(): void {
    if (this.widgetElement) {
      this.widgetElement.style.display = 'none';
    }
  }

  destroyWidget(): void {
    if (this.widgetElement) {
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
