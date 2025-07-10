
/**
 * Utility functions for thumbnail validation and display logic
 * Follows SRP by centralizing thumbnail validation logic
 */

/**
 * Validates if a thumbnail URL is valid for display
 * Special handling for books/articles vs podcasts/videos
 */
export const isValidThumbnail = (url: string | null | undefined, contentType: string): boolean => {
  // Para Podcasts e Vídeos, manter comportamento atual (não alterar)
  if (contentType === 'podcast' || contentType === 'video') {
    return !!url;
  }
  
  // Para Livros e Artigos (tipo 'titulo'), verificar se não é logo da plataforma
  if (!url) return false;
  
  // 🔍 DEBUG TEMPORÁRIO: Log detalhado para investigar cache
  console.group('🖼️ THUMBNAIL DEBUG - isValidThumbnail');
  console.log('URL recebida:', url);
  console.log('Content type:', contentType);
  console.log('Timestamp:', new Date().toISOString());
  
  // Detectar padrões conhecidos do logo da plataforma
  const logoPatterns = [
    'logo',
    'placeholder', 
    'default',
    'generic',
    'lsb',
    'biblioteca',
    'biblio' // ✅ DETECTA: "biblio", "BIBLIO", "Biblio", etc.
  ];
  
  // Se a URL contém qualquer padrão de logo, considerar inválida
  const hasLogoPattern = logoPatterns.some(pattern => 
    url.toLowerCase().includes(pattern.toLowerCase())
  );
  
  console.log('Logo patterns checked:', logoPatterns);
  console.log('Has logo pattern?', hasLogoPattern);
  console.log('URL lowercase:', url.toLowerCase());
  console.log('Detection result:', !hasLogoPattern);
  console.groupEnd();
  
  return !hasLogoPattern;
};

/**
 * Determines the display logic for thumbnails
 * Returns whether to show image or placeholder
 */
export const shouldShowImage = (thumbnail: string | null | undefined, contentType: string): boolean => {
  const result = isValidThumbnail(thumbnail, contentType);
  
  // 🔍 DEBUG TEMPORÁRIO: Log final para shouldShowImage
  console.log('🎯 SHOULD SHOW IMAGE RESULT:', {
    thumbnail: thumbnail?.substring(0, 50) + '...',
    contentType,
    result,
    timestamp: new Date().toISOString()
  });
  
  return result;
};
