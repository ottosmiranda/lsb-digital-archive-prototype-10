
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchFilters } from '@/types/searchTypes';
import { useSearchAnalytics } from '@/hooks/useSearchAnalytics';

export const useSearchState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { trackSearch } = useSearchAnalytics();
  
  const [filters, setFilters] = useState<SearchFilters>({
    resourceType: [],
    subject: [],
    author: [],
    year: '',
    duration: '',
    language: [],
    documentType: [],
  });
  
  const [sortBy, setSortByState] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);

  const query = searchParams.get('q') || '';
  
  const appliedFilters = useMemo(() => {
    return searchParams.getAll('filtros') || [];
  }, [searchParams]);

  // Initialize filters and sorting from URL params only once
  useEffect(() => {
    console.log('🔄 Initializing filters from URL params:', { appliedFilters });
    
    const resourceTypesFromUrl = searchParams.getAll('filtros');

    // CORRIGIDO: Melhor lógica de inicialização
    if (resourceTypesFromUrl.length > 0) {
      // Se há filtros na URL, usar eles
      setFilters(prev => ({
        ...prev,
        resourceType: resourceTypesFromUrl
      }));
      console.log('📍 Setting resourceType from URL:', resourceTypesFromUrl);
    } else {
      // Se não há filtros na URL, definir como "Todos" por padrão
      setFilters(prev => ({
        ...prev,
        resourceType: ['all']
      }));
      console.log('📍 Setting default resourceType to "all"');
    }

    const sortParam = searchParams.get('ordenar');
    if (sortParam === 'recentes') {
      setSortByState('recent');
    } else if (sortParam === 'mais-acessados') {
      setSortByState('accessed');
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

  // CORRIGIDO: Função para atualizar filtros E URL params
  const updateFilters = (newFilters: SearchFilters) => {
    console.log('🔧 Updating filters:', { newFilters });
    setFilters(newFilters);
    
    // Sincronizar URL params com resourceType
    const newSearchParams = new URLSearchParams(searchParams);
    
    // Remover filtros existentes
    newSearchParams.delete('filtros');
    
    // Adicionar novos filtros de resourceType
    if (newFilters.resourceType.length > 0) {
      if (newFilters.resourceType.includes('all')) {
        // Para "Todos", não adicionar parâmetro filtros na URL
        console.log('📍 Setting "Todos" - removing filtros param');
      } else {
        // Para filtros específicos, adicionar na URL
        newFilters.resourceType.forEach(type => {
          newSearchParams.append('filtros', type);
        });
        console.log('📍 Setting specific filters in URL:', newFilters.resourceType);
      }
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
