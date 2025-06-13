
import { useState, useEffect } from 'react';
import { SearchResult } from '@/types/searchTypes';
import { dataService } from '@/services/dataService';

export const useDataLoader = () => {
  const [allData, setAllData] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!dataLoaded) {
        console.log('🔄 useDataLoader: Starting initial data load...');
        setLoading(true);
        try {
          const data = await dataService.loadData();
          console.log('✅ useDataLoader: Data loaded successfully, count:', data.length);
          
          // Check if we're using fallback data
          const usingFallback = data.length === 3 && data.some(item => item.title === 'Introdução à Libras');
          if (usingFallback) {
            console.warn('⚠️ useDataLoader: DETECTED FALLBACK DATA - Real JSON failed to load!');
          } else {
            console.log('✅ useDataLoader: Real JSON data loaded successfully');
          }
          
          setAllData(data);
          setDataLoaded(true);
        } catch (error) {
          console.error('❌ useDataLoader: Error loading initial data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadInitialData();
  }, [dataLoaded]);

  return {
    allData,
    loading,
    dataLoaded,
    setLoading
  };
};
