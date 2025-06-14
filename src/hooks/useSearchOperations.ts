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
  const authorSearchTimeoutRef = useRef<NodeJS.Timeout>();

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

  const shouldTriggerSearch = useCallback((newFilters: SearchFilters, previousFilters: SearchFilters) => {
    // Check if only author changed - if so, we need special handling
    const onlyAuthorChanged = 
      newFilters.resourceType.length === previousFilters.resourceType.length &&
      newFilters.resourceType.every(item => previousFilters.resourceType.includes(item)) &&
      newFilters.subject.length === previousFilters.subject.length &&
      newFilters.subject.every(item => previousFilters.subject.includes(item)) &&
      newFilters.language.length === previousFilters.language.length &&
      newFilters.language.every(item => previousFilters.language.includes(item)) &&
      newFilters.documentType.length === previousFilters.documentType.length &&
      newFilters.documentType.every(item => previousFilters.documentType.includes(item)) &&
      newFilters.year === previousFilters.year &&
      newFilters.duration === previousFilters.duration &&
      newFilters.author !== previousFilters.author;

    return !onlyAuthorChanged;
  }, []);

  // Initial search & query change trigger
  useEffect(() => {
    if (!dataLoaded) return;
    performSearch(query, filters);
    // eslint-disable-next-line
  }, [query, dataLoaded]);

  // Filter change trigger, with support for authorTyping
  useEffect(() => {
    if (!dataLoaded || (!query && !checkHasActiveFilters(filters))) return;

    const previousFilters = previousFiltersRef.current;
    // Clear any pending author search timeout
    if (authorSearchTimeoutRef.current) {
      clearTimeout(authorSearchTimeoutRef.current);
    }
    // If only author changed...
    if (!shouldTriggerSearch(filters, previousFilters)) {
      authorSearchTimeoutRef.current = setTimeout(() => {
        performSearch(query, filters, { authorTyping: true });
      }, 800);
    } else {
      performSearch(query, filters);
    }

    previousFiltersRef.current = filters;
    // eslint-disable-next-line
  }, [filters, dataLoaded, query]);

  // Sort results when sortBy changes
  useEffect(() => {
    if (searchResults.length === 0) return;
    
    console.log('Sorting results by:', sortBy);
    const sortedResults = sortResults([...searchResults], sortBy, query);
    setSearchResults(sortedResults);
  }, [sortBy, query]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (authorSearchTimeoutRef.current) {
        clearTimeout(authorSearchTimeoutRef.current);
      }
    };
  }, []);

  return {
    searchResults
  };
};
