
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
      subject: true, // Sempre aberto
      author: false,
      language: filterRelevance.language && filterPriorities.language <= 3,
      documentType: filterRelevance.documentType && filterPriorities.documentType <= 3,
      year: false,
      duration: filterRelevance.duration && filterPriorities.duration <= 3,
      pages: filterRelevance.pages && filterPriorities.pages <= 3,
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
