
import { useState, useEffect, useCallback } from 'react';
import { searchAnalytics } from '@/services/searchAnalytics';

export const useSearchAnalytics = () => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);

  const refreshData = useCallback(() => {
    setRecentSearches(searchAnalytics.getRecentSearches());
    setTrendingSearches(searchAnalytics.getTrendingSearches());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const trackSearch = useCallback((query: string) => {
    searchAnalytics.trackSearch(query);
    refreshData();
  }, [refreshData]);

  const clearHistory = useCallback(() => {
    searchAnalytics.clearHistory();
    refreshData();
  }, [refreshData]);

  const getSearchCount = useCallback((query: string) => {
    return searchAnalytics.getSearchCount(query);
  }, []);

  return {
    recentSearches,
    trendingSearches,
    trackSearch,
    clearHistory,
    getSearchCount,
    refreshData
  };
};
