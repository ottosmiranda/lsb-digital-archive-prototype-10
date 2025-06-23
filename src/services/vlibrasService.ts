
import { VLibrasConfig, VLibrasWidget } from '@/types/vlibrasTypes';

class VLibrasService {
  private widget: VLibrasWidget | null = null;
  private isScriptLoaded = false;
  private readonly VLIBRAS_SCRIPT_URL = 'https://vlibras.gov.br/app/vlibras-plugin.js';
  private readonly VLIBRAS_CONFIG_URL = 'https://vlibras.gov.br/app/vlibras-plugin-config.json';

  async loadScript(): Promise<void> {
    if (this.isScriptLoaded) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = this.VLIBRAS_SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load VLibras script'));
      document.head.appendChild(script);
    });
  }

  async initializeWidget(config: VLibrasConfig): Promise<void> {
    await this.loadScript();
    
    if (!window.VLibras) {
      throw new Error('VLibras library not loaded');
    }

    const vlibrasConfig = {
      vw: config.width,
      vh: config.height,
      avatar: config.avatar,
      opacity: config.opacity,
      position: config.position
    };

    this.widget = new window.VLibras.Widget(vlibrasConfig);
  }

  showWidget(): void {
    if (this.widget) {
      this.widget.show();
    }
  }

  hideWidget(): void {
    if (this.widget) {
      this.widget.hide();
    }
  }

  destroyWidget(): void {
    if (this.widget) {
      this.widget.destroy();
      this.widget = null;
    }
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
    localStorage.setItem('vlibras_config', JSON.stringify(config));
  }

  loadConfig(): VLibrasConfig {
    const saved = localStorage.getItem('vlibras_config');
    return saved ? { ...this.getDefaultConfig(), ...JSON.parse(saved) } : this.getDefaultConfig();
  }
}

export const vlibrasService = new VLibrasService();
