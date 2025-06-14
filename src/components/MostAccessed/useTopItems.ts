
import { useMemo } from 'react';
import { SearchResult } from '@/types/searchTypes';
import { TopAccessedItem } from './types';
import { generateViewData } from './dataUtils';

export const useTopItems = (allData: SearchResult[]): TopAccessedItem[] => {
  return useMemo(() => {
    if (!allData || allData.length === 0) return [];
    
    // Mix different content types and take top 10
    const shuffled = [...allData].sort((a, b) => {
      // Sort by a mix of ID and type for consistent but varied results
      const aScore = (a.id || 1) * (a.type === 'podcast' ? 3 : a.type === 'video' ? 2 : 1);
      const bScore = (b.id || 1) * (b.type === 'podcast' ? 3 : b.type === 'video' ? 2 : 1);
      return bScore - aScore;
    });

    return shuffled.slice(0, 10).map((item, index) => {
      const { views, trend } = generateViewData(item, index);
      
      return {
        rank: index + 1,
        id: item.id,
        title: item.title,
        type: item.type,
        author: item.author,
        views,
        trend
      };
    });
  }, [allData]);
};
