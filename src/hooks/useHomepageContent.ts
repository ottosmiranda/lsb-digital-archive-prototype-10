
import { useState, useEffect } from 'react';
import { SearchResult } from '@/types/searchTypes';
import { newApiService } from '@/services/newApiService';

interface HomepageContent {
  videos: SearchResult[];
  books: SearchResult[];
  podcasts: SearchResult[];
}

interface UseHomepageContentReturn {
  content: HomepageContent;
  loading: boolean;
  error: string | null;
  retry: () => void;
  isUsingFallback: boolean;
}

export const useHomepageContent = (): UseHomepageContentReturn => {
  const [content, setContent] = useState<HomepageContent>({
    videos: [],
    books: [],
    podcasts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  const loadContent = async () => {
    console.log('🏠 Loading homepage content...');
    setLoading(true);
    setError(null);
    setIsUsingFallback(false);

    try {
      // Try new API first
      const homepageContent = await newApiService.fetchHomepageContent();
      setContent(homepageContent);
      console.log('✅ Homepage content loaded successfully from new API');
    } catch (err) {
      console.error('❌ Failed to load homepage content from new API:', err);
      
      // Set error for user feedback
      setError(err instanceof Error ? err.message : 'Failed to load content');
      
      // Set empty content as fallback
      setContent({
        videos: [],
        books: [],
        podcasts: []
      });
      
      setIsUsingFallback(true);
      console.log('⚠️ Using empty content fallback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const retry = () => {
    console.log('🔄 Retrying homepage content load...');
    loadContent();
  };

  return {
    content,
    loading,
    error,
    retry,
    isUsingFallback
  };
};
