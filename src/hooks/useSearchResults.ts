
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchResult, SearchFilters } from '@/types/searchTypes';
import { dataService } from '@/services/dataService';

export const useSearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
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
  const [dataLoaded, setDataLoaded] = useState(false);
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

  const filterResults = (results: SearchResult[], searchQuery: string, currentFilters: SearchFilters) => {
    return results.filter(item => {
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

  const performSearch = async (searchQuery: string, currentFilters: SearchFilters) => {
    setLoading(true);
    console.log('Performing search with:', { searchQuery, currentFilters });
    
    try {
      // Load data from service
      const allData = await dataService.loadData();
      
      if (searchQuery || checkHasActiveFilters(currentFilters)) {
        const searchResults = filterResults(allData, searchQuery, currentFilters);
        const sortedResults = sortResults(searchResults, sortBy);
        console.log('Search results:', sortedResults);
        setAllResults(sortedResults);
      } else {
        setAllResults([]);
      }
    } catch (error) {
      console.error('Error performing search:', error);
      setAllResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!dataLoaded) {
        setLoading(true);
        try {
          await dataService.loadData();
          setDataLoaded(true);
          console.log('Initial data loaded successfully');
        } catch (error) {
          console.error('Error loading initial data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadInitialData();
  }, [dataLoaded]);

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
    if (dataLoaded) {
      console.log('Search triggered with query:', query);
      performSearch(query, filters);
      setCurrentPage(1);
    }
  }, [query, dataLoaded]);

  // Perform search when filters change
  useEffect(() => {
    if (dataLoaded && (query || hasActiveFilters)) {
      console.log('Filter search triggered with filters:', filters);
      performSearch(query, filters);
      setCurrentPage(1);
    }
  }, [filters, dataLoaded]);

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
    currentResults,
    totalResults,
    totalPages,
    currentPage,
    loading,
    hasActiveFilters,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    setFilters,
    setQuery
  };
};
