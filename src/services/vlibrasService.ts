
import { VLibrasConfig } from '@/types/vlibrasTypes';

class VLibrasService {
  private readonly WIDGET_SELECTOR = '[vw]';

  private getWidgetElement(): HTMLElement | null {
    return document.querySelector(this.WIDGET_SELECTOR);
  }

  showWidget(): void {
    console.log('VLibras: Showing widget');
    const widget = this.getWidgetElement();
    if (widget) {
      widget.style.display = 'block';
      widget.style.visibility = 'visible';
      widget.classList.add('enabled');
      widget.classList.remove('vlibras-hidden');
    } else {
      console.warn('VLibras: Widget element not found');
    }
  }

  hideWidget(): void {
    console.log('VLibras: Hiding widget');
    const widget = this.getWidgetElement();
    if (widget) {
      widget.style.display = 'none';
      widget.classList.remove('enabled');
      widget.classList.add('vlibras-hidden');
    } else {
      console.warn('VLibras: Widget element not found');
    }
  }

  updatePosition(position: string): void {
    console.log('VLibras: Updating position to', position);
    const widget = this.getWidgetElement();
    if (widget) {
      // Remove existing position classes
      widget.classList.remove('vlibras-top-left', 'vlibras-top-right', 'vlibras-bottom-left', 'vlibras-bottom-right');
      // Add new position class
      widget.classList.add(`vlibras-${position}`);
    }
  }

  isWidgetReady(): boolean {
    return this.getWidgetElement() !== null;
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
