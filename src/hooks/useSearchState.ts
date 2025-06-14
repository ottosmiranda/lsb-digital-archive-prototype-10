import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchFilters } from '@/types/searchTypes';

export const useSearchState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filters, setFilters] = useState<SearchFilters>({
    resourceType: [],
    subject: [],
    author: '',
    year: '',
    duration: '',
    language: [], // Added language filter
  });
  
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);

  const query = searchParams.get('q') || '';
  
  const appliedFilters = useMemo(() => {
    // This needs to be more robust if we add more array-type filters to URL params.
    // For now, it's only used for resourceType from URL params.
    // Let's assume this part is specific to how `filtros` URL param was initially designed
    // for resourceType and doesn't need to change for sidebar-managed filters unless explicitly required.
    return searchParams.getAll('filtros') || [];
  }, [searchParams]);

  // Initialize filters from URL params only once
  useEffect(() => {
    // This useEffect populates filters.resourceType from the 'filtros' URL search parameter.
    // This is related to how the tabs might set the URL.
    // The new language filter will be managed by the sidebar, not directly by this 'filtros' param.
    const resourceTypesFromUrl = searchParams.getAll('filtros');
    const languageFromUrl = searchParams.getAll('lang'); // Example: if we decide to put lang in URL

    // For now, let's stick to initializing resourceType as it was.
    // The new filters will be initialized as empty and set by user interaction.
    if (resourceTypesFromUrl.length > 0) {
      setFilters(prev => ({
        ...prev,
        resourceType: resourceTypesFromUrl
      }));
    }
    // If we want to initialize language from URL too:
    // if (languageFromUrl.length > 0) {
    //   setFilters(prev => ({ ...prev, language: languageFromUrl }));
    // }
  }, []); // Removed searchParams from dependency array to ensure it runs only once for initial setup.

  const setQuery = (newQuery: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (newQuery) {
      newSearchParams.set('q', newQuery);
    } else {
      newSearchParams.delete('q');
    }
    // Reset page to 1 when query changes
    // newSearchParams.delete('pagina'); // Or set to 1, depending on desired behavior.
    // setCurrentPage(1); // This hook does not set searchParams for page, SearchResults.tsx does.
    setSearchParams(newSearchParams);
  };

  // Function to update filters and URL search params accordingly
  const updateFilters = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    // Optionally, update URL search params when filters change
    // This part can get complex depending on how we want to represent filters in the URL
    // For now, let `useSearchResults` handle URL updates if needed, or keep it simple.
    // The existing code does not update URL for sidebar filters, only for query and `filtros` (resourceType from tabs).
  };

  return {
    query,
    filters,
    sortBy,
    currentPage,
    setFilters: updateFilters, // Use the new updateFilters
    setSortBy,
    setCurrentPage,
    setQuery
  };
};
