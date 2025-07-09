
import { useState, useEffect } from 'react';
import { SearchResult } from '@/types/searchTypes';
import { dataService } from '@/services/dataService';
import { resourceLookupService } from '@/services/resourceLookupService';

export const useDataLoader = () => {
  const [allData, setAllData] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const loadData = async (forceRefresh: boolean = false) => {
    console.log('🔄 useDataLoader: Starting data load, forceRefresh:', forceRefresh);
    setLoading(true);
    
    // Load lookup cache from storage immediately
    if (!forceRefresh) {
      resourceLookupService.loadFromStorage();
    }
    
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
      
      // Populate resource lookup cache by type
      const videos = data.filter(item => item.type === 'video');
      const books = data.filter(item => item.type === 'titulo');
      const podcasts = data.filter(item => item.type === 'podcast');
      
      resourceLookupService.cacheResources(videos, 'video');
      resourceLookupService.cacheResources(books, 'titulo');
      resourceLookupService.cacheResources(podcasts, 'podcast');
      
      console.log('📦 Resource lookup cache populated:', resourceLookupService.getCacheStats());
      
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
