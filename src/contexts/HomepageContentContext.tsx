import React, { createContext, useContext, useEffect, useState } from 'react';
import { SearchResult } from '@/types/searchTypes';
import { newApiService } from '@/services/newApiService';

interface HomepageContent {
  videos: SearchResult[];
  books: SearchResult[];
  podcasts: SearchResult[];
}

interface ContentCounts {
  videos: number;
  books: number;
  podcasts: number;
}

interface HomepageContentContextType {
  content: HomepageContent;
  contentCounts: ContentCounts;
  loading: boolean;
  countsLoading: boolean;
  error: string | null;
  retry: () => void;
  isUsingFallback: boolean;
  apiStatus: any; // For debugging
}

const HomepageContentContext = createContext<HomepageContentContextType | undefined>(undefined);

export const useHomepageContentContext = () => {
  const context = useContext(HomepageContentContext);
  if (context === undefined) {
    throw new Error('useHomepageContentContext must be used within a HomepageContentProvider');
  }
  return context;
};

interface HomepageContentProviderProps {
  children: React.ReactNode;
}

export const HomepageContentProvider: React.FC<HomepageContentProviderProps> = ({ children }) => {
  const [content, setContent] = useState<HomepageContent>({
    videos: [],
    books: [],
    podcasts: []
  });
  const [contentCounts, setContentCounts] = useState<ContentCounts>({
    videos: 0,
    books: 0,
    podcasts: 0
  });
  const [loading, setLoading] = useState(true);
  const [countsLoading, setCountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [apiStatus, setApiStatus] = useState<any>({});

  console.group('🏠 HomepageContentProvider - ENHANCED Constructor');
  console.log('📊 Provider initialized at:', new Date().toISOString());
  console.log('🔄 Initial state:', { loading, countsLoading, error, isUsingFallback });
  console.groupEnd();

  const loadContentCounts = async () => {
    console.group('📊 ENHANCED LOAD CONTENT COUNTS - Starting with timeout protection');
    console.log('⏰ Counts load started at:', new Date().toISOString());
    
    setCountsLoading(true);
    
    // Add maximum timeout of 15 seconds for counts
    const countsTimeout = 15000;
    const timeoutPromise = new Promise<ContentCounts>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Content counts timeout after ${countsTimeout}ms`));
      }, countsTimeout);
    });
    
    try {
      const countsPromise = newApiService.fetchContentCounts();
      const counts = await Promise.race([countsPromise, timeoutPromise]);
      
      setContentCounts(counts);
      console.log('✅ Content counts loaded successfully:', counts);
      
    } catch (err) {
      console.error('❌ Failed to load content counts:', err);
      
      // Emergency fallback: set reasonable defaults to avoid eternal loading
      const emergencyCounts = { videos: 50, books: 100, podcasts: 500 };
      setContentCounts(emergencyCounts);
      console.log('🆘 Using emergency counts:', emergencyCounts);
      
    } finally {
      setCountsLoading(false);
      console.log('📊 Counts loading finished at:', new Date().toISOString());
      console.groupEnd();
    }
  };

  const loadContent = async () => {
    console.group('🚀 DIAGNOSTIC loadContent - Phase 1: Starting data load with detailed tracking');
    console.log('⏰ Load started at:', new Date().toISOString());
    console.log('🔄 Setting loading state to true');
    
    setLoading(true);
    setError(null);
    setIsUsingFallback(false);

    try {
      // FASE 1: Get API status for debugging dashboard
      const status = newApiService.getStatus();
      setApiStatus(status);
      console.group('📊 DIAGNOSTIC API STATUS DASHBOARD');
      console.log('Health Status:', status.healthStatus.toUpperCase());
      console.log('Circuit Breaker:', status.circuitBreaker.breakerOpen ? 'OPEN' : 'CLOSED');
      console.log('Cache Size:', status.cacheSize);
      console.log('Active Requests:', status.activeRequests);
      console.groupEnd();

      console.log('📡 PHASE 1: Calling newApiService.fetchHomepageContent() with diagnostic timeouts...');
      const startTime = Date.now();
      
      const homepageContent = await newApiService.fetchHomepageContent();
      
      const loadTime = Date.now() - startTime;
      console.log('✅ PHASE 1: API Response received in', loadTime, 'ms:', {
        videos: homepageContent.videos.length,
        books: homepageContent.books.length,
        podcasts: homepageContent.podcasts.length,
        totalItems: homepageContent.videos.length + homepageContent.books.length + homepageContent.podcasts.length,
        loadTimeMs: loadTime
      });

      // FASE 1: Detailed data validation
      console.group('🔍 PHASE 1: Data validation and source detection');
      console.log('Videos sample:', homepageContent.videos.slice(0, 2));
      console.log('Books sample:', homepageContent.books.slice(0, 2));
      console.log('Podcasts sample:', homepageContent.podcasts.slice(0, 2));
      
      // Check if we're using Supabase fallback (indicated by specific patterns in the data)
      const usingFallback = homepageContent.videos.some(v => v.id > 1000000) || 
                           homepageContent.books.some(b => b.id > 2000) ||
                           homepageContent.podcasts.some(p => p.id > 1000);
      
      console.log('Data source:', usingFallback ? 'SUPABASE FALLBACK' : 'EXTERNAL API');
      console.groupEnd();
      
      // FASE 2: Progressive data setting with detailed logging
      console.log('🔄 PHASE 2: Setting content in React state...');
      setContent(homepageContent);
      setIsUsingFallback(usingFallback);
      
      console.log('✅ PHASE 2: Content state updated successfully');
      console.log('📊 PHASE 2: Final content state:', {
        videos: homepageContent.videos.length,
        books: homepageContent.books.length,
        podcasts: homepageContent.podcasts.length,
        isUsingFallback: usingFallback
      });
      
    } catch (err) {
      console.error('❌ PHASE 1: Critical error in loadContent:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace',
        timestamp: new Date().toISOString()
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load content';
      setError(errorMessage);
      
      // FASE 1: Emergency fallback attempt
      try {
        console.log('🆘 EMERGENCY: Attempting direct Supabase fallback...');
        const { supabase } = await import('@/integrations/supabase/client');
        
        const [videosResult, booksResult, podcastsResult] = await Promise.allSettled([
          supabase.functions.invoke('fetch-videos'),
          supabase.functions.invoke('fetch-books'),
          supabase.functions.invoke('fetch-podcasts')
        ]);

        const videos = videosResult.status === 'fulfilled' && videosResult.value.data?.success 
          ? videosResult.value.data.videos.slice(0, 6) : [];
        const books = booksResult.status === 'fulfilled' && booksResult.value.data?.success 
          ? booksResult.value.data.books.slice(0, 6) : [];
        const podcasts = podcastsResult.status === 'fulfilled' && podcastsResult.value.data?.success 
          ? podcastsResult.value.data.podcasts.slice(0, 6) : [];

        const totalFallbackItems = videos.length + books.length + podcasts.length;
        
        if (totalFallbackItems > 0) {
          console.log('✅ EMERGENCY: Fallback successful:', { videos: videos.length, books: books.length, podcasts: podcasts.length });
          setContent({ videos, books, podcasts });
          setIsUsingFallback(true);
          setError(null); // Clear error since we got some data
        } else {
          console.log('❌ EMERGENCY: Fallback also failed - no content available');
          setContent({ videos: [], books: [], podcasts: [] });
        }
        
      } catch (fallbackError) {
        console.error('❌ EMERGENCY: Final fallback failed:', fallbackError);
        setContent({ videos: [], books: [], podcasts: [] });
      }
      
    } finally {
      console.log('🔄 PHASE 2: Setting loading to false');
      setLoading(false);
      console.log('⏰ DIAGNOSTIC: Load completed at:', new Date().toISOString());
      console.groupEnd();
    }
  };

  useEffect(() => {
    console.log('🎯 useEffect triggered - Starting ENHANCED content and counts load');
    
    // Load content and counts in parallel with better error handling
    Promise.allSettled([
      loadContent(),
      loadContentCounts()
    ]).then((results) => {
      console.log('🏁 All loading operations completed:', {
        contentResult: results[0].status,
        countsResult: results[1].status
      });
    });
  }, []);

  const retry = () => {
    console.log('🔄 Enhanced retry requested by user - clearing cache and reloading');
    newApiService.clearCache();
    
    // Reset states
    setError(null);
    setCountsLoading(true);
    setLoading(true);
    
    // Retry both operations
    Promise.allSettled([
      loadContent(),
      loadContentCounts()
    ]);
  };

  // Log context value changes
  useEffect(() => {
    console.log('📊 Context state updated:', {
      loading,
      countsLoading,
      error,
      isUsingFallback,
      contentSummary: {
        videos: content.videos.length,
        books: content.books.length,
        podcasts: content.podcasts.length
      },
      contentCounts,
      apiStatus
    });
  }, [loading, countsLoading, error, isUsingFallback, content, contentCounts, apiStatus]);

  return (
    <HomepageContentContext.Provider
      value={{
        content,
        contentCounts,
        loading,
        countsLoading,
        error,
        retry,
        isUsingFallback,
        apiStatus
      }}
    >
      {children}
    </HomepageContentContext.Provider>
  );
};
