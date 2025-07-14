
import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchFilters } from '@/types/searchTypes';
import { useSearchAnalytics } from '@/hooks/useSearchAnalytics';

export const useSearchState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { trackSearch } = useSearchAnalytics();
  
  // Flag para controlar se a mudança vem do próprio componente
  const isInternalUpdate = useRef(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    resourceType: [],
    subject: [],
    author: [], // CORRIGIDO: Array vazio para múltiplos autores
    year: '',
    duration: '',
    language: [],
    documentType: [],
    program: [], // Add program filter
    channel: [], // Add channel filter
  });
  
  const [sortBy, setSortByState] = useState('relevance');
  
  // Ler página da URL e sincronizar com estado
  const pageFromUrl = parseInt(searchParams.get('pagina') || '1', 10);
  const [currentPage, setCurrentPageState] = useState(pageFromUrl);

  const query = searchParams.get('q') || '';
  
  const appliedFilters = useMemo(() => {
    return searchParams.getAll('filtros') || [];
  }, [searchParams]);

  // Initialize filters from URL params
  useEffect(() => {
    // Se for uma atualização interna, ignore para evitar condição de corrida
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const resourceTypesFromUrl = searchParams.getAll('filtros');
    console.log('🔗 URL filters detected:', resourceTypesFromUrl);

    // Always update filters to match URL (even if empty)
    setFilters(prev => ({
      ...prev,
      resourceType: resourceTypesFromUrl
    }));

    const sortParam = searchParams.get('ordenar');
    if (sortParam === 'recentes') {
      setSortByState('recent');
    } else if (sortParam === 'mais-acessados') {
      setSortByState('accessed');
    } else {
      setSortByState('relevance');
    }

    // Sincronizar página da URL com estado
    const pageFromUrlEffect = parseInt(searchParams.get('pagina') || '1', 10);
    setCurrentPageState(pageFromUrlEffect);
    
    console.log('✅ State synchronized with URL:', { resourceType: resourceTypesFromUrl, sortBy: sortParam || 'relevance', pagina: pageFromUrlEffect });
  }, [searchParams]);

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

  // Function to update filters and URL search params accordingly
  const updateFilters = (newFilters: SearchFilters) => {
    console.log('🔄 Updating filters:', newFilters);
    
    // Marcar como atualização interna para evitar condição de corrida
    isInternalUpdate.current = true;
    
    setFilters(newFilters);
    
    // Update URL to match new filters
    const newSearchParams = new URLSearchParams(searchParams);
    
    // Clear existing filtros
    newSearchParams.delete('filtros');
    
    // Add new resource type filters
    if (newFilters.resourceType.length > 0) {
      newFilters.resourceType.forEach(type => {
        newSearchParams.append('filtros', type);
      });
    }
    
    setSearchParams(newSearchParams);
  };

  // Function to update current page and URL accordingly
  const setCurrentPage = (newPage: number) => {
    setCurrentPageState(newPage);
    const newSearchParams = new URLSearchParams(searchParams);
    if (newPage > 1) {
      newSearchParams.set('pagina', newPage.toString());
    } else {
      newSearchParams.delete('pagina');
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
