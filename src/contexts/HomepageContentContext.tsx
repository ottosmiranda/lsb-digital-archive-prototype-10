
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SearchResult } from '@/types/searchTypes';
import { newApiService } from '@/services/newApiService';

interface HomepageContent {
  videos: SearchResult[];
  books: SearchResult[];
  podcasts: SearchResult[];
}

interface HomepageContentContextType {
  content: HomepageContent;
  loading: boolean;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [apiStatus, setApiStatus] = useState<any>({});

  console.group('🏠 HomepageContentProvider - ULTRA-FAST Constructor');
  console.log('📊 Provider initialized at:', new Date().toISOString());
  console.log('🔄 Initial state:', { loading, error, isUsingFallback });
  console.groupEnd();

  const loadContent = async () => {
    console.group('🚀 HomepageContentProvider - ULTRA-FAST loadContent');
    console.log('⏰ Load started at:', new Date().toISOString());
    console.log('🔄 Setting loading to true');
    
    setLoading(true);
    setError(null);
    setIsUsingFallback(false);

    try {
      // Get API status for debugging
      const status = newApiService.getStatus();
      setApiStatus(status);
      console.log('📊 API Status:', status);

      console.log('📡 Calling newApiService.fetchHomepageContent() with ultra-fast timeouts...');
      const homepageContent = await newApiService.fetchHomepageContent();
      
      console.log('✅ API Response received:', {
        videos: homepageContent.videos.length,
        books: homepageContent.books.length,
        podcasts: homepageContent.podcasts.length,
        totalItems: homepageContent.videos.length + homepageContent.books.length + homepageContent.podcasts.length
      });

      // Check if we're using Supabase fallback (indicated by specific patterns in the data)
      const usingFallback = homepageContent.videos.some(v => v.id > 1000000) || 
                           homepageContent.books.some(b => b.id > 2000) ||
                           homepageContent.podcasts.some(p => p.id > 1000);
      
      setContent(homepageContent);
      setIsUsingFallback(usingFallback);
      
      if (usingFallback) {
        console.log('🔄 Using Supabase fallback data due to external API issues');
      } else {
        console.log('✅ Content set successfully from external API');
      }
      
    } catch (err) {
      console.error('❌ API Error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace'
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load content';
      setError(errorMessage);
      
      // Try to get some content from Supabase as last resort
      try {
        console.log('🔄 Final attempt: trying Supabase fallback directly...');
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
          console.log('✅ Final fallback successful:', { videos: videos.length, books: books.length, podcasts: podcasts.length });
          setContent({ videos, books, podcasts });
          setIsUsingFallback(true);
          setError(null); // Clear error since we got some data
        } else {
          console.log('❌ Final fallback also failed - no content available');
          setContent({ videos: [], books: [], podcasts: [] });
        }
        
      } catch (fallbackError) {
        console.error('❌ Final fallback failed:', fallbackError);
        setContent({ videos: [], books: [], podcasts: [] });
      }
      
    } finally {
      console.log('🔄 Setting loading to false');
      setLoading(false);
      console.log('⏰ Load completed at:', new Date().toISOString());
      console.groupEnd();
    }
  };

  useEffect(() => {
    console.log('🎯 useEffect triggered - Starting ULTRA-FAST content load');
    loadContent();
  }, []);

  const retry = () => {
    console.log('🔄 Retry requested by user - clearing cache and reloading');
    newApiService.clearCache();
    loadContent();
  };

  // Log context value changes
  useEffect(() => {
    console.log('📊 Context state updated:', {
      loading,
      error,
      isUsingFallback,
      contentSummary: {
        videos: content.videos.length,
        books: content.books.length,
        podcasts: content.podcasts.length
      },
      apiStatus
    });
  }, [loading, error, isUsingFallback, content, apiStatus]);

  return (
    <HomepageContentContext.Provider
      value={{
        content,
        loading,
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
