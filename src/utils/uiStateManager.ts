import { SearchFilters } from '@/types/searchTypes';
import { isShowingAllResourceTypes, checkHasActiveFilters } from '@/utils/searchUtils';

// Enum para estados unificados da UI (SSOT)
export enum UIState {
  WELCOME = 'welcome',
  LOADING = 'loading', 
  RESULTS = 'results',
  EMPTY = 'empty'
}

// Interface para debug (Principle of Least Surprise)
export interface UIStateDebugInfo {
  query: string;
  hasActiveFilters: boolean;
  isBrowsingMode: boolean;
  shouldShowResults: boolean;
  hasResults: boolean;
  loading: boolean;
  computedState: UIState;
  resourceType: string[];
}

// Função pura para determinar se está em modo navegação (SRP)
export const isBrowsingMode = (filters: SearchFilters): boolean => {
  return isShowingAllResourceTypes(filters.resourceType);
};

// Função pura para determinar se deve mostrar resultados (SRP) 
export const shouldShowResultsInterface = (
  query: string, 
  filters: SearchFilters
): boolean => {
  const hasQuery = query.trim() !== '';
  const hasActiveFilters = checkHasActiveFilters(filters);
  const browsing = isBrowsingMode(filters);
  
  return hasQuery || hasActiveFilters || browsing;
};

// Função principal para calcular estado da UI (SSOT + Composition)
export const calculateUIState = (
  query: string,
  filters: SearchFilters,
  hasResults: boolean,
  loading: boolean
): UIState => {
  // Fail Fast: se está carregando, retorna loading
  if (loading) {
    return UIState.LOADING;
  }
  
  const shouldShowResults = shouldShowResultsInterface(query, filters);
  
  // Lógica simplificada (KISS)
  if (!shouldShowResults) {
    return UIState.WELCOME;
  }
  
  return hasResults ? UIState.RESULTS : UIState.EMPTY;
};

// Função para debug detalhado (DRY)
export const getUIStateDebugInfo = (
  query: string,
  filters: SearchFilters,
  hasResults: boolean,
  loading: boolean
): UIStateDebugInfo => {
  const hasActiveFilters = checkHasActiveFilters(filters);
  const browsing = isBrowsingMode(filters);
  const shouldShowResults = shouldShowResultsInterface(query, filters);
  const computedState = calculateUIState(query, filters, hasResults, loading);
  
  return {
    query,
    hasActiveFilters,
    isBrowsingMode: browsing,
    shouldShowResults,
    hasResults,
    loading,
    computedState,
    resourceType: filters.resourceType
  };
};

// Função para verificar estados inconsistentes (Fail Fast)
export const validateUIState = (debugInfo: UIStateDebugInfo): string[] => {
  const issues: string[] = [];
  
  // Validação: "Todos" deve sempre mostrar interface de resultados
  if (debugInfo.isBrowsingMode && debugInfo.computedState === UIState.WELCOME) {
    issues.push('ERRO: "Todos" está ativo mas mostrando tela de boas-vindas');
  }
  
  // Validação: se há query, deve mostrar interface de resultados
  if (debugInfo.query.trim() && debugInfo.computedState === UIState.WELCOME) {
    issues.push('ERRO: Há query mas mostrando tela de boas-vindas');
  }
  
  return issues;
};