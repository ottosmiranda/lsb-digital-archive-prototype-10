
import { useState, useEffect } from 'react';
import { SearchResult } from '@/types/searchTypes';
import { dataService } from '@/services/dataService';

export const useDataLoader = () => {
  const [allData, setAllData] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const loadData = async (forceRefresh: boolean = false) => {
    console.log('🔄 useDataLoader: Starting data load, forceRefresh:', forceRefresh);
    setLoading(true);
    try {
      const data = await dataService.loadData(forceRefresh);
      console.log('✅ useDataLoader: Data loaded successfully, count:', data.length);
      
      // Check if we're using fallback data
      const fallbackDetected = dataService.isUsingFallbackData();
      setUsingFallback(fallbackDetected);
      
      if (fallbackDetected) {
        console.warn('⚠️ useDataLoader: DETECTED FALLBACK DATA - Real JSON failed to load!');
      } else {
        console.log('✅ useDataLoader: Real JSON data loaded successfully');
      }
      
      setAllData(data);
      setDataLoaded(true);
    } catch (error) {
      console.error('❌ useDataLoader: Error loading data:', error);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dataLoaded) {
      loadData();
    }
  }, [dataLoaded]);

  const forceRefresh = async () => {
    console.log('🔄 useDataLoader: Force refresh triggered');
    setDataLoaded(false);
    await loadData(true);
  };

  return {
    allData,
    loading,
    dataLoaded,
    usingFallback,
    setLoading,
    forceRefresh
  };
};
