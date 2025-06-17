
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
  const [authStatus, setAuthStatus] = useState<'idle' | 'success' | 'failed' | 'not-configured'>('idle');

  const getStoredCredentials = () => {
    return {
      clientId: localStorage.getItem('spotify_client_id'),
      clientSecret: localStorage.getItem('spotify_client_secret')
    };
  };

  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);
    
    console.log('🌐 Browser Info:', { 
      userAgent: userAgent.substring(0, 50) + '...', 
      isMobile, 
      isChrome, 
      isSafari, 
      isFirefox 
    });
    
    return { isMobile, isChrome, isSafari, isFirefox };
  };

  const authenticate = async () => {
    const { clientId, clientSecret } = getStoredCredentials();
    const browserInfo = getBrowserInfo();
    
    if (!clientId || !clientSecret) {
      console.warn('❌ Spotify credentials not configured');
      setError('Credenciais do Spotify não configuradas');
      setAuthStatus('not-configured');
      return false;
    }

    setLoading(true);
    setError(null);
    setAuthStatus('idle');

    try {
      // Check if we have a valid cached token
      const cachedToken = localStorage.getItem('spotify_token');
      if (cachedToken) {
        const tokenData: SpotifyToken = JSON.parse(cachedToken);
        if (Date.now() < tokenData.expires_at) {
          console.log('✅ Using cached Spotify token');
          setToken(tokenData.access_token);
          setAuthStatus('success');
          setLoading(false);
          return true;
        } else {
          console.log('⏰ Cached token expired, fetching new one');
        }
      }

      console.log('🔑 Attempting Spotify authentication...', { browserInfo });

      // Get new token
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
        },
        body: 'grant_type=client_credentials'
      });

      console.log('🌐 Spotify auth response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Spotify auth failed:', response.status, errorText);
        throw new Error(`Spotify auth failed: ${response.status} - ${errorText}`);
      }

      const tokenData = await response.json();
      const expiresAt = Date.now() + (tokenData.expires_in * 1000);
      
      const tokenWithExpiry = {
        ...tokenData,
        expires_at: expiresAt
      };

      localStorage.setItem('spotify_token', JSON.stringify(tokenWithExpiry));
      setToken(tokenData.access_token);
      setAuthStatus('success');
      console.log('✅ Spotify authentication successful', { browserInfo });
      return true;
    } catch (err) {
      console.error('❌ Spotify authentication failed:', err, { browserInfo });
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setAuthStatus('failed');
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
    } else {
      setAuthStatus('not-configured');
    }
  }, []);

  return {
    token,
    loading,
    error,
    authStatus,
    authenticate,
    isConfigured: isConfigured()
  };
};
