
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useQueryClear = () => {
  const [, setSearchParams] = useSearchParams();

  const clearQuery = useCallback(() => {
    console.log('🔍 useQueryClear: Executando limpeza COMPLETA da query');
    
    try {
      // Criar nova URLSearchParams completamente limpa
      const newSearchParams = new URLSearchParams();
      
      // Definir apenas filtros=all (sem parâmetro q)
      newSearchParams.set('filtros', 'all');
      
      console.log('🔍 useQueryClear: URL final será:', `/buscar?${newSearchParams.toString()}`);
      console.log('🔍 useQueryClear: Parâmetros finais:', {
        q: newSearchParams.get('q'),
        filtros: newSearchParams.get('filtros')
      });
      
      // Aplicar a nova URL (isso remove completamente o parâmetro 'q')
      setSearchParams(newSearchParams);
      
      console.log('✅ useQueryClear: Query COMPLETAMENTE limpa - apenas filtros=all permanece');
      return true;
    } catch (error) {
      console.error('❌ useQueryClear: Erro ao limpar query:', error);
      return false;
    }
  }, [setSearchParams]);

  return { clearQuery };
};
