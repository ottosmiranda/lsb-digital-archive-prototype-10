
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

export const useSpotifyOEmbed = (embedUrl?: string): UseSpotifyOEmbedResult => {
  const [oembedData, setOembedData] = useState<SpotifyOEmbedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!embedUrl) {
      setOembedData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchOEmbedData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Convert embed URL to regular Spotify URL for oEmbed API
        const spotifyUrl = embedUrl.replace('/embed/', '/').split('?')[0];
        
        console.log('🎵 Fetching oEmbed for Spotify URL:', spotifyUrl);
        
        const oembedApiUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`;
        console.log('🌐 oEmbed API URL:', oembedApiUrl);
        
        const response = await fetch(oembedApiUrl);

        if (!response.ok) {
          throw new Error(`oEmbed API returned ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ oEmbed data received:', data);
        setOembedData(data);
      } catch (err) {
        console.warn('⚠️ oEmbed fetch failed (likely CORS):', err);
        // Don't set this as an error since we have a fallback
        setError('oEmbed fetch failed - using fallback');
      } finally {
        setLoading(false);
      }
    };

    fetchOEmbedData();
  }, [embedUrl]);

  return { oembedData, loading, error };
};
