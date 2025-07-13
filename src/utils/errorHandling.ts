
// Generic error handling utilities for the platform

export type PlatformErrorType = 
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'UNKNOWN';

export interface PlatformError {
  type: PlatformErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
}

export const createPlatformError = (
  type: PlatformErrorType, 
  originalError?: any
): PlatformError => {
  const errors: Record<PlatformErrorType, PlatformError> = {
    NETWORK_ERROR: {
      type: 'NETWORK_ERROR',
      message: 'Network request failed',
      userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.',
      retryable: true
    },
    API_ERROR: {
      type: 'API_ERROR',
      message: 'API request failed',
      userMessage: 'Erro na API. Tente novamente em alguns instantes.',
      retryable: true
    },
    UNKNOWN: {
      type: 'UNKNOWN',
      message: 'Unknown error occurred',
      userMessage: 'Erro desconhecido. Tente novamente.',
      retryable: true
    }
  };

  return errors[type];
};

export const classifyPlatformError = (error: any): PlatformError => {
  const message = error?.message?.toLowerCase() || '';
  
  if (message.includes('network') || message.includes('fetch')) {
    return createPlatformError('NETWORK_ERROR', error);
  }
  
  if (message.includes('api') || error?.status) {
    return createPlatformError('API_ERROR', error);
  }
  
  return createPlatformError('UNKNOWN', error);
};
