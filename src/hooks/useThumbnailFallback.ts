
import { useCallback } from 'react';

export const useThumbnailFallback = () => {
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.style.display = 'none';
    
    // Show the placeholder that should be the next sibling
    const placeholder = target.nextElementSibling as HTMLElement;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }, []);

  return { handleImageError };
};
