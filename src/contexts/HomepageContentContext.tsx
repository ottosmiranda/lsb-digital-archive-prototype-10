
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

  const loadContent = async () => {
    console.log('🏠 HomepageContentProvider: Loading homepage content...');
    setLoading(true);
    setError(null);
    setIsUsingFallback(false);

    try {
      const homepageContent = await newApiService.fetchHomepageContent();
      setContent(homepageContent);
      console.log('✅ HomepageContentProvider: Content loaded successfully');
    } catch (err) {
      console.error('❌ HomepageContentProvider: Failed to load content:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load content';
      setError(errorMessage);
      
      // Set empty content as fallback
      setContent({
        videos: [],
        books: [],
        podcasts: []
      });
      
      setIsUsingFallback(true);
      console.log('⚠️ HomepageContentProvider: Using empty content fallback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const retry = () => {
    console.log('🔄 HomepageContentProvider: Retrying content load...');
    loadContent();
  };

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
