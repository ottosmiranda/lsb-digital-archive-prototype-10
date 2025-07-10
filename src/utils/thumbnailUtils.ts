
/**
 * Utility functions for handling thumbnail validation and display logic
 */

/**
 * Checks if a thumbnail URL is valid and not a placeholder/logo
 * @param url - The thumbnail URL to validate
 * @returns true if the thumbnail is valid and should be displayed
 */
export const isValidThumbnail = (url: string | null | undefined): boolean => {
  if (!url) return false;
  
  // Check if URL points to common placeholder/logo patterns
  const invalidPatterns = [
    'logo',
    'placeholder',
    'default',
    'no-image',
    'missing',
    'unavailable',
    // Add more patterns as needed based on your API responses
  ];
  
  const urlLower = url.toLowerCase();
  return !invalidPatterns.some(pattern => urlLower.includes(pattern));
};

/**
 * Determines if we should show a thumbnail image or placeholder
 * @param thumbnailUrl - The thumbnail URL from the API
 * @returns object with display logic for image and placeholder
 */
export const getThumbnailDisplayLogic = (thumbnailUrl: string | null | undefined) => {
  const shouldShowImage = isValidThumbnail(thumbnailUrl);
  return {
    shouldShowImage,
    shouldShowPlaceholder: !shouldShowImage,
    imageUrl: shouldShowImage ? thumbnailUrl : undefined
  };
};
