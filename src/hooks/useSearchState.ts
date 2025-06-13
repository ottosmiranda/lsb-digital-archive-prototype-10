
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchFilters } from '@/types/searchTypes';

export const useSearchState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filters, setFilters] = useState<SearchFilters>({
    resourceType: [],
    subject: [],
    author: '',
    year: '',
    duration: ''
  });
  
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);

  const query = searchParams.get('q') || '';
  
  const appliedFilters = useMemo(() => {
    return searchParams.getAll('filtros') || [];
  }, [searchParams]);

  // Initialize filters from URL params only once
  useEffect(() => {
    if (appliedFilters.length > 0) {
      setFilters(prev => ({
        ...prev,
        resourceType: appliedFilters
      }));
    }
  }, []);

  const setQuery = (newQuery: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (newQuery) {
      newSearchParams.set('q', newQuery);
    } else {
      newSearchParams.delete('q');
    }
    setSearchParams(newSearchParams);
  };

  return {
    query,
    filters,
    sortBy,
    currentPage,
    setFilters,
    setSortBy,
    setCurrentPage,
    setQuery
  };
};
