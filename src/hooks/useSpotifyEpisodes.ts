import { useState, useEffect, useCallback } from 'react';
import { useSpotifyAuth } from './useSpotifyAuth';
import { classifySpotifyError, SpotifyError } from '@/utils/errorHandling';

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
  const { token, isConfigured, authStatus, browserCapabilities } = useSpotifyAuth();
  const [episodes, setEpisodes] = useState<SpotifyEpisode[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<SpotifyError | null>(null);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

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
    if (!token) return null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(
        `https://api.spotify.com/v1/shows/${showId}/episodes?limit=${limit}&offset=${offsetParam}&market=BR`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
      }

      const data: SpotifyEpisodesResponse = await response.json();
      console.log(`✅ Spotify episodes fetched: ${data.items.length} (offset: ${offsetParam})`);
      return data;
    } catch (err) {
      console.error('❌ Failed to fetch Spotify episodes:', err);
      const spotifyError = classifySpotifyError(err, browserCapabilities.browserName);
      setError(spotifyError);
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
    if (!embedUrl || !token || !isConfigured) {
      if (authStatus === 'failed') {
        setError(classifySpotifyError(new Error('Authentication failed'), browserCapabilities.browserName));
      }
      return;
    }

    const showId = extractShowId(embedUrl);
    if (!showId) {
      console.warn('⚠️ Could not extract show ID from URL:', embedUrl);
      const error = classifySpotifyError(new Error('Invalid Spotify URL'), browserCapabilities.browserName);
      setError({ ...error, userMessage: 'URL do Spotify inválida' });
      return;
    }

    const loadInitialEpisodes = async () => {
      setLoading(true);
      setError(null);
      setEpisodes([]);
      setOffset(0);

      try {
        const data = await fetchEpisodes(showId, initialLimit, 0);
        if (data) {
          setEpisodes(data.items);
          setTotalEpisodes(data.total);
          setOffset(data.items.length);
          setHasMore(data.next !== null && data.items.length < data.total);
        }
      } catch (err) {
        // Error already handled in fetchEpisodes
      } finally {
        setLoading(false);
      }
    };

    loadInitialEpisodes();
  }, [embedUrl, token, isConfigured, initialLimit, authStatus, browserCapabilities.browserName]);

  return {
    episodes,
    loading,
    loadingMore,
    error,
    totalEpisodes,
    hasMore,
    hasRealData: episodes.length > 0 && isConfigured && authStatus === 'success',
    loadMoreEpisodes
  };
};
