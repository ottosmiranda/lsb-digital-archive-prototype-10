
import { useState, useEffect } from 'react';
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

export const useSpotifyEpisodes = (embedUrl?: string) => {
  const { token, isConfigured } = useSpotifyAuth();
  const [episodes, setEpisodes] = useState<SpotifyEpisode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalEpisodes, setTotalEpisodes] = useState(0);

  const extractShowId = (url: string): string | null => {
    // Extract show ID from various Spotify URL formats
    const patterns = [
      /\/show\/([a-zA-Z0-9]+)/,  // /show/ID
      /\/embed\/show\/([a-zA-Z0-9]+)/, // /embed/show/ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const fetchEpisodes = async (showId: string, limit = 20, offset = 0) => {
    if (!token) return null;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/shows/${showId}/episodes?limit=${limit}&offset=${offset}&market=BR`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
      }

      const data: SpotifyEpisodesResponse = await response.json();
      console.log('✅ Spotify episodes fetched:', data.items.length);
      return data;
    } catch (err) {
      console.error('❌ Failed to fetch Spotify episodes:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (!embedUrl || !token || !isConfigured) return;

    const showId = extractShowId(embedUrl);
    if (!showId) {
      console.warn('⚠️ Could not extract show ID from URL:', embedUrl);
      return;
    }

    const loadEpisodes = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchEpisodes(showId, 50); // Get more episodes
        if (data) {
          setEpisodes(data.items);
          setTotalEpisodes(data.total);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load episodes');
      } finally {
        setLoading(false);
      }
    };

    loadEpisodes();
  }, [embedUrl, token, isConfigured]);

  return {
    episodes,
    loading,
    error,
    totalEpisodes,
    hasRealData: episodes.length > 0 && isConfigured
  };
};
