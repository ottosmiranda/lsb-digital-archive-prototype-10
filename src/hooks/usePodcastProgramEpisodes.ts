import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PodcastEpisode {
  id: number;
  title: string;
  description: string;
  duration?: string;
  thumbnail?: string;
  embedUrl?: string;
  year: number;
  author: string;
  subject: string;
  podcast_titulo?: string;
  episodio_id?: string;
}

interface ProgramInfo {
  title: string;
  publisher: string;
  thumbnail?: string;
  description: string;
}

interface UsePodcastProgramEpisodesReturn {
  episodes: PodcastEpisode[];
  programInfo: ProgramInfo | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  totalEpisodes: number;
  loadMoreEpisodes: () => void;
  resetEpisodes: () => void;
}

export const usePodcastProgramEpisodes = (
  podcastTitulo: string,
  initialPageSize: number = 10
): UsePodcastProgramEpisodesReturn => {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [programInfo, setProgramInfo] = useState<ProgramInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchEpisodes = useCallback(async (page: number, isLoadMore: boolean = false) => {
    if (!podcastTitulo) return;

    console.log(`🎧 Fetching episodes for "${podcastTitulo}", page ${page}`);
    
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('fetch-podcasts', {
        body: {
          page,
          limit: initialPageSize,
          podcast_titulo: podcastTitulo
        }
      });

      if (fetchError) {
        throw new Error(`Erro ao buscar episódios: ${fetchError.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido ao buscar episódios');
      }

      const newEpisodes = data.podcasts || [];
      
      if (isLoadMore) {
        setEpisodes(prev => [...prev, ...newEpisodes]);
      } else {
        setEpisodes(newEpisodes);
        // Set program info only on first load
        if (data.programInfo) {
          setProgramInfo(data.programInfo);
        }
      }

      setTotalEpisodes(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setCurrentPage(page);

      console.log(`✅ Loaded ${newEpisodes.length} episodes for "${podcastTitulo}"`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar episódios';
      console.error('❌ Error fetching podcast episodes:', errorMessage);
      setError(errorMessage);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [podcastTitulo, initialPageSize]);

  const loadMoreEpisodes = useCallback(() => {
    if (loadingMore || currentPage >= totalPages) return;
    
    const nextPage = currentPage + 1;
    fetchEpisodes(nextPage, true);
  }, [currentPage, totalPages, loadingMore, fetchEpisodes]);

  const resetEpisodes = useCallback(() => {
    setEpisodes([]);
    setProgramInfo(null);
    setCurrentPage(1);
    setError(null);
    if (podcastTitulo) {
      fetchEpisodes(1, false);
    }
  }, [podcastTitulo, fetchEpisodes]);

  // Initial load
  React.useEffect(() => {
    if (podcastTitulo) {
      fetchEpisodes(1, false);
    }
  }, [podcastTitulo, fetchEpisodes]);

  const hasMore = currentPage < totalPages;

  return {
    episodes,
    programInfo,
    loading,
    loadingMore,
    error,
    hasMore,
    totalEpisodes,
    loadMoreEpisodes,
    resetEpisodes
  };
};
