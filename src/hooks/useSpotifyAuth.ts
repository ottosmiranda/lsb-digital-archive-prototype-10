
import { useState, useEffect } from 'react';
import { detectBrowserCapabilities } from '@/utils/browserUtils';
import { classifySpotifyError, SpotifyError } from '@/utils/errorHandling';

interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
}

interface AuthState {
  token: string | null;
  loading: boolean;
  error: SpotifyError | null;
  isConfigured: boolean;
  authStatus: 'idle' | 'authenticating' | 'success' | 'failed';
  retryCount: number;
  browserCapabilities: ReturnType<typeof detectBrowserCapabilities>;
}

export const useSpotifyAuth = () => {
  const [state, setState] = useState<AuthState>({
    token: null,
    loading: false,
    error: null,
    isConfigured: false,
    authStatus: 'idle',
    retryCount: 0,
    browserCapabilities: detectBrowserCapabilities()
  });

  const getStoredCredentials = () => {
    if (!state.browserCapabilities.supportsLocalStorage) {
      return { clientId: null, clientSecret: null };
    }
    
    return {
      clientId: localStorage.getItem('spotify_client_id'),
      clientSecret: localStorage.getItem('spotify_client_secret')
    };
  };

  const authenticate = async (isRetry = false): Promise<boolean> => {
    const { clientId, clientSecret } = getStoredCredentials();
    
    if (!clientId || !clientSecret) {
      const error = classifySpotifyError(
        new Error('Credentials not configured'), 
        state.browserCapabilities.browserName
      );
      setState(prev => ({
        ...prev,
        error: { ...error, userMessage: 'Credenciais do Spotify não configuradas' },
        authStatus: 'failed'
      }));
      return false;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      authStatus: 'authenticating',
      retryCount: isRetry ? prev.retryCount + 1 : 0
    }));

    try {
      // Check cached token first
      const cachedToken = localStorage.getItem('spotify_token');
      if (cachedToken) {
        const tokenData: SpotifyToken = JSON.parse(cachedToken);
        if (Date.now() < tokenData.expires_at) {
          setState(prev => ({
            ...prev,
            token: tokenData.access_token,
            loading: false,
            authStatus: 'success'
          }));
          console.log('✅ Using cached Spotify token');
          return true;
        }
      }

      // Get new token with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
        },
        body: 'grant_type=client_credentials',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

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
      
      setState(prev => ({
        ...prev,
        token: tokenData.access_token,
        loading: false,
        authStatus: 'success',
        error: null
      }));
      
      console.log('✅ Spotify authentication successful');
      return true;
    } catch (err) {
      console.error('❌ Spotify authentication failed:', err);
      
      const spotifyError = classifySpotifyError(err, state.browserCapabilities.browserName);
      
      setState(prev => ({
        ...prev,
        error: spotifyError,
        loading: false,
        authStatus: 'failed'
      }));
      
      return false;
    }
  };

  const retryAuthentication = async () => {
    if (state.retryCount < 3) {
      // Exponential backoff
      const delay = Math.pow(2, state.retryCount) * 1000;
      setTimeout(() => authenticate(true), delay);
    }
  };

  const isConfigured = () => {
    const { clientId, clientSecret } = getStoredCredentials();
    return !!(clientId && clientSecret);
  };

  useEffect(() => {
    const configured = isConfigured();
    setState(prev => ({ ...prev, isConfigured: configured }));
    
    if (configured) {
      authenticate();
    }
  }, []);

  return {
    token: state.token,
    loading: state.loading,
    error: state.error,
    isConfigured: state.isConfigured,
    authStatus: state.authStatus,
    retryCount: state.retryCount,
    browserCapabilities: state.browserCapabilities,
    authenticate: () => authenticate(),
    retryAuthentication
  };
};
