// This file is deprecated in favor of useInfiniteContentLoader
// Keeping for backward compatibility temporarily

import { useInfiniteContentLoader } from './useInfiniteContentLoader';

export const useProgressiveDataLoader = () => {
  console.warn('useProgressiveDataLoader is deprecated. Use useInfiniteContentLoader instead.');
  
  const infiniteLoader = useInfiniteContentLoader();
  
  return {
    allData: infiniteLoader.getAllItems(),
    loading: infiniteLoader.loading,
    dataLoaded: !infiniteLoader.loading,
    usingFallback: false,
    setLoading: () => {}, // No-op for compatibility
    forceRefresh: () => infiniteLoader.clearCache()
  };
};
