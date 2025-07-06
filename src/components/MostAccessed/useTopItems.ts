
import { useMemo } from 'react';
import { SearchResult } from '@/types/searchTypes';

export const useTopItems = (allData: SearchResult[]): SearchResult[] => {
  return useMemo(() => {
    if (!allData || allData.length === 0) return [];
    
    // Mix different content types and take top 6 for carousel
    const shuffled = [...allData].sort((a, b) => {
      // Sort by a mix of ID and type for consistent but varied results
      const aScore = (a.id || 1) * (a.type === 'podcast' ? 3 : a.type === 'video' ? 2 : 1);
      const bScore = (b.id || 1) * (b.type === 'podcast' ? 3 : b.type === 'video' ? 2 : 1);
      return bScore - aScore;
    });

    // Return top 6 items for carousel display
    return shuffled.slice(0, 6);
  }, [allData]);
};
