
import { VLibrasConfig, VLibrasWidget } from '@/types/vlibrasTypes';

class VLibrasService {
  private widget: VLibrasWidget | null = null;
  private isScriptLoaded = false;
  private readonly VLIBRAS_SCRIPT_URL = 'https://vlibras.gov.br/app/vlibras-plugin.js';
  private readonly SCRIPT_TIMEOUT = 10000; // 10 seconds timeout

  async loadScript(): Promise<void> {
    if (this.isScriptLoaded && window.VLibras) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = this.VLIBRAS_SCRIPT_URL;
      script.async = true;
      
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao carregar script do VLibras'));
      }, this.SCRIPT_TIMEOUT);

      script.onload = () => {
        clearTimeout(timeout);
        this.isScriptLoaded = true;
        
        // Wait a bit for VLibras to initialize
        setTimeout(() => {
          if (window.VLibras) {
            resolve();
          } else {
            reject(new Error('VLibras não foi inicializado corretamente'));
          }
        }, 500);
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
      
      if (!window.VLibras) {
        throw new Error('VLibras não está disponível');
      }

      const vlibrasConfig = {
        vw: config.width,
        vh: config.height,
        avatar: config.avatar,
        opacity: config.opacity,
        position: config.position
      };

      this.widget = new window.VLibras.Widget(vlibrasConfig);
      
      if (!this.widget) {
        throw new Error('Falha ao criar widget do VLibras');
      }
    } catch (error) {
      this.widget = null;
      throw error;
    }
  }

  showWidget(): void {
    if (!this.widget) {
      throw new Error('Widget não foi inicializado');
    }
    this.widget.show();
  }

  hideWidget(): void {
    if (!this.widget) {
      console.warn('Widget não foi inicializado para ocultar');
      return;
    }
    this.widget.hide();
  }

  destroyWidget(): void {
    if (this.widget) {
      try {
        this.widget.destroy();
      } catch (error) {
        console.warn('Erro ao destruir widget:', error);
      }
      this.widget = null;
    }
  }

  isWidgetReady(): boolean {
    return this.widget !== null && this.isScriptLoaded && !!window.VLibras;
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
