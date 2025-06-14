
import { ViewData } from './types';

export const generateViewData = (item: any, index: number): ViewData => {
  // Use item ID and type to generate consistent pseudo-random numbers
  const seed = (item.id || 1) * 17 + item.type.charCodeAt(0) * 31;
  const baseViews = 5000 + (seed % 12000); // Random between 5k-17k
  const views = Math.floor(baseViews - (index * 800)); // Decrease by rank
  
  // Generate trend based on content characteristics
  const trendSeed = seed % 10;
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (trendSeed < 4) trend = 'up';
  else if (trendSeed > 7) trend = 'down';
  
  return { views, trend };
};

export const formatViews = (views: number): string => {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}k`;
  }
  return views.toString();
};
