
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { VLibrasContextType, VLibrasState, VLibrasConfig } from '@/types/vlibrasTypes';
import { vlibrasService } from '@/services/vlibrasService';
import { platformSettingsService } from '@/services/platformSettingsService';

type VLibrasAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADED'; payload: boolean }
  | { type: 'SET_ENABLED'; payload: boolean }
  | { type: 'SET_CONFIG'; payload: Partial<VLibrasConfig> }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'INITIALIZE'; payload: VLibrasConfig };

const initialState: VLibrasState = {
  isLoading: false,
  isLoaded: false,
  isEnabled: false,
  config: vlibrasService.getDefaultConfig(),
  error: null
};

function vlibrasReducer(state: VLibrasState, action: VLibrasAction): VLibrasState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_LOADED':
      return { ...state, isLoaded: action.payload, isLoading: false };
    case 'SET_ENABLED':
      return { ...state, isEnabled: action.payload };
    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'INITIALIZE':
      return { ...state, config: action.payload, isEnabled: action.payload.enabled };
    default:
      return state;
  }
}

const VLibrasContext = createContext<VLibrasContextType | undefined>(undefined);

export const VLibrasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(vlibrasReducer, initialState);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      console.log('VLibras: Loading configuration...');
      
      // Always try to load from platform settings first
      const { data, error } = await platformSettingsService.getVLibrasConfig();
      
      let config: VLibrasConfig;
      
      if (error || !data) {
        console.warn('VLibras: Error loading platform config, using default:', error);
        config = vlibrasService.getDefaultConfig();
      } else {
        config = data;
        console.log('VLibras: Loaded config from platform settings:', config);
      }
      
      dispatch({ type: 'INITIALIZE', payload: config });
      
      if (config.enabled) {
        console.log('VLibras: Config shows enabled, initializing widget...');
        await loadWidget(config);
      } else {
        console.log('VLibras: Config shows disabled, skipping widget initialization');
      }
    } catch (error) {
      console.error('VLibras: Error loading config:', error);
      const fallbackConfig = vlibrasService.getDefaultConfig();
      dispatch({ type: 'INITIALIZE', payload: fallbackConfig });
    }
  };

  const saveConfig = async (newConfig: VLibrasConfig) => {
    try {
      console.log('VLibras: Saving config:', newConfig);
      const { error } = await platformSettingsService.saveVLibrasConfig(newConfig);
      if (error) {
        console.error('VLibras: Error saving platform config:', error);
        throw error;
      }
      console.log('VLibras: Config saved successfully');
    } catch (error) {
      console.error('VLibras: Error saving config:', error);
      throw error;
    }
  };

  const loadWidget = async (configToUse?: VLibrasConfig) => {
    try {
      const config = configToUse || state.config;
      console.log('VLibras: Starting widget initialization with config:', config);
      
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      await vlibrasService.initializeWidget(config);
      console.log('VLibras: Widget initialized successfully');
      dispatch({ type: 'SET_LOADED', payload: true });
      
      if (config.enabled) {
        vlibrasService.showWidget();
        dispatch({ type: 'SET_ENABLED', payload: true });
        console.log('VLibras: Widget shown successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar o VLibras';
      console.error('VLibras: Widget load error:', error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  const enable = async () => {
    try {
      console.log('VLibras: Enabling widget...');
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      if (!state.isLoaded) {
        await vlibrasService.initializeWidget(state.config);
        dispatch({ type: 'SET_LOADED', payload: true });
      }
      
      vlibrasService.showWidget();
      dispatch({ type: 'SET_ENABLED', payload: true });
      
      const newConfig = { ...state.config, enabled: true };
      await saveConfig(newConfig);
      dispatch({ type: 'SET_CONFIG', payload: { enabled: true } });
      
      console.log('VLibras: Widget enabled successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao habilitar o VLibras';
      console.error('VLibras: Enable error:', error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  const disable = async () => {
    try {
      console.log('VLibras: Disabling widget...');
      vlibrasService.hideWidget();
      dispatch({ type: 'SET_ENABLED', payload: false });
      
      const newConfig = { ...state.config, enabled: false };
      await saveConfig(newConfig);
      dispatch({ type: 'SET_CONFIG', payload: { enabled: false } });
      
      console.log('VLibras: Widget disabled successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao desabilitar o VLibras';
      console.error('VLibras: Disable error:', error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  const updateConfig = async (configUpdate: Partial<VLibrasConfig>) => {
    try {
      console.log('VLibras: Updating config with:', configUpdate);
      const newConfig = { ...state.config, ...configUpdate };
      dispatch({ type: 'SET_CONFIG', payload: configUpdate });
      await saveConfig(newConfig);
      
      if (state.isEnabled) {
        dispatch({ type: 'SET_LOADING', payload: true });
        vlibrasService.destroyWidget();
        await vlibrasService.initializeWidget(newConfig);
        vlibrasService.showWidget();
        dispatch({ type: 'SET_LOADING', payload: false });
      }
      
      console.log('VLibras: Config updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar configuração';
      console.error('VLibras: Config update error:', error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  const value: VLibrasContextType = {
    state,
    actions: {
      enable,
      disable,
      updateConfig,
      loadWidget: () => loadWidget()
    }
  };

  return (
    <VLibrasContext.Provider value={value}>
      {children}
    </VLibrasContext.Provider>
  );
};

export const useVLibras = (): VLibrasContextType => {
  const context = useContext(VLibrasContext);
  if (!context) {
    throw new Error('useVLibras must be used within a VLibrasProvider');
  }
  return context;
};
