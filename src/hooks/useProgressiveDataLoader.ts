
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
      console.log('🎧 [PROGRESSIVE-DEBUG] Calling fetch-podcasts edge function...');
      const { data, error } = await supabase.functions.invoke('fetch-podcasts');
      
      if (error) {
        console.error('❌ [PROGRESSIVE-DEBUG] Supabase edge function error:', error);
        throw error;
      }
      
      if (!data.success) {
        console.error('❌ [PROGRESSIVE-DEBUG] Edge function returned error:', data.error);
        throw new Error(data.error);
      }

      console.log(`✅ [PROGRESSIVE-DEBUG] Podcasts fetched: ${data.count} items`);
      console.log(`🔍 [PROGRESSIVE-DEBUG] First podcast from edge function:`, data.podcasts?.[0]);
      setState(prev => {
        const newLoadingStates = { ...prev.loadingStates, podcasts: false };
        const newAllData = [...prev.videos, ...prev.books, ...data.podcasts];
        
        console.log(`🔍 [PROGRESSIVE-DEBUG] Integrating ${data.podcasts.length} podcasts into allData`);
        console.log(`🔍 [PROGRESSIVE-DEBUG] Total items after podcasts: ${newAllData.length}`);
        console.log(`🔍 [PROGRESSIVE-DEBUG] Podcast types in allData:`, newAllData.filter(item => item.type === 'podcast').length);
        
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
    console.log('🚀 [PROGRESSIVE-DEBUG] Progressive data loader: Starting parallel fetch...');
    setState(prev => ({ ...prev, loading: true, dataLoaded: false, loadingProgress: 0 }));
    
    // Log para debug no início
    console.log('🔍 [PROGRESSIVE-DEBUG] Initial state:', {
      videos: 0, books: 0, podcasts: 0, total: 0
    });
    
    // Start all fetches in parallel
    await Promise.all([fetchVideos(), fetchBooks(), fetchPodcasts()]);
    
    setState(prev => {
      console.log('🎉 [PROGRESSIVE-DEBUG] All data loaded! Final counts:', {
        videos: prev.videos.length,
        books: prev.books.length, 
        podcasts: prev.podcasts.length,
        total: prev.allData.length
      });
      
      // Final check - make sure podcasts are in allData
      const podcastsInAllData = prev.allData.filter(item => item.type === 'podcast');
      console.log(`🔍 [PROGRESSIVE-DEBUG] Podcasts in final allData: ${podcastsInAllData.length}`);
      
      return { ...prev, loading: false, dataLoaded: true, loadingProgress: 100 };
    });
    
    console.log('🎉 Progressive data loader: All data loaded successfully');
  }, [fetchVideos, fetchBooks, fetchPodcasts]);

  return {
    ...state,
    loadData,
    forceRefresh: loadData,
  };
};
