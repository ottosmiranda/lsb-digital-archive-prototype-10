
export type SpotifyErrorType = 
  | 'AUTH_FAILED'
  | 'CORS_BLOCKED' 
  | 'NETWORK_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'BROWSER_UNSUPPORTED'
  | 'EMBED_FAILED'
  | 'UNKNOWN';

export interface SpotifyError {
  type: SpotifyErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  browserSpecific: boolean;
}

export const createSpotifyError = (
  type: SpotifyErrorType, 
  originalError?: any,
  browserName?: string
): SpotifyError => {
  const errors: Record<SpotifyErrorType, SpotifyError> = {
    AUTH_FAILED: {
      type: 'AUTH_FAILED',
      message: 'Spotify authentication failed',
      userMessage: 'Falha na autenticação do Spotify. Verifique suas credenciais.',
      retryable: true,
      browserSpecific: false
    },
    CORS_BLOCKED: {
      type: 'CORS_BLOCKED',
      message: 'CORS request blocked',
      userMessage: `Seu navegador ${browserName || ''} bloqueou a conexão com o Spotify. Experimente outro navegador.`,
      retryable: false,
      browserSpecific: true
    },
    NETWORK_ERROR: {
      type: 'NETWORK_ERROR',
      message: 'Network request failed',
      userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.',
      retryable: true,
      browserSpecific: false
    },
    INVALID_CREDENTIALS: {
      type: 'INVALID_CREDENTIALS',
      message: 'Invalid Spotify credentials',
      userMessage: 'Credenciais do Spotify inválidas. Configure novamente nas configurações.',
      retryable: false,
      browserSpecific: false
    },
    BROWSER_UNSUPPORTED: {
      type: 'BROWSER_UNSUPPORTED',
      message: 'Browser not supported',
      userMessage: `Seu navegador ${browserName || ''} pode não suportar todos os recursos. Recomendamos Chrome ou Firefox.`,
      retryable: false,
      browserSpecific: true
    },
    EMBED_FAILED: {
      type: 'EMBED_FAILED',
      message: 'Spotify embed failed to load',
      userMessage: 'Não foi possível carregar o player do Spotify. Usando versão simplificada.',
      retryable: true,
      browserSpecific: true
    },
    UNKNOWN: {
      type: 'UNKNOWN',
      message: 'Unknown error occurred',
      userMessage: 'Erro desconhecido. Tente novamente ou use episódios de exemplo.',
      retryable: true,
      browserSpecific: false
    }
  };

  return errors[type];
};

export const classifySpotifyError = (error: any, browserName?: string): SpotifyError => {
  const message = error?.message?.toLowerCase() || '';
  
  if (message.includes('cors') || message.includes('cross-origin')) {
    return createSpotifyError('CORS_BLOCKED', error, browserName);
  }
  
  if (message.includes('401') || message.includes('unauthorized')) {
    return createSpotifyError('AUTH_FAILED', error, browserName);
  }
  
  if (message.includes('403') || message.includes('invalid_client')) {
    return createSpotifyError('INVALID_CREDENTIALS', error, browserName);
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return createSpotifyError('NETWORK_ERROR', error, browserName);
  }
  
  return createSpotifyError('UNKNOWN', error, browserName);
};
