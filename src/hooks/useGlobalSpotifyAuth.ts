
import { useState, useEffect } from 'react';
import { platformSettingsService, SpotifyConfig } from '@/services/platformSettingsService';
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
  config: SpotifyConfig | null;
}

export const useGlobalSpotifyAuth = () => {
  const [state, setState] = useState<AuthState>({
    token: null,
    loading: false,
    error: null,
    isConfigured: false,
    authStatus: 'idle',
    retryCount: 0,
    browserCapabilities: detectBrowserCapabilities(),
    config: null
  });

  const loadPlatformConfig = async () => {
    try {
      const { data, error } = await platformSettingsService.getSpotifyConfig();
      if (error) {
        console.error('Error loading Spotify platform config:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error loading Spotify platform config:', error);
      return null;
    }
  };

  const authenticate = async (isRetry = false): Promise<boolean> => {
    const config = await loadPlatformConfig();
    
    if (!config || !config.enabled || !config.client_id || !config.client_secret) {
      const error = classifySpotifyError(
        new Error('Platform Spotify not configured or disabled'), 
        state.browserCapabilities.browserName
      );
      setState(prev => ({
        ...prev,
        error: { ...error, userMessage: 'Spotify não está configurado na plataforma' },
        authStatus: 'failed'
      }));
      return false;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      authStatus: 'authenticating',
      retryCount: isRetry ? prev.retryCount + 1 : 0,
      config
    }));

    try {
      // Check cached token first
      const cachedToken = localStorage.getItem('platform_spotify_token');
      if (cachedToken) {
        const tokenData: SpotifyToken = JSON.parse(cachedToken);
        if (Date.now() < tokenData.expires_at) {
          setState(prev => ({
            ...prev,
            token: tokenData.access_token,
            loading: false,
            authStatus: 'success'
          }));
          console.log('✅ Using cached platform Spotify token');
          return true;
        }
      }

      // Get new token with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${config.client_id}:${config.client_secret}`)}`
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

      localStorage.setItem('platform_spotify_token', JSON.stringify(tokenWithExpiry));
      
      setState(prev => ({
        ...prev,
        token: tokenData.access_token,
        loading: false,
        authStatus: 'success',
        error: null
      }));
      
      console.log('✅ Platform Spotify authentication successful');
      return true;
    } catch (err) {
      console.error('❌ Platform Spotify authentication failed:', err);
      
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
      const delay = Math.pow(2, state.retryCount) * 1000;
      setTimeout(() => authenticate(true), delay);
    }
  };

  const checkConfiguration = async () => {
    const config = await loadPlatformConfig();
    const configured = !!(config && config.enabled && config.client_id && config.client_secret);
    setState(prev => ({ 
      ...prev, 
      isConfigured: configured,
      config 
    }));
    
    if (configured) {
      authenticate();
    }
  };

  useEffect(() => {
    checkConfiguration();
  }, []);

  return {
    token: state.token,
    loading: state.loading,
    error: state.error,
    isConfigured: state.isConfigured,
    authStatus: state.authStatus,
    retryCount: state.retryCount,
    browserCapabilities: state.browserCapabilities,
    config: state.config,
    authenticate: () => authenticate(),
    retryAuthentication,
    refreshConfig: checkConfiguration
  };
};
