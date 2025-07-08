
import { useState, useEffect } from 'react';
import { Resource } from '@/types/resourceTypes';
import { SearchResult } from '@/types/searchTypes';
import { resourceByIdService } from '@/services/resourceByIdService';
import { resourceAccessAnalytics } from '@/services/resourceAccessAnalytics';

interface UseResourceByIdState {
  resource: Resource | null;
  loading: boolean;
  error: string | null;
  suggestions: SearchResult[];
  searchAttempted: boolean;
}

interface UseResourceByIdReturn extends UseResourceByIdState {
  retry: () => void;
  clearError: () => void;
}

/**
 * Hook para buscar um recurso específico por ID
 * Implementa busca escalonada: cache local → API → sugestões
 */
export const useResourceById = (id: string | undefined): UseResourceByIdReturn => {
  const [state, setState] = useState<UseResourceByIdState>({
    resource: null,
    loading: false,
    error: null,
    suggestions: [],
    searchAttempted: false
  });

  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  const searchResourceById = async (resourceId: string, attempt: number = 0) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log(`🎯 useResourceById: Tentativa ${attempt + 1} para ID ${resourceId}`);
      
      // Log da tentativa de acesso
      resourceAccessAnalytics.logAccessAttempt(resourceId, 'direct_access');

      const result = await resourceByIdService.findResourceById(resourceId);

      if (result.success && result.resource) {
        console.log(`✅ useResourceById: Recurso encontrado para ID ${resourceId}`);
        
        setState({
          resource: result.resource,
          loading: false,
          error: null,
          suggestions: [],
          searchAttempted: true
        });

        // Reset retry count em caso de sucesso
        setRetryCount(0);

        // Log de sucesso
        resourceAccessAnalytics.logAccessAttempt(resourceId, 'found');
      } else {
        console.log(`❌ useResourceById: Recurso não encontrado para ID ${resourceId}`);
        
        setState({
          resource: null,
          loading: false,
          error: result.error || `Recurso com ID ${resourceId} não encontrado`,
          suggestions: result.suggestions || [],
          searchAttempted: true
        });

        // Log de não encontrado
        resourceAccessAnalytics.logAccessAttempt(resourceId, 'not_found');
      }

    } catch (error) {
      console.error(`❌ useResourceById: Erro na busca por ID ${resourceId} (tentativa ${attempt + 1}):`, error);
      
      // Retry automático em caso de erro de rede
      if (attempt < maxRetries && error instanceof Error && 
          (error.message.includes('timeout') || error.message.includes('fetch'))) {
        console.log(`🔄 Tentando novamente em 1 segundo (tentativa ${attempt + 2}/${maxRetries + 1})`);
        
        setTimeout(() => {
          setRetryCount(attempt + 1);
          searchResourceById(resourceId, attempt + 1);
        }, 1000);
        
        return;
      }
      
      setState({
        resource: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na busca',
        suggestions: [],
        searchAttempted: true
      });

      // Log de erro
      resourceAccessAnalytics.logAccessAttempt(resourceId, 'error');
    }
  };

  const retry = () => {
    if (id) {
      setState(prev => ({ ...prev, searchAttempted: false }));
      setRetryCount(0);
      searchResourceById(id);
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Efeito para buscar o recurso quando o ID muda
  useEffect(() => {
    if (id && !state.searchAttempted && retryCount === 0) {
      searchResourceById(id);
    }
  }, [id, state.searchAttempted, retryCount]);

  // Reset state quando ID muda
  useEffect(() => {
    setState({
      resource: null,
      loading: false,
      error: null,
      suggestions: [],
      searchAttempted: false
    });
    setRetryCount(0);
  }, [id]);

  return {
    ...state,
    retry,
    clearError
  };
};
