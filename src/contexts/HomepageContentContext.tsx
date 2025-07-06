
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

  console.group('🏠 HomepageContentProvider - Constructor');
  console.log('📊 Provider initialized at:', new Date().toISOString());
  console.log('🔄 Initial state:', { loading, error, isUsingFallback });
  console.groupEnd();

  const loadContent = async () => {
    console.group('🚀 HomepageContentProvider - loadContent');
    console.log('⏰ Load started at:', new Date().toISOString());
    console.log('🔄 Setting loading to true');
    
    setLoading(true);
    setError(null);
    setIsUsingFallback(false);

    try {
      console.log('📡 Calling newApiService.fetchHomepageContent()...');
      const homepageContent = await newApiService.fetchHomepageContent();
      
      console.log('✅ API Response received:', {
        videos: homepageContent.videos.length,
        books: homepageContent.books.length,
        podcasts: homepageContent.podcasts.length,
        totalItems: homepageContent.videos.length + homepageContent.books.length + homepageContent.podcasts.length
      });

      // Always use API data, never fallback to static data
      setContent(homepageContent);
      console.log('✅ Content set successfully from API - NO FALLBACK USED');
      
    } catch (err) {
      console.error('❌ API Error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace'
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load content from API';
      setError(errorMessage);
      
      // DO NOT use fallback data - keep content empty as per user request
      console.log('❌ API failed - keeping content empty (no fallback as requested)');
      setContent({
        videos: [],
        books: [],
        podcasts: []
      });
      
    } finally {
      console.log('🔄 Setting loading to false');
      setLoading(false);
      console.log('⏰ Load completed at:', new Date().toISOString());
      console.groupEnd();
    }
  };

  useEffect(() => {
    console.log('🎯 useEffect triggered - Starting content load');
    loadContent();
  }, []);

  const retry = () => {
    console.log('🔄 Retry requested by user');
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
      }
    });
  }, [loading, error, isUsingFallback, content]);

  return (
    <HomepageContentContext.Provider
      value={{
        content,
        loading,
        error,
        retry,
        isUsingFallback
      }}
    >
      {children}
    </HomepageContentContext.Provider>
  );
};
