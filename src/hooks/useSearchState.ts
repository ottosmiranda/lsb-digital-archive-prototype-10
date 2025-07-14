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
    author: [],
    year: '',
    duration: '',
    language: [],
    documentType: [],
    program: [],
    channel: [],
  });
  
  const [sortBy, setSortByState] = useState('relevance');
  
  // Ler página da URL e sincronizar com estado
  const pageFromUrl = parseInt(searchParams.get('pagina') || '1', 10);
  const [currentPage, setCurrentPageState] = useState(pageFromUrl);

  // CORREÇÃO: Detectar quando query foi limpa pelo botão X
  const query = searchParams.get('q') || '';
  const isAllState = searchParams.get('filtros') === 'all' && !query;
  
  console.log('🔍 useSearchState: Estado atual:', {
    query,
    isAllState,
    filtrosParam: searchParams.get('filtros'),
    queryExists: !!query
  });
  
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
    console.log('🔗 Query from URL:', query);
    console.log('🔗 Is "all" state (filtros=all, no query):', isAllState);

    // CORREÇÃO: Handle 'all' filter specially - it means no resource type filters
    let mappedFilters: string[];
    if (resourceTypesFromUrl.includes('all') || resourceTypesFromUrl.length === 0) {
      mappedFilters = [];
      console.log('🔄 Definindo filtros como array vazio (busca global)');
    } else {
      // Map URL-friendly values back to internal filter values
      const reverseFilterMapping: { [key: string]: string } = {
        'livros': 'titulo',
        'videos': 'video',
        'podcasts': 'podcast'
      };
      
      mappedFilters = resourceTypesFromUrl.map(filter => 
        reverseFilterMapping[filter] || filter
      );
      console.log('🔄 Mapeando filtros específicos:', mappedFilters);
    }

    // Always update filters to match URL (even if empty)
    setFilters(prev => ({
      ...prev,
      resourceType: mappedFilters
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
    
    console.log('✅ State synchronized with URL:', { 
      resourceType: mappedFilters, 
      sortBy: sortParam || 'relevance', 
      pagina: pageFromUrlEffect,
      isAllState 
    });
  }, [searchParams, query, isAllState]);

  // Track searches when query changes (from URL navigation)
  useEffect(() => {
    if (query.trim()) {
      trackSearch(query.trim());
    }
  }, [query, trackSearch]);

  const setQuery = (newQuery: string) => {
    console.log('🔄 setQuery chamado:', newQuery);
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
    
    // CORREÇÃO: Se resourceType contém 'all', mapear para array vazio (busca global)  
    const processedFilters = {
      ...newFilters,
      resourceType: newFilters.resourceType.includes('all') ? [] : newFilters.resourceType
    };
    
    setFilters(processedFilters);
    
    // Update URL to match new filters
    const newSearchParams = new URLSearchParams(searchParams);
    
    // Clear existing filtros
    newSearchParams.delete('filtros');
    
    // Map internal filter values to URL-friendly values
    const filterMapping: { [key: string]: string } = {
      'titulo': 'livros',
      'video': 'videos', 
      'podcast': 'podcasts'
    };
    
    // Add new resource type filters with proper mapping, or 'all' if empty
    if (processedFilters.resourceType.length > 0) {
      processedFilters.resourceType.forEach(type => {
        const urlValue = filterMapping[type] || type;
        newSearchParams.append('filtros', urlValue);
      });
    } else {
      // If no resource type filters, show 'all' in URL
      newSearchParams.append('filtros', 'all');
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
