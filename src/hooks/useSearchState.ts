
import { useState, useEffect, useMemo, useRef } from 'react';
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
    program: [],
    channel: [],
  });
  
  const [sortBy, setSortByState] = useState('relevance');
  
  // ✅ CORREÇÃO: Ref para detectar mudanças de resourceType
  const previousResourceTypeRef = useRef<string[]>([]);
  
  // Ler página da URL e sincronizar com estado
  const pageFromUrl = parseInt(searchParams.get('pagina') || '1', 10);
  const [currentPage, setCurrentPageState] = useState(pageFromUrl);

  const query = searchParams.get('q') || '';
  
  const appliedFilters = useMemo(() => {
    return searchParams.getAll('filtros') || [];
  }, [searchParams]);

  useEffect(() => {
    const resourceTypesFromUrl = searchParams.getAll('filtros');
    
    // Map URL-friendly values back to internal filter values
    const reverseFilterMapping: { [key: string]: string } = {
      'livros': 'titulo',
      'videos': 'video',
      'podcasts': 'podcast'
    };
    
    const mappedFilters = resourceTypesFromUrl.map(filter => 
      reverseFilterMapping[filter] || filter
    );

    // ✅ CORREÇÃO: Detectar mudança de resourceType e resetar página
    const previousResourceType = previousResourceTypeRef.current;
    const resourceTypeChanged = 
      mappedFilters.length !== previousResourceType.length ||
      mappedFilters.some((type, index) => type !== previousResourceType[index]);

    if (resourceTypeChanged && mappedFilters.length > 0 && previousResourceType.length > 0) {
      console.log('🔄 ResourceType mudou, resetando página para 1:', {
        anterior: previousResourceType,
        novo: mappedFilters
      });
      setCurrentPageState(1);
      
      // Atualizar URL para remover parâmetro de página
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('pagina');
      setSearchParams(newSearchParams, { replace: true });
    } else {
      // Sincronizar página da URL com estado apenas se não houve mudança de tipo
      const pageFromUrlEffect = parseInt(searchParams.get('pagina') || '1', 10);
      setCurrentPageState(pageFromUrlEffect);
    }

    setFilters(prev => ({
      ...prev,
      resourceType: mappedFilters
    }));

    // Atualizar ref com o novo resourceType
    previousResourceTypeRef.current = mappedFilters;

    const sortParam = searchParams.get('ordenar');
    if (sortParam === 'recentes') {
      setSortByState('recent');
    } else if (sortParam === 'mais-acessados') {
      setSortByState('accessed');
    } else {
      setSortByState('relevance');
    }
    
    console.log('✅ State synchronized with URL:', { 
      resourceType: mappedFilters, 
      sortBy: sortParam || 'relevance', 
      pagina: resourceTypeChanged ? 1 : parseInt(searchParams.get('pagina') || '1', 10),
      resourceTypeChanged
    });
  }, [searchParams, query, setSearchParams]);

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
    console.log('🔄 updateFilters received:', newFilters);
    
    const processedFilters = newFilters;
    
    setFilters(processedFilters);
    
    // CORREÇÃO: Força atualização da URL sem race condition
    const newSearchParams = new URLSearchParams(searchParams);
    console.log('📋 Current URL params:', Object.fromEntries(searchParams.entries()));
    
    // Clear existing filtros
    newSearchParams.delete('filtros');
    
    // Map internal filter values to URL-friendly values
    const filterMapping: { [key: string]: string } = {
      'titulo': 'livros',
      'video': 'videos', 
      'podcast': 'podcasts'
    };
    
    // Add new resource type filters with proper mapping
    if (processedFilters.resourceType.length > 0) {
      processedFilters.resourceType.forEach(type => {
        const urlValue = filterMapping[type] || type;
        console.log('🎯 Mapping filter:', { type, urlValue });
        newSearchParams.append('filtros', urlValue);
      });
    }
    
    console.log('📝 New URL params:', Object.fromEntries(newSearchParams.entries()));
    
    // CORREÇÃO: Força atualização imediata da URL
    setTimeout(() => {
      console.log('🚀 Forçando atualização da URL...');
      setSearchParams(newSearchParams, { replace: false });
    }, 0);
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
