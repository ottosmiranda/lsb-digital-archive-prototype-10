
import { useState, useEffect, useRef, useCallback } from 'react';
import { SearchResult, SearchFilters } from '@/types/searchTypes';
import { filterResults, sortResults, checkHasActiveFilters } from '@/utils/searchUtils';

interface UseSearchOperationsProps {
  allData: SearchResult[];
  query: string;
  filters: SearchFilters;
  sortBy: string;
  dataLoaded: boolean;
  setLoading: (loading: boolean) => void;
}

/**
 * Additional options object for onFiltersChange; currently only authorTyping is supported.
 */
interface FilterChangeOptions {
  authorTyping?: boolean;
}

export const useSearchOperations = ({
  allData,
  query,
  filters,
  sortBy,
  dataLoaded,
  setLoading
}: UseSearchOperationsProps) => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const previousFiltersRef = useRef<SearchFilters>(filters);

  // The main performSearch function
  const performSearch = useCallback(
    async (
      searchQuery: string,
      currentFilters: SearchFilters,
      effectiveSortBy: string,
      options: FilterChangeOptions = {}
    ) => {
      if (!options.authorTyping) setLoading(true);
      try {
        const hasActiveFilters = checkHasActiveFilters(currentFilters);
        const hasNonDefaultSorting = effectiveSortBy && effectiveSortBy !== 'relevance';

        // Always apply sorting if specified, even if no query/filters
        if (searchQuery || hasActiveFilters || hasNonDefaultSorting) {
          // If there's a query or filters, filter; otherwise, show all
          const filteredResults = (searchQuery || hasActiveFilters)
            ? filterResults(allData, searchQuery, currentFilters)
            : allData;

          const sortedResults = sortResults(filteredResults, effectiveSortBy, searchQuery);
          setSearchResults(sortedResults);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        setSearchResults([]);
      } finally {
        if (!options.authorTyping) setLoading(false);
      }
    },
    [allData, setLoading]
  );

  // Always update results when query, filters, sortBy, or dataLoaded changes
  useEffect(() => {
    if (!dataLoaded) return;
    
    // Debug log para verificar os dados
    console.log('🔍 [SEARCH-DEBUG] Search operations running with:', {
      totalData: allData.length,
      query: query,
      filters: filters,
      sortBy: sortBy
    });
    
    // Contar por tipo
    const dataByType = allData.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('🔍 [SEARCH-DEBUG] Data by type:', dataByType);
    
    // Verificar especificamente os podcasts
    const podcasts = allData.filter(item => item.type === 'podcast');
    console.log('🔍 [SEARCH-DEBUG] Podcasts found in allData:', podcasts.length);
    if (podcasts.length > 0) {
      console.log('🔍 [SEARCH-DEBUG] First podcast sample:', podcasts[0]);
    }
    
    performSearch(query, filters, sortBy);
    // eslint-disable-next-line
  }, [query, filters, sortBy, dataLoaded, performSearch]);

  // Filter change tracking (for authorTyping spinner-avoidance UX)
  useEffect(() => {
    if (!dataLoaded) return;

    // Avoid running if filters are the same object reference
    if (filters === previousFiltersRef.current) return;

    const previousFilters = previousFiltersRef.current;
    const areArraysEqual = (a: string[] = [], b: string[] = []) => {
      if (a.length !== b.length) return false;
      return [...a].sort().join(',') === [...b].sort().join(',');
    };

    const onlyAuthorChanged = 
      filters.author !== previousFilters.author &&
      areArraysEqual(filters.resourceType, previousFilters.resourceType) &&
      areArraysEqual(filters.subject, previousFilters.subject) &&
      areArraysEqual(filters.language, previousFilters.language) &&
      areArraysEqual(filters.documentType, previousFilters.documentType) &&
      filters.year === previousFilters.year &&
      filters.duration === previousFilters.duration;

    performSearch(query, filters, sortBy, { authorTyping: onlyAuthorChanged });

    previousFiltersRef.current = filters;
    // eslint-disable-next-line
  }, [filters, dataLoaded, query, sortBy, performSearch]);

  // -- REMOVED: the effect that only sorted existing state, which could cause stale/empty state

  return {
    searchResults
  };
};
