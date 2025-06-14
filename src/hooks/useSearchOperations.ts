
import { useState, useEffect, useRef } from 'react';
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

  const performSearch = async (searchQuery: string, currentFilters: SearchFilters) => {
    setLoading(true);
    console.log('Performing search with:', { searchQuery, currentFilters });
    
    try {
      if (searchQuery || checkHasActiveFilters(currentFilters)) {
        const filteredResults = filterResults(allData, searchQuery, currentFilters);
        const sortedResults = sortResults(filteredResults, sortBy, searchQuery);
        console.log('Search results:', sortedResults);
        setSearchResults(sortedResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error performing search:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const shouldTriggerSearch = (newFilters: SearchFilters, previousFilters: SearchFilters) => {
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
  };

  // Perform search when query changes or on initial load
  useEffect(() => {
    if (dataLoaded) {
      console.log('Search triggered with query:', query);
      performSearch(query, filters);
    }
  }, [query, dataLoaded, allData]);

  // Perform search when filters change (with special handling for author)
  useEffect(() => {
    if (dataLoaded && (query || checkHasActiveFilters(filters))) {
      const previousFilters = previousFiltersRef.current;
      
      // Clear any pending author search timeout
      if (authorSearchTimeoutRef.current) {
        clearTimeout(authorSearchTimeoutRef.current);
      }

      // Check if this is an author-only change
      if (!shouldTriggerSearch(filters, previousFilters)) {
        console.log('Author typing detected, delaying search...');
        // For author changes, add a longer delay to prevent search during typing
        authorSearchTimeoutRef.current = setTimeout(() => {
          console.log('Author search triggered after delay:', filters.author);
          performSearch(query, filters);
        }, 800); // Longer delay for author typing
      } else {
        console.log('Non-author filter search triggered:', filters);
        performSearch(query, filters);
      }
    }
    
    previousFiltersRef.current = filters;
  }, [filters, dataLoaded, allData]);

  // Sort results when sortBy changes
  useEffect(() => {
    if (searchResults.length > 0) {
      console.log('Sorting results by:', sortBy);
      const sortedResults = sortResults([...searchResults], sortBy, query);
      setSearchResults(sortedResults);
    }
  }, [sortBy]);

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
