
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { SearchFilters, SearchResult } from '@/types/searchTypes';
import { useDataLoader } from '@/hooks/useDataLoader';
import { getQueryParamArray } from '@/utils/searchUtils';
import { navigationHistoryService } from '@/services/navigationHistoryService';

export const useSearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { allData, loading: dataLoading, forceRefresh } = useDataLoader();
  
  // Save current search context whenever search params change
  useEffect(() => {
    if (searchParams.toString()) {
      navigationHistoryService.saveCurrentSearch(location);
    }
  }, [searchParams, location]);

  const [query, setQuery] = useState<string>(searchParams.get('q') || '');
  const [filters, setFilters] = useState<SearchFilters>({
    resourceType: getQueryParamArray(searchParams, 'type'),
    subject: getQueryParamArray(searchParams, 'subject'),
    author: getQueryParamArray(searchParams, 'author'),
    year: searchParams.get('year') || '',
    duration: searchParams.get('duration') || '',
    language: getQueryParamArray(searchParams, 'language'),
    documentType: getQueryParamArray(searchParams, 'documentType'),
    program: getQueryParamArray(searchParams, 'program'),
    channel: getQueryParamArray(searchParams, 'channel'),
  });
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sortBy') || 'relevance');
  const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get('page')) || 1);

  const resultsPerPage = 9;

  // Update search params when query, filters, sortBy, or currentPage change
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (query) newParams.set('q', query);
    
    filters.resourceType.forEach(type => newParams.append('type', type));
    filters.subject.forEach(subject => newParams.append('subject', subject));
    filters.author.forEach(author => newParams.append('author', author));
    if (filters.year) newParams.set('year', filters.year);
    if (filters.duration) newParams.set('duration', filters.duration);
    filters.language.forEach(language => newParams.append('language', language));
    filters.documentType.forEach(docType => newParams.append('documentType', docType));
    filters.program.forEach(program => newParams.append('program', program));
    filters.channel.forEach(channel => newParams.append('channel', channel));
    
    if (sortBy && sortBy !== 'relevance') newParams.set('sortBy', sortBy);
    if (currentPage > 1) newParams.set('page', String(currentPage));

    setSearchParams(newParams);
  }, [query, filters, sortBy, currentPage, setSearchParams]);

  const currentResults = useMemo(() => {
    if (!allData) return [];

    let filteredResults = [...allData];

    if (query) {
      filteredResults = filteredResults.filter(result =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase()) ||
        result.author.toLowerCase().includes(query.toLowerCase()) ||
        result.subject.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (filters.resourceType.length > 0) {
      filteredResults = filteredResults.filter(result =>
        filters.resourceType.includes(result.type)
      );
    }
    if (filters.subject.length > 0) {
      filteredResults = filteredResults.filter(result =>
        filters.subject.includes(result.subject)
      );
    }
    if (filters.author.length > 0) {
       filteredResults = filteredResults.filter(result =>
         filters.author.includes(result.author)
       );
    }
    if (filters.year) {
      filteredResults = filteredResults.filter(result =>
        String(result.year) === filters.year
      );
    }
    if (filters.duration) {
      filteredResults = filteredResults.filter(result =>
        result.duration === filters.duration
      );
    }
     if (filters.language.length > 0) {
       filteredResults = filteredResults.filter(result =>
         filters.language.includes(result.language)
       );
     }
    if (filters.documentType.length > 0) {
      filteredResults = filteredResults.filter(result =>
        filters.documentType.includes((result as any).documentType)
      );
    }
    if (filters.program.length > 0) {
      filteredResults = filteredResults.filter(result =>
        filters.program.includes((result as any).program)
      );
    }
    if (filters.channel.length > 0) {
      filteredResults = filteredResults.filter(result =>
        filters.channel.includes((result as any).channel)
      );
    }

    if (sortBy === 'title') {
      filteredResults.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'year') {
      filteredResults.sort((a, b) => (b.year || 0) - (a.year || 0));
    }

    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    return filteredResults.slice(startIndex, endIndex);
  }, [allData, query, filters, sortBy, currentPage, resultsPerPage]);

  const totalResults = useMemo(() => {
    if (!allData) return 0;

    let filteredResults = [...allData];

    if (query) {
      filteredResults = filteredResults.filter(result =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase()) ||
        result.author.toLowerCase().includes(query.toLowerCase()) ||
        result.subject.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (filters.resourceType.length > 0) {
      filteredResults = filteredResults.filter(result =>
        filters.resourceType.includes(result.type)
      );
    }
    if (filters.subject.length > 0) {
      filteredResults = filteredResults.filter(result =>
        filters.subject.includes(result.subject)
      );
    }
    if (filters.author.length > 0) {
        filteredResults = filteredResults.filter(result =>
          filters.author.includes(result.author)
        );
     }
    if (filters.year) {
      filteredResults = filteredResults.filter(result =>
        String(result.year) === filters.year
      );
    }
    if (filters.duration) {
      filteredResults = filteredResults.filter(result =>
        result.duration === filters.duration
      );
    }
    if (filters.language.length > 0) {
      filteredResults = filteredResults.filter(result =>
        filters.language.includes(result.language)
      );
    }
    if (filters.documentType.length > 0) {
      filteredResults = filteredResults.filter(result =>
        filters.documentType.includes((result as any).documentType)
      );
    }
    if (filters.program.length > 0) {
      filteredResults = filteredResults.filter(result =>
        filters.program.includes((result as any).program)
      );
    }
    if (filters.channel.length > 0) {
      filteredResults = filteredResults.filter(result =>
        filters.channel.includes((result as any).channel)
      );
    }

    return filteredResults.length;
  }, [allData, query, filters]);

  const totalPages = useMemo(() => {
    return Math.ceil(totalResults / resultsPerPage);
  }, [totalResults, resultsPerPage]);

  const hasActiveFilters = useMemo(() => {
    return (
      query !== '' ||
      filters.resourceType.length > 0 ||
      filters.subject.length > 0 ||
      filters.author.length > 0 ||
      filters.year !== '' ||
      filters.duration !== '' ||
      filters.language.length > 0 ||
      filters.documentType.length > 0 ||
      filters.program.length > 0 ||
      filters.channel.length > 0
    );
  }, [query, filters]);

  const handleFilterChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  return {
    query,
    filters,
    sortBy,
    currentResults,
    totalResults,
    totalPages,
    currentPage,
    loading: dataLoading,
    hasActiveFilters,
    usingFallback: false,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    setQuery,
    forceRefresh
  };
};
