import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

interface SearchResult {
  id: number;
  title: string;
  type: 'video' | 'titulo' | 'podcast';
  author: string;
  duration?: string;
  pages?: number;
  thumbnail?: string;
  description: string;
  year: number;
  subject: string;
}

interface SearchFilters {
  resourceType: string[];
  subject: string[];
  author: string;
  year: string;
  duration: string;
}

export const useSearchResults = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>({
    resourceType: [],
    subject: [],
    author: '',
    year: '',
    duration: ''
  });
  const [sortBy, setSortBy] = useState('relevance');
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const resultsPerPage = 9;

  const query = searchParams.get('q') || '';
  
  const appliedFilters = useMemo(() => {
    return searchParams.getAll('filtros') || [];
  }, [searchParams]);

  const totalResults = allResults.length;
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = allResults.slice(startIndex, endIndex);
  const hasMore = currentPage < totalPages;

  // Helper function to check if any filter object has active filters
  const checkHasActiveFilters = (filterObj: SearchFilters): boolean => {
    return filterObj.resourceType.length > 0 || 
           filterObj.subject.length > 0 || 
           Boolean(filterObj.author) || 
           Boolean(filterObj.year) || 
           Boolean(filterObj.duration);
  };

  // Memoized boolean for current filters state
  const hasActiveFilters = useMemo((): boolean => {
    return checkHasActiveFilters(filters);
  }, [filters]);

  const sortResults = (resultsToSort: SearchResult[], sortType: string) => {
    switch (sortType) {
      case 'recent':
        return resultsToSort.sort((a, b) => b.year - a.year);
      
      case 'accessed':
        return resultsToSort.sort(() => Math.random() - 0.5);
      
      case 'type':
        const typeOrder = { 'video': 0, 'podcast': 1, 'titulo': 2 };
        return resultsToSort.sort((a, b) => {
          const aOrder = typeOrder[a.type] ?? 3;
          const bOrder = typeOrder[b.type] ?? 3;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return a.title.localeCompare(b.title);
        });
      
      case 'relevance':
      default:
        return resultsToSort.sort((a, b) => {
          const queryLower = query.toLowerCase();
          const aRelevance = a.title.toLowerCase().includes(queryLower) ? 2 : 0;
          const bRelevance = b.title.toLowerCase().includes(queryLower) ? 2 : 0;
          
          const aScore = aRelevance + (a.year / 1000);
          const bScore = bRelevance + (b.year / 1000);
          
          return bScore - aScore;
        });
    }
  };

  const generateMockResults = (searchQuery: string, currentFilters: SearchFilters) => {
    const mockData = [
      {
        id: 1,
        title: 'Introdução à Libras',
        type: 'video' as const,
        author: 'Prof. Maria Silva',
        duration: '25:30',
        thumbnail: '/placeholder.svg',
        description: 'Curso básico de Língua Brasileira de Sinais para iniciantes.',
        year: 2023,
        subject: 'Educação'
      },
      {
        id: 2,
        title: 'História da Comunidade Surda',
        type: 'titulo' as const,
        author: 'João Santos',
        pages: 245,
        description: 'Uma análise histórica da evolução da comunidade surda no Brasil.',
        year: 2022,
        subject: 'História'
      },
      {
        id: 3,
        title: 'Podcast Mãos que Falam',
        type: 'podcast' as const,
        author: 'Ana Costa',
        duration: '45:20',
        description: 'Conversas sobre inclusão e acessibilidade.',
        year: 2023,
        subject: 'Inclusão'
      },
      {
        id: 4,
        title: 'Cultura Surda no Brasil',
        type: 'titulo' as const,
        author: 'Maria Silva',
        pages: 180,
        description: 'Explorando a rica cultura da comunidade surda brasileira.',
        year: 2023,
        subject: 'Cultura Surda'
      },
      {
        id: 5,
        title: 'Tecnologia Assistiva para Surdos',
        type: 'video' as const,
        author: 'Carlos Oliveira',
        duration: '15:45',
        description: 'Como a tecnologia pode ajudar na inclusão de pessoas surdas.',
        year: 2022,
        subject: 'Tecnologia'
      }
    ];

    return mockData.filter(item => {
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        const matchesQuery = item.title.toLowerCase().includes(queryLower) ||
                           item.description.toLowerCase().includes(queryLower) ||
                           item.author.toLowerCase().includes(queryLower) ||
                           item.subject.toLowerCase().includes(queryLower);
        if (!matchesQuery) return false;
      }

      if (currentFilters.resourceType.length > 0) {
        if (!currentFilters.resourceType.includes(item.type)) return false;
      }

      if (currentFilters.subject.length > 0) {
        if (!currentFilters.subject.includes(item.subject)) return false;
      }

      if (currentFilters.author) {
        const authorLower = currentFilters.author.toLowerCase();
        if (!item.author.toLowerCase().includes(authorLower)) return false;
      }

      if (currentFilters.year) {
        if (item.year.toString() !== currentFilters.year) return false;
      }

      if (currentFilters.duration && (item.type === 'video' || item.type === 'podcast')) {
        const duration = item.duration;
        if (duration) {
          const [minutes] = duration.split(':').map(Number);
          switch (currentFilters.duration) {
            case 'short':
              if (minutes > 10) return false;
              break;
            case 'medium':
              if (minutes <= 10 || minutes > 30) return false;
              break;
            case 'long':
              if (minutes <= 30) return false;
              break;
          }
        }
      }

      return true;
    });
  };

  const performSearch = (searchQuery: string, currentFilters: SearchFilters) => {
    setLoading(true);
    console.log('Performing search with:', { searchQuery, currentFilters });
    
    setTimeout(() => {
      if (searchQuery || checkHasActiveFilters(currentFilters)) {
        const searchResults = generateMockResults(searchQuery, currentFilters);
        const sortedResults = sortResults(searchResults, sortBy);
        console.log('Search results:', sortedResults);
        setAllResults(sortedResults);
      } else {
        setAllResults([]);
      }
      setLoading(false);
    }, 500);
  };

  // Initialize filters from URL params only once
  useEffect(() => {
    if (appliedFilters.length > 0) {
      setFilters(prev => ({
        ...prev,
        resourceType: appliedFilters
      }));
    }
  }, []);

  // Perform search when query changes or on initial load
  useEffect(() => {
    console.log('Search triggered with query:', query);
    performSearch(query, filters);
    setCurrentPage(1);
  }, [query]);

  // Perform search when filters change
  useEffect(() => {
    if (query || hasActiveFilters) {
      console.log('Filter search triggered with filters:', filters);
      performSearch(query, filters);
      setCurrentPage(1);
    }
  }, [filters]);

  // Sort results when sortBy changes
  useEffect(() => {
    if (allResults.length > 0) {
      console.log('Sorting results by:', sortBy);
      const sortedResults = sortResults([...allResults], sortBy);
      setAllResults(sortedResults);
      setCurrentPage(1);
    }
  }, [sortBy]);

  const handleFilterChange = (newFilters: SearchFilters) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
  };

  const handleSortChange = (newSort: string) => {
    console.log('Sort changed to:', newSort);
    setSortBy(newSort);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    query,
    filters,
    sortBy,
    currentResults,
    totalResults,
    totalPages,
    currentPage,
    loading,
    hasActiveFilters,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    setFilters
  };
};
