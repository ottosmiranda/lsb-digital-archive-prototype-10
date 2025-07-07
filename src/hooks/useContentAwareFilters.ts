
import { useMemo } from 'react';
import { SearchResult } from '@/types/searchTypes';
import { analyzeContent, determineFilterRelevance, getFilterPriority } from '@/utils/contentAnalysis';

interface UseContentAwareFiltersProps {
  currentResults: SearchResult[];
  activeContentType: string;
}

export const useContentAwareFilters = ({
  currentResults,
  activeContentType
}: UseContentAwareFiltersProps) => {
  const contentStats = useMemo(() => {
    return analyzeContent(currentResults);
  }, [currentResults]);

  const filterRelevance = useMemo(() => {
    return determineFilterRelevance(contentStats, activeContentType);
  }, [contentStats, activeContentType]);

  const filterPriorities = useMemo(() => {
    return getFilterPriority(contentStats, activeContentType);
  }, [contentStats, activeContentType]);

  const defaultOpenSections = useMemo(() => {
    // Abrir seções mais prioritárias por padrão
    const sections: Record<string, boolean> = {
      subject: filterRelevance.subject && filterPriorities.subject <= 2,
      author: filterPriorities.author <= 2,
      language: filterRelevance.language && filterPriorities.language <= 2,
      year: filterRelevance.year && filterPriorities.year <= 2,
      duration: filterRelevance.duration && filterPriorities.duration <= 2,
      pages: filterRelevance.pages && filterPriorities.pages <= 2,
    };

    return sections;
  }, [filterRelevance, filterPriorities]);

  return {
    contentStats,
    filterRelevance,
    filterPriorities,
    defaultOpenSections,
  };
};
