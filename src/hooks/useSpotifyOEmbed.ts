
import { useState, useEffect } from 'react';

interface SpotifyOEmbedData {
  html: string;
  width: number;
  height: number;
  title: string;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  provider_name: string;
  type: string;
}

interface UseSpotifyOEmbedResult {
  oembedData: SpotifyOEmbedData | null;
  loading: boolean;
  error: string | null;
}

export const useSpotifyOEmbed = (spotifyUrl?: string): UseSpotifyOEmbedResult => {
  const [oembedData, setOembedData] = useState<SpotifyOEmbedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spotifyUrl) {
      setOembedData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchOEmbedData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Extract the Spotify URL from embed URL if needed
        let cleanUrl = spotifyUrl;
        if (spotifyUrl.includes('embed/')) {
          // Convert embed URL back to regular Spotify URL
          cleanUrl = spotifyUrl.replace('/embed/', '/').split('?')[0];
        }

        const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(cleanUrl)}`;
        const response = await fetch(oembedUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch oEmbed data: ${response.status}`);
        }

        const data = await response.json();
        setOembedData(data);
      } catch (err) {
        console.error('Error fetching Spotify oEmbed data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch oEmbed data');
      } finally {
        setLoading(false);
      }
    };

    fetchOEmbedData();
  }, [spotifyUrl]);

  return { oembedData, loading, error };
};
