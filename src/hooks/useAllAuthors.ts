
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Author {
  name: string;
  count: number;
  types: string[];
}

interface UseAllAuthorsResult {
  authors: Author[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAllAuthors = (): UseAllAuthorsResult => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllAuthors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('👥 Fetching all authors via Supabase function');
      
      const { data, error: funcError } = await supabase.functions.invoke('search-content', {
        body: { getAllAuthors: true }
      });

      if (funcError) {
        throw new Error(funcError.message || 'Failed to fetch authors');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch authors');
      }

      console.log('👥 All authors fetched successfully:', data.authors.length);
      setAuthors(data.authors || []);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch all authors';
      console.error('❌ Error fetching all authors:', errorMessage);
      setError(errorMessage);
      setAuthors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllAuthors();
  }, [fetchAllAuthors]);

  return {
    authors,
    loading,
    error,
    refetch: fetchAllAuthors
  };
};
