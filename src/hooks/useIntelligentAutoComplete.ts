
import { useState, useEffect, useMemo, useCallback } from 'react';
import { SearchResult } from '@/types/searchTypes';
import { useDataLoader } from '@/hooks/useDataLoader';

export interface AutoCompleteResult {
  term: string;
  category: 'title' | 'subject' | 'author';
  frequency: number;
  matchType: 'prefix' | 'substring';
  sourceItems: string[];
}

export const useIntelligentAutoComplete = () => {
  const { allData, dataLoaded } = useDataLoader();
  const [termsIndex, setTermsIndex] = useState<Map<string, AutoCompleteResult>>(new Map());
  const [isReady, setIsReady] = useState(false);

  // Extract and process terms from data
  const extractTerms = useCallback((data: SearchResult[]) => {
    const termsMap = new Map<string, AutoCompleteResult>();

    console.log('🔍 Extracting terms from', data.length, 'items for auto-complete');

    data.forEach((item) => {
      // Extract from title
      if (item.title) {
        const titleWords = item.title
          .toLowerCase()
          .replace(/[^\w\sáàâãéêíóôõúç]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length >= 3);

        titleWords.forEach(word => {
          const key = `title:${word}`;
          if (termsMap.has(key)) {
            const existing = termsMap.get(key)!;
            existing.frequency++;
            if (!existing.sourceItems.includes(item.id.toString())) {
              existing.sourceItems.push(item.id.toString());
            }
          } else {
            termsMap.set(key, {
              term: word,
              category: 'title',
              frequency: 1,
              matchType: 'prefix',
              sourceItems: [item.id.toString()]
            });
          }
        });
      }

      // Extract from subject
      if (item.subject) {
        const subjectWords = item.subject
          .toLowerCase()
          .replace(/[^\w\sáàâãéêíóôõúç]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length >= 3);

        subjectWords.forEach(word => {
          const key = `subject:${word}`;
          if (termsMap.has(key)) {
            const existing = termsMap.get(key)!;
            existing.frequency++;
            if (!existing.sourceItems.includes(item.id.toString())) {
              existing.sourceItems.push(item.id.toString());
            }
          } else {
            termsMap.set(key, {
              term: word,
              category: 'subject',
              frequency: 1,
              matchType: 'prefix',
              sourceItems: [item.id.toString()]
            });
          }
        });
      }

      // Extract from author
      if (item.author) {
        const authorWords = item.author
          .toLowerCase()
          .replace(/[^\w\sáàâãéêíóôõúç]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length >= 2);

        authorWords.forEach(word => {
          const key = `author:${word}`;
          if (termsMap.has(key)) {
            const existing = termsMap.get(key)!;
            existing.frequency++;
            if (!existing.sourceItems.includes(item.id.toString())) {
              existing.sourceItems.push(item.id.toString());
            }
          } else {
            termsMap.set(key, {
              term: word,
              category: 'author',
              frequency: 1,
              matchType: 'prefix',
              sourceItems: [item.id.toString()]
            });
          }
        });
      }
    });

    console.log('✅ Built auto-complete index with', termsMap.size, 'terms');
    return termsMap;
  }, []);

  // Build terms index when data is loaded
  useEffect(() => {
    if (dataLoaded && allData && allData.length > 0) {
      console.log('🔍 Building auto-complete terms index from', allData.length, 'items');
      const index = extractTerms(allData);
      setTermsIndex(index);
      setIsReady(true);
      console.log('✅ Auto-complete index built with', index.size, 'terms');
    } else {
      console.log('⏳ Auto-complete waiting for data...', { dataLoaded, dataCount: allData?.length || 0 });
      setIsReady(false);
    }
  }, [dataLoaded, allData, extractTerms]);

  // Get suggestions for a query
  const getSuggestions = useCallback((query: string, maxResults: number = 8): AutoCompleteResult[] => {
    if (!query || query.length < 2 || termsIndex.size === 0) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    const results: AutoCompleteResult[] = [];

    // Find matching terms
    for (const [key, result] of termsIndex.entries()) {
      const term = result.term;

      // Check for prefix match
      if (term.startsWith(normalizedQuery)) {
        results.push({
          ...result,
          matchType: 'prefix'
        });
      }
      // Check for substring match (lower priority)
      else if (term.includes(normalizedQuery) && normalizedQuery.length >= 3) {
        results.push({
          ...result,
          matchType: 'substring'
        });
      }
    }

    // Sort by relevance: prefix matches first, then by frequency
    const sorted = results.sort((a, b) => {
      // Prefix matches have higher priority
      if (a.matchType === 'prefix' && b.matchType === 'substring') return -1;
      if (a.matchType === 'substring' && b.matchType === 'prefix') return 1;
      
      // Then sort by frequency
      return b.frequency - a.frequency;
    });

    // Group by category and limit results
    const titleSuggestions = sorted.filter(r => r.category === 'title').slice(0, 3);
    const subjectSuggestions = sorted.filter(r => r.category === 'subject').slice(0, 3);
    const authorSuggestions = sorted.filter(r => r.category === 'author').slice(0, 2);

    const finalResults = [...titleSuggestions, ...subjectSuggestions, ...authorSuggestions].slice(0, maxResults);
    
    console.log('🔍 Auto-complete suggestions for:', query, 'found:', finalResults.length);
    return finalResults;
  }, [termsIndex]);

  // Get popular terms by category
  const getPopularTerms = useCallback((category: 'title' | 'subject' | 'author', limit: number = 5): string[] => {
    const categoryTerms = Array.from(termsIndex.values())
      .filter(term => term.category === category)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit)
      .map(term => term.term);

    return categoryTerms;
  }, [termsIndex]);

  return {
    getSuggestions,
    getPopularTerms,
    isReady: isReady && termsIndex.size > 0
  };
};
