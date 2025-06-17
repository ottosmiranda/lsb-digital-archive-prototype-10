
import { useState, useEffect, useCallback } from 'react';
import { useSpotifyAuth } from './useSpotifyAuth';

interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  duration_ms: number;
  release_date: string;
  external_urls: {
    spotify: string;
  };
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  audio_preview_url?: string;
}

interface SpotifyEpisodesResponse {
  items: SpotifyEpisode[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
}

export const useSpotifyEpisodes = (embedUrl?: string, initialLimit = 10) => {
  const { token, isConfigured, authStatus } = useSpotifyAuth();
  const [episodes, setEpisodes] = useState<SpotifyEpisode[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  const extractShowId = (url: string): string | null => {
    const patterns = [
      /\/show\/([a-zA-Z0-9]+)/,
      /\/embed\/show\/([a-zA-Z0-9]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const fetchEpisodes = async (showId: string, limit = 10, offsetParam = 0) => {
    if (!token) {
      console.warn('⚠️ No Spotify token available for episodes fetch');
      return null;
    }

    try {
      console.log('🎵 Fetching Spotify episodes:', { showId, limit, offsetParam, authStatus });
      
      const response = await fetch(
        `https://api.spotify.com/v1/shows/${showId}/episodes?limit=${limit}&offset=${offsetParam}&market=BR`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('🌐 Spotify episodes API response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Spotify episodes API error:', response.status, errorText);
        setApiError(`API Error: ${response.status} - ${errorText}`);
        throw new Error(`Spotify API error: ${response.status} - ${errorText}`);
      }

      const data: SpotifyEpisodesResponse = await response.json();
      console.log(`✅ Spotify episodes fetched: ${data.items.length} (offset: ${offsetParam})`);
      setApiError(null);
      return data;
    } catch (err) {
      console.error('❌ Failed to fetch Spotify episodes:', err);
      setApiError(err instanceof Error ? err.message : 'Unknown API error');
      throw err;
    }
  };

  const loadMoreEpisodes = useCallback(async () => {
    if (!embedUrl || !token || !isConfigured || !hasMore || loadingMore) return;

    const showId = extractShowId(embedUrl);
    if (!showId) return;

    setLoadingMore(true);
    setError(null);

    try {
      const data = await fetchEpisodes(showId, initialLimit, offset);
      if (data) {
        setEpisodes(prev => [...prev, ...data.items]);
        setOffset(prev => prev + data.items.length);
        setHasMore(data.next !== null && episodes.length + data.items.length < data.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more episodes');
    } finally {
      setLoadingMore(false);
    }
  }, [embedUrl, token, isConfigured, hasMore, loadingMore, offset, initialLimit, episodes.length]);

  useEffect(() => {
    if (!embedUrl) {
      console.log('📭 No embed URL provided');
      return;
    }

    if (!isConfigured) {
      console.log('⚙️ Spotify not configured, will use generated episodes');
      return;
    }

    if (authStatus === 'failed') {
      console.log('❌ Spotify auth failed, will use generated episodes');
      return;
    }

    if (!token) {
      console.log('🔑 No Spotify token yet, waiting...');
      return;
    }

    const showId = extractShowId(embedUrl);
    if (!showId) {
      console.warn('⚠️ Could not extract show ID from URL:', embedUrl);
      return;
    }

    const loadInitialEpisodes = async () => {
      setLoading(true);
      setError(null);
      setEpisodes([]);
      setOffset(0);

      try {
        console.log('🚀 Loading initial Spotify episodes...');
        const data = await fetchEpisodes(showId, initialLimit, 0);
        if (data) {
          setEpisodes(data.items);
          setTotalEpisodes(data.total);
          setOffset(data.items.length);
          setHasMore(data.next !== null && data.items.length < data.total);
          console.log('✅ Initial episodes loaded successfully');
        }
      } catch (err) {
        console.error('❌ Failed to load initial episodes, falling back to generated');
        setError(err instanceof Error ? err.message : 'Failed to load episodes');
      } finally {
        setLoading(false);
      }
    };

    loadInitialEpisodes();
  }, [embedUrl, token, isConfigured, authStatus, initialLimit]);

  // Determine if we actually have real data working
  const hasWorkingRealData = episodes.length > 0 && isConfigured && authStatus === 'success' && !apiError;

  return {
    episodes,
    loading,
    loadingMore,
    error,
    apiError,
    totalEpisodes,
    hasMore,
    hasRealData: hasWorkingRealData,
    authStatus,
    loadMoreEpisodes
  };
};
