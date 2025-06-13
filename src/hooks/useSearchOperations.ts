
import { useState, useEffect } from 'react';
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

  // Perform search when query changes or on initial load
  useEffect(() => {
    if (dataLoaded) {
      console.log('Search triggered with query:', query);
      performSearch(query, filters);
    }
  }, [query, dataLoaded, allData]);

  // Perform search when filters change
  useEffect(() => {
    if (dataLoaded && (query || checkHasActiveFilters(filters))) {
      console.log('Filter search triggered with filters:', filters);
      performSearch(query, filters);
    }
  }, [filters, dataLoaded, allData]);

  // Sort results when sortBy changes
  useEffect(() => {
    if (searchResults.length > 0) {
      console.log('Sorting results by:', sortBy);
      const sortedResults = sortResults([...searchResults], sortBy, query);
      setSearchResults(sortedResults);
    }
  }, [sortBy]);

  return {
    searchResults
  };
};
