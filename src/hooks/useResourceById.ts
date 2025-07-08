
import { useState, useEffect } from 'react';
import { Resource } from '@/types/resourceTypes';
import { resourceByIdService, ResourceByIdResponse } from '@/services/resourceByIdService';
import { resourceAccessAnalytics } from '@/services/resourceAccessAnalytics';

interface UseResourceByIdState {
  resource: Resource | null;
  suggestions: Resource[];
  loading: boolean;
  error: string | null;
  searchAttempted: boolean;
}

interface UseResourceByIdReturn extends UseResourceByIdState {
  retrySearch: () => void;
  clearError: () => void;
}

export const useResourceById = (id: string | undefined): UseResourceByIdReturn => {
  const [state, setState] = useState<UseResourceByIdState>({
    resource: null,
    suggestions: [],
    loading: false,
    error: null,
    searchAttempted: false
  });

  const searchResource = async (resourceId: string) => {
    console.log(`🎯 Hook: Iniciando busca para ID ${resourceId}`);
    
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      searchAttempted: true
    }));

    try {
      const result: ResourceByIdResponse = await resourceByIdService.findResourceById(resourceId);

      if (result.success && result.resource) {
        // Log acesso bem-sucedido
        resourceAccessAnalytics.logSuccessfulAccess(resourceId, result.resource);

        setState(prev => ({
          ...prev,
          resource: result.resource,
          suggestions: [],
          loading: false,
          error: null
        }));

        console.log(`✅ Hook: Recurso encontrado - ${result.resource.title}`);
      } else {
        // Log acesso falhado com sugestões
        resourceAccessAnalytics.logFailedAccess(resourceId, result.suggestions);

        setState(prev => ({
          ...prev,
          resource: null,
          suggestions: result.suggestions,
          loading: false,
          error: result.error || 'Recurso não encontrado'
        }));

        console.log(`❌ Hook: Recurso não encontrado. ${result.suggestions.length} sugestões disponíveis`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na busca';
      
      // Log erro técnico
      resourceAccessAnalytics.logTechnicalError(resourceId, errorMessage);

      setState(prev => ({
        ...prev,
        resource: null,
        suggestions: [],
        loading: false,
        error: errorMessage
      }));

      console.error(`❌ Hook: Erro na busca do ID ${resourceId}:`, error);
    }
  };

  const retrySearch = () => {
    if (id) {
      console.log(`🔄 Hook: Tentativa de retry para ID ${id}`);
      searchResource(id);
    }
  };

  const clearError = () => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  };

  useEffect(() => {
    if (id && id.trim()) {
      console.log(`🚀 Hook: Effect triggered para ID ${id}`);
      searchResource(id);
    } else {
      // Reset state quando não há ID
      setState({
        resource: null,
        suggestions: [],
        loading: false,
        error: null,
        searchAttempted: false
      });
    }
  }, [id]);

  return {
    ...state,
    retrySearch,
    clearError
  };
};
