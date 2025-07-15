
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
    console.group('🔄 useSearchState - URL Sync');
    const resourceTypesFromUrl = searchParams.getAll('filtros');
    console.log('📋 URL filtros raw:', resourceTypesFromUrl);
    
    // ✅ CORRIGIDO: Map URL-friendly values back to internal filter values
    const reverseFilterMapping: { [key: string]: string } = {
      'todos': 'all',
      'livros': 'titulo',
      'videos': 'video',
      'podcasts': 'podcast'
    };
    
    const mappedFilters = resourceTypesFromUrl.map(filter => {
      const mapped = reverseFilterMapping[filter] || filter;
      console.log(`🔗 Mapping: ${filter} → ${mapped}`);
      return mapped;
    });

    console.log('📋 Mapped filters:', mappedFilters);

    // ✅ CORREÇÃO: Detectar mudança de resourceType e resetar página
    const previousResourceType = previousResourceTypeRef.current;
    const resourceTypeChanged = 
      mappedFilters.length !== previousResourceType.length ||
      mappedFilters.some((type, index) => type !== previousResourceType[index]);

    console.log('📋 Resource type changed:', resourceTypeChanged);
    console.log('📋 Previous:', previousResourceType);
    console.log('📋 Current:', mappedFilters);

    if (resourceTypeChanged && mappedFilters.length > 0 && previousResourceType.length > 0) {
      console.log('🔄 ResourceType mudou, resetando página para 1');
      setCurrentPageState(1);
      
      // ✅ CORREÇÃO: Atualizar URL preservando TODOS os parâmetros exceto página
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('pagina');
      console.log('🔗 Removing pagina parameter due to filter change');
      setSearchParams(newSearchParams, { replace: true });
    } else {
      // Sincronizar página da URL com estado apenas se não houve mudança de tipo
      const pageFromUrlEffect = parseInt(searchParams.get('pagina') || '1', 10);
      setCurrentPageState(pageFromUrlEffect);
      console.log(`📄 Setting page from URL: ${pageFromUrlEffect}`);
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
    console.groupEnd();
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

  // ✅ CORRIGIDO: Function to update filters preservando TODOS os parâmetros
  const updateFilters = (newFilters: SearchFilters) => {
    console.group('🔄 useSearchState - updateFilters');
    console.log('📋 Received filters:', newFilters);
    console.log('📋 Current URL params:', Object.fromEntries(searchParams.entries()));
    
    const processedFilters = newFilters;
    
    setFilters(processedFilters);
    
    // ✅ CORREÇÃO: Preservar TODOS os parâmetros da URL existente
    const newSearchParams = new URLSearchParams(searchParams);
    console.log('📋 Preserving existing params:', Object.fromEntries(newSearchParams.entries()));
    
    // Clear existing filtros
    newSearchParams.delete('filtros');
    
    // ✅ CORRIGIDO: Map internal filter values to URL-friendly values
    const filterMapping: { [key: string]: string } = {
      'all': 'todos',
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
    
    console.log('📝 Final URL params:', Object.fromEntries(newSearchParams.entries()));
    
    // ✅ CORREÇÃO: Usar replace apenas para atualizações de filtro, não para navegação
    setSearchParams(newSearchParams, { replace: false });
    console.groupEnd();
  };

  // Function to update current page and URL accordingly
  const setCurrentPage = (newPage: number) => {
    console.log(`📄 Setting page: ${newPage}`);
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
