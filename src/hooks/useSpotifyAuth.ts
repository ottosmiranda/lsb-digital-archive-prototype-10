
import { useState, useEffect } from 'react';

interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
}

export const useSpotifyAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStoredCredentials = () => {
    return {
      clientId: localStorage.getItem('spotify_client_id'),
      clientSecret: localStorage.getItem('spotify_client_secret')
    };
  };

  const authenticate = async () => {
    const { clientId, clientSecret } = getStoredCredentials();
    
    if (!clientId || !clientSecret) {
      setError('Credenciais do Spotify não configuradas');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if we have a valid cached token
      const cachedToken = localStorage.getItem('spotify_token');
      if (cachedToken) {
        const tokenData: SpotifyToken = JSON.parse(cachedToken);
        if (Date.now() < tokenData.expires_at) {
          setToken(tokenData.access_token);
          setLoading(false);
          return true;
        }
      }

      // Get new token
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Spotify auth failed: ${response.status}`);
      }

      const tokenData = await response.json();
      const expiresAt = Date.now() + (tokenData.expires_in * 1000);
      
      const tokenWithExpiry = {
        ...tokenData,
        expires_at: expiresAt
      };

      localStorage.setItem('spotify_token', JSON.stringify(tokenWithExpiry));
      setToken(tokenData.access_token);
      console.log('✅ Spotify authentication successful');
      return true;
    } catch (err) {
      console.error('❌ Spotify authentication failed:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const isConfigured = () => {
    const { clientId, clientSecret } = getStoredCredentials();
    return !!(clientId && clientSecret);
  };

  useEffect(() => {
    if (isConfigured()) {
      authenticate();
    }
  }, []);

  return {
    token,
    loading,
    error,
    authenticate,
    isConfigured: isConfigured()
  };
};
