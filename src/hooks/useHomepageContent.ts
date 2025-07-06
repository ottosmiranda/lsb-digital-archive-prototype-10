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
}

export const useHomepageContent = (): UseHomepageContentReturn => {
  const [content, setContent] = useState<HomepageContent>({
    videos: [],
    books: [],
    podcasts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContent = async () => {
    console.log('🏠 Loading homepage content...');
    setLoading(true);
    setError(null);

    try {
      const homepageContent = await newApiService.fetchHomepageContent();
      setContent(homepageContent);
      console.log('✅ Homepage content loaded successfully');
    } catch (err) {
      console.error('❌ Failed to load homepage content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
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
    retry
  };
};