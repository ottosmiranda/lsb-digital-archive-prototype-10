
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import SearchHeader from '@/components/SearchHeader';
import SearchFilters from '@/components/SearchFilters';
import SearchResultsGrid from '@/components/SearchResultsGrid';
import EmptySearchState from '@/components/EmptySearchState';
import Footer from '@/components/Footer';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    resourceType: [],
    subject: [],
    author: '',
    year: '',
    duration: ''
  });
  const [sortBy, setSortBy] = useState('relevance');
  const [allResults, setAllResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const resultsPerPage = 9;

  const query = searchParams.get('q') || '';
  
  // Memoize appliedFilters to prevent infinite loops
  const appliedFilters = useMemo(() => {
    return searchParams.getAll('filtros') || [];
  }, [searchParams]);

  // Calculate pagination values
  const totalResults = allResults.length;
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = allResults.slice(startIndex, endIndex);
  const hasMore = currentPage < totalPages;

  // Initialize filters from URL params only once
  useEffect(() => {
    if (appliedFilters.length > 0) {
      setFilters(prev => ({
        ...prev,
        resourceType: appliedFilters
      }));
    }
  }, []); // Only run once on mount

  // Perform search when query changes or on initial load
  useEffect(() => {
    console.log('Search triggered with query:', query);
    performSearch(query, filters);
    setCurrentPage(1); // Reset to first page on new search
  }, [query]); // Only depend on query changes

  // Perform search when filters change
  useEffect(() => {
    if (query || hasActiveFilters(filters)) {
      console.log('Filter search triggered with filters:', filters);
      performSearch(query, filters);
      setCurrentPage(1); // Reset to first page on filter change
    }
  }, [filters]); // Depend on filter changes

  // Sort results when sortBy changes
  useEffect(() => {
    if (allResults.length > 0) {
      console.log('Sorting results by:', sortBy);
      const sortedResults = sortResults([...allResults], sortBy);
      setAllResults(sortedResults);
      setCurrentPage(1); // Reset to first page on sort change
    }
  }, [sortBy]);

  const hasActiveFilters = (filterObj: any) => {
    return filterObj.resourceType.length > 0 || 
           filterObj.subject.length > 0 || 
           filterObj.author || 
           filterObj.year || 
           filterObj.duration;
  };

  const sortResults = (resultsToSort: any[], sortType: string) => {
    switch (sortType) {
      case 'recent':
        return resultsToSort.sort((a, b) => b.year - a.year);
      
      case 'accessed':
        // Mock implementation - in real app this would use actual access data
        return resultsToSort.sort(() => Math.random() - 0.5);
      
      case 'type':
        const typeOrder = { 'video': 0, 'podcast': 1, 'titulo': 2 };
        return resultsToSort.sort((a, b) => {
          const aOrder = typeOrder[a.type] ?? 3;
          const bOrder = typeOrder[b.type] ?? 3;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return a.title.localeCompare(b.title);
        });
      
      case 'relevance':
      default:
        // For relevance, we'll sort by a combination of factors
        return resultsToSort.sort((a, b) => {
          // Mock relevance score based on title match and year
          const queryLower = query.toLowerCase();
          const aRelevance = a.title.toLowerCase().includes(queryLower) ? 2 : 0;
          const bRelevance = b.title.toLowerCase().includes(queryLower) ? 2 : 0;
          
          const aScore = aRelevance + (a.year / 1000); // Newer items get slight boost
          const bScore = bRelevance + (b.year / 1000);
          
          return bScore - aScore;
        });
    }
  };

  const performSearch = (searchQuery: string, currentFilters: any) => {
    setLoading(true);
    console.log('Performing search with:', { searchQuery, currentFilters });
    
    setTimeout(() => {
      if (searchQuery || hasActiveFilters(currentFilters)) {
        const searchResults = generateMockResults(searchQuery, currentFilters);
        const sortedResults = sortResults(searchResults, sortBy);
        console.log('Search results:', sortedResults);
        setAllResults(sortedResults);
      } else {
        setAllResults([]);
      }
      setLoading(false);
    }, 500);
  };

  const generateMockResults = (searchQuery: string, currentFilters: any) => {
    const mockData = [
      {
        id: 1,
        title: 'Introdução à Libras',
        type: 'video',
        author: 'Prof. Maria Silva',
        duration: '25:30',
        thumbnail: '/placeholder.svg',
        description: 'Curso básico de Língua Brasileira de Sinais para iniciantes.',
        year: 2023,
        subject: 'Educação'
      },
      {
        id: 2,
        title: 'História da Comunidade Surda',
        type: 'titulo',
        author: 'João Santos',
        pages: 245,
        description: 'Uma análise histórica da evolução da comunidade surda no Brasil.',
        year: 2022,
        subject: 'História'
      },
      {
        id: 3,
        title: 'Podcast Mãos que Falam',
        type: 'podcast',
        author: 'Ana Costa',
        duration: '45:20',
        description: 'Conversas sobre inclusão e acessibilidade.',
        year: 2023,
        subject: 'Inclusão'
      },
      {
        id: 4,
        title: 'Cultura Surda no Brasil',
        type: 'titulo',
        author: 'Maria Silva',
        pages: 180,
        description: 'Explorando a rica cultura da comunidade surda brasileira.',
        year: 2023,
        subject: 'Cultura Surda'
      },
      {
        id: 5,
        title: 'Tecnologia Assistiva para Surdos',
        type: 'video',
        author: 'Carlos Oliveira',
        duration: '15:45',
        description: 'Como a tecnologia pode ajudar na inclusão de pessoas surdas.',
        year: 2022,
        subject: 'Tecnologia'
      }
    ];

    return mockData.filter(item => {
      // Filter by search query
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        const matchesQuery = item.title.toLowerCase().includes(queryLower) ||
                           item.description.toLowerCase().includes(queryLower) ||
                           item.author.toLowerCase().includes(queryLower) ||
                           item.subject.toLowerCase().includes(queryLower);
        if (!matchesQuery) return false;
      }

      // Filter by resource type
      if (currentFilters.resourceType.length > 0) {
        if (!currentFilters.resourceType.includes(item.type)) return false;
      }

      // Filter by subject
      if (currentFilters.subject.length > 0) {
        if (!currentFilters.subject.includes(item.subject)) return false;
      }

      // Filter by author
      if (currentFilters.author) {
        const authorLower = currentFilters.author.toLowerCase();
        if (!item.author.toLowerCase().includes(authorLower)) return false;
      }

      // Filter by year
      if (currentFilters.year) {
        if (item.year.toString() !== currentFilters.year) return false;
      }

      // Filter by duration (for videos and podcasts)
      if (currentFilters.duration && (item.type === 'video' || item.type === 'podcast')) {
        const duration = item.duration;
        if (duration) {
          const [minutes] = duration.split(':').map(Number);
          switch (currentFilters.duration) {
            case 'short':
              if (minutes > 10) return false;
              break;
            case 'medium':
              if (minutes <= 10 || minutes > 30) return false;
              break;
            case 'long':
              if (minutes <= 30) return false;
              break;
          }
        }
      }

      return true;
    });
  };

  const handleFilterChange = (newFilters: any) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
  };

  const handleSortChange = (newSort: string) => {
    console.log('Sort changed to:', newSort);
    setSortBy(newSort);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasResults = allResults.length > 0;
  const showEmptyState = !loading && !hasResults && (query || hasActiveFilters(filters));

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchHeader 
          query={query}
          resultCount={totalResults}
          sortBy={sortBy}
          onSortChange={handleSortChange}
        />
        
        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          <SearchFilters 
            filters={filters}
            onFiltersChange={handleFilterChange}
          />
          
          <div className="flex-1">
            {showEmptyState ? (
              <EmptySearchState 
                query={query} 
                onClearFilters={() => setFilters({
                  resourceType: [],
                  subject: [],
                  author: '',
                  year: '',
                  duration: ''
                })} 
              />
            ) : (
              <>
                <SearchResultsGrid 
                  results={currentResults}
                  loading={loading}
                  hasMore={hasMore}
                />
                
                {hasResults && totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SearchResults;
