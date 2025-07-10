
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
  
  // Detectar padrões conhecidos do logo da plataforma
  const logoPatterns = [
    'logo',
    'placeholder', 
    'default',
    'generic',
    'lsb',
    'biblioteca',
    'biblio' // ✅ ADICIONADO: detecta "biblio", "BIBLIO", "Biblio", etc.
  ];
  
  // Se a URL contém qualquer padrão de logo, considerar inválida
  return !logoPatterns.some(pattern => 
    url.toLowerCase().includes(pattern.toLowerCase())
  );
};

/**
 * Determines the display logic for thumbnails
 * Returns whether to show image or placeholder
 */
export const shouldShowImage = (thumbnail: string | null | undefined, contentType: string): boolean => {
  return isValidThumbnail(thumbnail, contentType);
};
