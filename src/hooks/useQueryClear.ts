
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useQueryClear = () => {
  const [, setSearchParams] = useSearchParams();

  const clearQuery = useCallback(() => {
    console.log('🔍 useQueryClear: Executando limpeza da query');
    
    try {
      const newSearchParams = new URLSearchParams();
      newSearchParams.set('filtros', 'all');
      
      console.log('🔍 useQueryClear: Redirecionando para:', `/buscar?${newSearchParams.toString()}`);
      
      setSearchParams(newSearchParams);
      
      console.log('✅ useQueryClear: Query limpa com sucesso');
      return true;
    } catch (error) {
      console.error('❌ useQueryClear: Erro ao limpar query:', error);
      return false;
    }
  }, [setSearchParams]);

  return { clearQuery };
};
