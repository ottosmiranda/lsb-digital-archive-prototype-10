
import { useState, useMemo } from 'react';
import { SearchResult, SearchFilters } from '@/types/searchTypes';
import { checkHasActiveFilters } from '@/utils/searchUtils';

interface SearchResponse {
  results: SearchResult[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  searchInfo: {
    query: string;
    appliedFilters: SearchFilters;
    sortBy: string;
  };
}

const createEmptyResponse = (filters: SearchFilters, sortBy: string, currentPage: number = 1): SearchResponse => ({
  results: [],
  pagination: {
    currentPage,
    totalPages: 0,
    totalResults: 0,
    hasNextPage: false,
    hasPreviousPage: false
  },
  searchInfo: {
    query: '',
    appliedFilters: filters,
    sortBy
  }
});

export const useSearchResponse = () => {
  const [searchResponse, setSearchResponse] = useState<SearchResponse>(
    createEmptyResponse({
      resourceType: [],
      subject: [],
      author: '',
      year: '',
      duration: '',
      language: [],
      documentType: []
    }, 'relevance')
  );

  const [usingFallback, setUsingFallback] = useState(false);

  const hasActiveFilters = useMemo((): boolean => {
    return checkHasActiveFilters(searchResponse.searchInfo.appliedFilters);
  }, [searchResponse.searchInfo.appliedFilters]);

  const updateSearchResponse = (response: SearchResponse) => {
    setSearchResponse(response);
  };

  const clearResults = (filters: SearchFilters, sortBy: string, currentPage: number = 1) => {
    setSearchResponse(createEmptyResponse(filters, sortBy, currentPage));
  };

  return {
    searchResponse,
    usingFallback,
    hasActiveFilters,
    updateSearchResponse,
    clearResults,
    setUsingFallback
  };
};
