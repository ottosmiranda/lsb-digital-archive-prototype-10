
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
        setLoading(true);
        try {
          const data = await dataService.loadData();
          setAllData(data);
          setDataLoaded(true);
          console.log('Initial data loaded successfully');
        } catch (error) {
          console.error('Error loading initial data:', error);
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
