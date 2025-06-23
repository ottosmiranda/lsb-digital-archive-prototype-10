import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { VLibrasContextType, VLibrasState, VLibrasConfig } from '@/types/vlibrasTypes';
import { vlibrasService } from '@/services/vlibrasService';

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
    const savedConfig = vlibrasService.loadConfig();
    dispatch({ type: 'INITIALIZE', payload: savedConfig });
    
    if (savedConfig.enabled) {
      loadWidget();
    }
  }, []);

  const loadWidget = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      await vlibrasService.initializeWidget(state.config);
      dispatch({ type: 'SET_LOADED', payload: true });
      
      if (state.config.enabled) {
        vlibrasService.showWidget();
        dispatch({ type: 'SET_ENABLED', payload: true });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar o VLibras';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('VLibras load error:', error);
    }
  };

  const enable = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      if (!state.isLoaded) {
        await vlibrasService.initializeWidget(state.config);
        dispatch({ type: 'SET_LOADED', payload: true });
      }
      
      vlibrasService.showWidget();
      dispatch({ type: 'SET_ENABLED', payload: true });
      
      const newConfig = { ...state.config, enabled: true };
      vlibrasService.saveConfig(newConfig);
      dispatch({ type: 'SET_CONFIG', payload: { enabled: true } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao habilitar o VLibras';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('VLibras enable error:', error);
    }
  };

  const disable = () => {
    try {
      vlibrasService.hideWidget();
      dispatch({ type: 'SET_ENABLED', payload: false });
      
      const newConfig = { ...state.config, enabled: false };
      vlibrasService.saveConfig(newConfig);
      dispatch({ type: 'SET_CONFIG', payload: { enabled: false } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao desabilitar o VLibras';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('VLibras disable error:', error);
    }
  };

  const updateConfig = async (configUpdate: Partial<VLibrasConfig>) => {
    try {
      const newConfig = { ...state.config, ...configUpdate };
      dispatch({ type: 'SET_CONFIG', payload: configUpdate });
      vlibrasService.saveConfig(newConfig);
      
      if (state.isEnabled) {
        dispatch({ type: 'SET_LOADING', payload: true });
        vlibrasService.destroyWidget();
        await vlibrasService.initializeWidget(newConfig);
        vlibrasService.showWidget();
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar configuração';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('VLibras config update error:', error);
    }
  };

  const value: VLibrasContextType = {
    state,
    actions: {
      enable,
      disable,
      updateConfig,
      loadWidget
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
