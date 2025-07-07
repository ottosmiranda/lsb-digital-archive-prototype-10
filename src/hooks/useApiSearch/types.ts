
import { SearchResult, SearchFilters } from '@/types/searchTypes';

export interface SearchResponse {
  success: boolean;
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
  error?: string;
}

export interface UseApiSearchProps {
  resultsPerPage?: number;
}

export interface CacheItem {
  data: SearchResponse;
  timestamp: number;
}
