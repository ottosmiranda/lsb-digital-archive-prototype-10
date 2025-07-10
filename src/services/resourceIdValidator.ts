
interface IdValidationResult {
  isValid: boolean;
  type: 'video' | 'titulo' | 'podcast' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  suggestedAction: 'proceed' | 'fallback' | 'redirect';
}

class ResourceIdValidator {
  // Patterns for known ID formats
  private static readonly ID_PATTERNS = {
    video: /^[a-zA-Z0-9_-]{8,12}$/, // Short alphanumeric for videos
    titulo: /^\d+$/, // Numeric for books
    podcast: /^[a-zA-Z0-9]{22}$/, // Spotify-like IDs for podcasts
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i // UUID v4
  };

  static validateResourceId(id: string): IdValidationResult {
    console.group('🔍 VALIDAÇÃO DE ID');
    console.log('📋 ID a validar:', id);
    
    if (!id || id.trim() === '') {
      console.log('❌ ID vazio ou inválido');
      console.groupEnd();
      return {
        isValid: false,
        type: 'unknown',
        confidence: 'high',
        suggestedAction: 'redirect'
      };
    }

    // Check against known patterns
    const patterns = this.ID_PATTERNS;
    
    if (patterns.video.test(id)) {
      console.log('✅ ID corresponde ao padrão de vídeo');
      console.groupEnd();
      return {
        isValid: true,
        type: 'video',
        confidence: 'high',
        suggestedAction: 'proceed'
      };
    }
    
    if (patterns.titulo.test(id)) {
      console.log('✅ ID corresponde ao padrão de título/livro');
      console.groupEnd();
      return {
        isValid: true,
        type: 'titulo',
        confidence: 'high',
        suggestedAction: 'proceed'
      };
    }
    
    if (patterns.podcast.test(id)) {
      console.log('✅ ID corresponde ao padrão de podcast');
      console.groupEnd();
      return {
        isValid: true,
        type: 'podcast',
        confidence: 'high',
        suggestedAction: 'proceed'
      };
    }
    
    if (patterns.uuid.test(id)) {
      console.log('⚠️ ID é UUID válido mas não corresponde a padrões conhecidos');
      console.groupEnd();
      return {
        isValid: false,
        type: 'unknown',
        confidence: 'medium',
        suggestedAction: 'fallback'
      };
    }
    
    console.log('❌ ID não corresponde a nenhum padrão conhecido');
    console.groupEnd();
    return {
      isValid: false,
      type: 'unknown',
      confidence: 'low',
      suggestedAction: 'redirect'
    };
  }

  static isKnownInvalidId(id: string): boolean {
    // List of known problematic UUIDs that should be handled specially
    const knownInvalidIds = [
      'd2f4f084-8787-4cd4-a872-610b7d62d822'
    ];
    
    return knownInvalidIds.includes(id);
  }
}

export { ResourceIdValidator, type IdValidationResult };
