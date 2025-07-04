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

  const updateProgress = useCallback(() => {
    const completedCount = Object.values(state.loadingStates).filter(loading => !loading).length;
    const progress = (completedCount / 3) * 100;
    setState(prev => ({ ...prev, loadingProgress: progress }));
  }, [state.loadingStates]);

  const fetchVideos = useCallback(async () => {
    setState(prev => ({ 
      ...prev, 
      loadingStates: { ...prev.loadingStates, videos: true } 
    }));

    try {
      const { data, error } = await supabase.functions.invoke('fetch-videos');
      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setState(prev => ({
        ...prev,
        videos: data.videos,
        allData: [...prev.books, ...prev.podcasts, ...data.videos],
        loadingStates: { ...prev.loadingStates, videos: false }
      }));
    } catch (error) {
      console.error('❌ Failed to fetch videos:', error);
      setState(prev => ({ 
        ...prev, 
        loadingStates: { ...prev.loadingStates, videos: false } 
      }));
    }
  }, []);

  const fetchBooks = useCallback(async () => {
    setState(prev => ({ 
      ...prev, 
      loadingStates: { ...prev.loadingStates, books: true } 
    }));

    try {
      const { data, error } = await supabase.functions.invoke('fetch-books');
      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setState(prev => ({
        ...prev,
        books: data.books,
        allData: [...prev.videos, ...prev.podcasts, ...data.books],
        loadingStates: { ...prev.loadingStates, books: false }
      }));
    } catch (error) {
      console.error('❌ Failed to fetch books:', error);
      setState(prev => ({ 
        ...prev, 
        loadingStates: { ...prev.loadingStates, books: false } 
      }));
    }
  }, []);

  const fetchPodcasts = useCallback(async () => {
    setState(prev => ({ 
      ...prev, 
      loadingStates: { ...prev.loadingStates, podcasts: true } 
    }));

    try {
      const { data, error } = await supabase.functions.invoke('fetch-podcasts');
      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setState(prev => ({
        ...prev,
        podcasts: data.podcasts,
        allData: [...prev.videos, ...prev.books, ...data.podcasts],
        loadingStates: { ...prev.loadingStates, podcasts: false }
      }));
    } catch (error) {
      console.error('❌ Failed to fetch podcasts:', error);
      setState(prev => ({ 
        ...prev, 
        loadingStates: { ...prev.loadingStates, podcasts: false } 
      }));
    }
  }, []);

  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, dataLoaded: false }));
    
    // Start all fetches in parallel
    await Promise.all([fetchVideos(), fetchBooks(), fetchPodcasts()]);
    
    setState(prev => ({ ...prev, loading: false, dataLoaded: true }));
  }, [fetchVideos, fetchBooks, fetchPodcasts]);

  useEffect(() => {
    updateProgress();
  }, [updateProgress]);

  return {
    ...state,
    loadData,
    forceRefresh: loadData,
  };
};