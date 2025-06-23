
export interface VLibrasConfig {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  avatar: string;
  opacity: number;
  width: number;
  height: number;
}

export interface VLibrasState {
  isLoading: boolean;
  isLoaded: boolean;
  isEnabled: boolean;
  config: VLibrasConfig;
  error: string | null;
}

export interface VLibrasContextType {
  state: VLibrasState;
  actions: {
    enable: () => void;
    disable: () => void;
    updateConfig: (config: Partial<VLibrasConfig>) => void;
    loadWidget: () => Promise<void>;
  };
}

declare global {
  interface Window {
    VLibras?: any;
  }
}
