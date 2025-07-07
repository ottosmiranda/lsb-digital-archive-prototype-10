
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchFilters } from '@/types/searchTypes';
import { useSearchAnalytics } from '@/hooks/useSearchAnalytics';
import { isShowingAllResourceTypes } from '@/utils/searchUtils';

export const useSearchState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { trackSearch } = useSearchAnalytics();
  
  const [filters, setFilters] = useState<SearchFilters>({
    resourceType: ['all'], // CORRIGIDO: Inicializar com 'all' por padrão
    subject: [],
    author: [],
    year: '',
    duration: '',
    language: [],
    documentType: [],
  });
  
  const [sortBy, setSortByState] = useState('title'); // CORRIGIDO: Padrão para ordenação alfabética
  const [currentPage, setCurrentPage] = useState(1);

  const query = searchParams.get('q') || '';
  
  const appliedFilters = useMemo(() => {
    return searchParams.getAll('filtros') || [];
  }, [searchParams]);

  // CORRIGIDO: Inicialização mais robusta
  useEffect(() => {
    console.log('🔄 Initializing filters from URL params:', { 
      appliedFilters,
      currentFilters: filters 
    });
    
    const resourceTypesFromUrl = searchParams.getAll('filtros');
    const sortParam = searchParams.get('ordenar');

    // Só atualizar se há filtros específicos na URL
    if (resourceTypesFromUrl.length > 0) {
      console.log('📍 Setting resourceType from URL:', resourceTypesFromUrl);
      setFilters(prev => ({
        ...prev,
        resourceType: resourceTypesFromUrl
      }));
    } else {
      // Manter 'all' como padrão se não há filtros na URL
      console.log('📍 Keeping default resourceType as ["all"]');
    }

    // Configurar ordenação baseada na URL
    if (sortParam === 'recentes') {
      setSortByState('recent');
    } else if (sortParam === 'mais-acessados') {
      setSortByState('accessed');
    } else if (!resourceTypesFromUrl.length) {
      // Se não há filtros específicos, usar ordenação alfabética
      setSortByState('title');
    }
  }, []); // Apenas na inicialização

  // Track searches when query changes (from URL navigation)
  useEffect(() => {
    if (query.trim()) {
      trackSearch(query.trim());
    }
  }, [query, trackSearch]);

  const setQuery = (newQuery: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (newQuery) {
      newSearchParams.set('q', newQuery);
    } else {
      newSearchParams.delete('q');
    }
    setSearchParams(newSearchParams);
  };

  const setSortBy = (newSort: string) => {
    setSortByState(newSort);
    const newSearchParams = new URLSearchParams(searchParams);
    if (newSort === 'recent') {
      newSearchParams.set('ordenar', 'recentes');
    } else if (newSort === 'accessed') {
      newSearchParams.set('ordenar', 'mais-acessados');
    } else {
      newSearchParams.delete('ordenar');
    }
    setSearchParams(newSearchParams);
  };

  // CORRIGIDO: Função para sincronizar filtros com URL
  const updateFilters = (newFilters: SearchFilters) => {
    console.log('🔧 Updating filters and URL:', { 
      newFilters,
      isShowingAll: isShowingAllResourceTypes(newFilters.resourceType)
    });
    
    setFilters(newFilters);
    
    // Atualizar URL params
    const newSearchParams = new URLSearchParams(searchParams);
    
    // Remover filtros existentes
    newSearchParams.delete('filtros');
    
    // CORRIGIDO: Lógica para URL params baseada no estado dos filtros
    if (isShowingAllResourceTypes(newFilters.resourceType)) {
      // Para "Todos", não adicionar parâmetro filtros na URL
      console.log('📍 Showing all resources - removing filtros param');
    } else if (newFilters.resourceType.length > 0) {
      // Para filtros específicos, adicionar na URL
      newFilters.resourceType.forEach(type => {
        newSearchParams.append('filtros', type);
      });
      console.log('📍 Setting specific filters in URL:', newFilters.resourceType);
    }
    
    setSearchParams(newSearchParams);
  };

  return {
    query,
    filters,
    sortBy,
    currentPage,
    setFilters: updateFilters,
    setSortBy,
    setCurrentPage,
    setQuery
  };
};
