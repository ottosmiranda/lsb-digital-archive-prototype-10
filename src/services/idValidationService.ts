
interface IdValidationResult {
  isValid: boolean;
  type: 'video' | 'titulo' | 'podcast' | null;
  format: 'numeric' | 'alphanumeric' | 'spotify' | 'uuid' | 'unknown';
  errorReason?: string;
}

class IdValidationService {
  // ✅ Padrões conhecidos de IDs válidos por tipo
  private readonly ID_PATTERNS = {
    video: /^[a-zA-Z0-9]{8,12}$/, // IDs alfanuméricos curtos para vídeos
    titulo: /^\d+$/, // IDs numéricos para livros/artigos
    podcast: /^[a-zA-Z0-9]{22}$|^spotify:episode:[a-zA-Z0-9]{22}$/, // IDs do Spotify
  };

  validateId(id: string): IdValidationResult {
    console.group('🔍 ID VALIDATION SERVICE');
    console.log('📋 Validating ID:', id);

    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.log('❌ ID is empty or invalid type');
      console.groupEnd();
      return {
        isValid: false,
        type: null,
        format: 'unknown',
        errorReason: 'ID vazio ou tipo inválido'
      };
    }

    const cleanId = id.trim();

    // ✅ CRÍTICO: Detectar UUIDs v4 (que são sempre inválidos no nosso contexto)
    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidV4Pattern.test(cleanId)) {
      console.log('❌ DETECTED INVALID UUID V4:', cleanId);
      console.groupEnd();
      return {
        isValid: false,
        type: null,
        format: 'uuid',
        errorReason: 'UUID v4 inválido - não corresponde a nenhum recurso real'
      };
    }

    // ✅ Validar padrões conhecidos
    for (const [type, pattern] of Object.entries(this.ID_PATTERNS)) {
      if (pattern.test(cleanId)) {
        console.log(`✅ Valid ${type} ID format detected`);
        console.groupEnd();
        return {
          isValid: true,
          type: type as 'video' | 'titulo' | 'podcast',
          format: type === 'titulo' ? 'numeric' : type === 'podcast' ? 'spotify' : 'alphanumeric'
        };
      }
    }

    console.log('❌ ID does not match any known pattern');
    console.groupEnd();
    return {
      isValid: false,
      type: null,
      format: 'unknown',
      errorReason: 'Formato de ID não reconhecido'
    };
  }

  // ✅ Rastrear origem de IDs inválidos
  trackInvalidIdOrigin(id: string, origin: string, context?: any) {
    console.group('🚨 INVALID ID TRACKING');
    console.log('📋 Invalid ID:', id);
    console.log('📋 Origin:', origin);
    console.log('📋 Context:', context);
    console.log('📋 Stack trace:', new Error().stack);
    console.groupEnd();

    // ✅ Persistir para análise posterior
    const tracking = {
      id,
      origin,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Salvar no localStorage para debug
    try {
      const existingTrackings = JSON.parse(localStorage.getItem('invalid-id-trackings') || '[]');
      existingTrackings.push(tracking);
      // Manter apenas os últimos 50
      if (existingTrackings.length > 50) {
        existingTrackings.splice(0, existingTrackings.length - 50);
      }
      localStorage.setItem('invalid-id-trackings', JSON.stringify(existingTrackings));
    } catch (error) {
      console.warn('Failed to track invalid ID:', error);
    }
  }

  // ✅ Sugerir IDs alternativos baseados no contexto
  suggestAlternativeId(invalidId: string, title?: string): string | null {
    console.log('🔍 Searching for alternative ID for:', { invalidId, title });

    // Se temos um título, podemos tentar buscar por similaridade
    // Esta será uma implementação futura mais sofisticada
    if (title) {
      console.log('💡 Title available for alternative search:', title);
      // TODO: Implementar busca fuzzy por título
    }

    return null;
  }

  // ✅ Debug: listar todos os trackings de IDs inválidos
  getInvalidIdTrackings(): any[] {
    try {
      return JSON.parse(localStorage.getItem('invalid-id-trackings') || '[]');
    } catch {
      return [];
    }
  }

  // ✅ Limpar trackings antigos
  clearTrackings() {
    localStorage.removeItem('invalid-id-trackings');
  }
}

export const idValidationService = new IdValidationService();
