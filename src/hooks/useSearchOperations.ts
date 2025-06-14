
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

  // The main performSearch function, can optionally skip loading for author typing
  const performSearch = useCallback(
    async (
      searchQuery: string,
      currentFilters: SearchFilters,
      options: FilterChangeOptions = {}
    ) => {
      // Skip loading if only typing author (prevents focus jump)
      if (!options.authorTyping) setLoading(true);
      try {
        if (searchQuery || checkHasActiveFilters(currentFilters)) {
          const filteredResults = filterResults(allData, searchQuery, currentFilters);
          const sortedResults = sortResults(filteredResults, sortBy, searchQuery);
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
    [allData, sortBy, setLoading]
  );

  // Initial search & query change trigger
  useEffect(() => {
    if (!dataLoaded) return;
    performSearch(query, filters);
    // eslint-disable-next-line
  }, [query, dataLoaded]);

  // Filter change trigger
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

    // The component handles debouncing, so we just perform the search,
    // telling it if it's an author-only change to avoid the loading spinner.
    performSearch(query, filters, { authorTyping: onlyAuthorChanged });

    previousFiltersRef.current = filters;
    // eslint-disable-next-line
  }, [filters, performSearch, query, dataLoaded]);

  // Sort results when sortBy changes
  useEffect(() => {
    if (searchResults.length === 0) return;
    
    const sortedResults = sortResults([...searchResults], sortBy, query);
    setSearchResults(sortedResults);
    // eslint-disable-next-line
  }, [sortBy, query]);
  
  return {
    searchResults
  };
};
