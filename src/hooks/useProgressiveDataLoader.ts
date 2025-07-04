
import { useState, useEffect, useCallback } from 'react';
import { SearchResult } from '@/types/searchTypes';
import { supabase } from '@/integrations/supabase/client';

interface ProgressiveLoadingState {
  allData: SearchResult[];
  videos: SearchResult[];
  books: SearchResult[];
  podcasts: SearchResult[];
  loading: boolean;
  loadingStates: {
    videos: boolean;
    books: boolean;
    podcasts: boolean;
  };
  loadingProgress: number;
  dataLoaded: boolean;
}

export const useProgressiveDataLoader = () => {
  const [state, setState] = useState<ProgressiveLoadingState>({
    allData: [],
    videos: [],
    books: [],
    podcasts: [],
    loading: false,
    loadingStates: {
      videos: false,
      books: false,
      podcasts: false,
    },
    loadingProgress: 0,
    dataLoaded: false,
  });

  // Calculate progress based on completed loads
  const updateProgress = useCallback((loadingStates: { videos: boolean; books: boolean; podcasts: boolean }) => {
    const completedCount = Object.values(loadingStates).filter(loading => !loading).length;
    const progress = (completedCount / 3) * 100;
    console.log(`📊 Progress update: ${completedCount}/3 completed (${progress}%)`);
    return progress;
  }, []);

  const fetchVideos = useCallback(async () => {
    console.log('🎬 Starting videos fetch...');
    setState(prev => ({ 
      ...prev, 
      loadingStates: { ...prev.loadingStates, videos: true } 
    }));

    try {
      const { data, error } = await supabase.functions.invoke('fetch-videos');
      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      console.log(`✅ Videos fetched: ${data.count} items`);
      setState(prev => {
        const newLoadingStates = { ...prev.loadingStates, videos: false };
        const newAllData = [...prev.books, ...prev.podcasts, ...data.videos];
        return {
          ...prev,
          videos: data.videos,
          allData: newAllData,
          loadingStates: newLoadingStates,
          loadingProgress: updateProgress(newLoadingStates)
        };
      });
    } catch (error) {
      console.error('❌ Failed to fetch videos:', error);
      setState(prev => {
        const newLoadingStates = { ...prev.loadingStates, videos: false };
        return { 
          ...prev, 
          loadingStates: newLoadingStates,
          loadingProgress: updateProgress(newLoadingStates)
        };
      });
    }
  }, [updateProgress]);

  const fetchBooks = useCallback(async () => {
    console.log('📚 Starting books fetch...');
    setState(prev => ({ 
      ...prev, 
      loadingStates: { ...prev.loadingStates, books: true } 
    }));

    try {
      const { data, error } = await supabase.functions.invoke('fetch-books');
      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      console.log(`✅ Books fetched: ${data.count} items`);
      setState(prev => {
        const newLoadingStates = { ...prev.loadingStates, books: false };
        const newAllData = [...prev.videos, ...prev.podcasts, ...data.books];
        return {
          ...prev,
          books: data.books,
          allData: newAllData,
          loadingStates: newLoadingStates,
          loadingProgress: updateProgress(newLoadingStates)
        };
      });
    } catch (error) {
      console.error('❌ Failed to fetch books:', error);
      setState(prev => {
        const newLoadingStates = { ...prev.loadingStates, books: false };
        return { 
          ...prev, 
          loadingStates: newLoadingStates,
          loadingProgress: updateProgress(newLoadingStates)
        };
      });
    }
  }, [updateProgress]);

  const fetchPodcasts = useCallback(async () => {
    console.log('🎧 Starting podcasts fetch...');
    setState(prev => ({ 
      ...prev, 
      loadingStates: { ...prev.loadingStates, podcasts: true } 
    }));

    try {
      const { data, error } = await supabase.functions.invoke('fetch-podcasts');
      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      console.log(`✅ Podcasts fetched: ${data.count} items`);
      setState(prev => {
        const newLoadingStates = { ...prev.loadingStates, podcasts: false };
        const newAllData = [...prev.videos, ...prev.books, ...data.podcasts];
        return {
          ...prev,
          podcasts: data.podcasts,
          allData: newAllData,
          loadingStates: newLoadingStates,
          loadingProgress: updateProgress(newLoadingStates)
        };
      });
    } catch (error) {
      console.error('❌ Failed to fetch podcasts:', error);
      setState(prev => {
        const newLoadingStates = { ...prev.loadingStates, podcasts: false };
        return { 
          ...prev, 
          loadingStates: newLoadingStates,
          loadingProgress: updateProgress(newLoadingStates)
        };
      });
    }
  }, [updateProgress]);

  const loadData = useCallback(async () => {
    console.log('🚀 Progressive data loader: Starting parallel fetch...');
    setState(prev => ({ ...prev, loading: true, dataLoaded: false, loadingProgress: 0 }));
    
    // Start all fetches in parallel
    await Promise.all([fetchVideos(), fetchBooks(), fetchPodcasts()]);
    
    setState(prev => ({ ...prev, loading: false, dataLoaded: true, loadingProgress: 100 }));
    console.log('🎉 Progressive data loader: All data loaded successfully');
  }, [fetchVideos, fetchBooks, fetchPodcasts]);

  return {
    ...state,
    loadData,
    forceRefresh: loadData,
  };
};
