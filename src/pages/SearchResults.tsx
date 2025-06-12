
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import SearchHeader from '@/components/SearchHeader';
import SearchFilters from '@/components/SearchFilters';
import SearchResultsGrid from '@/components/SearchResultsGrid';
import EmptySearchState from '@/components/EmptySearchState';
import Footer from '@/components/Footer';

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
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const query = searchParams.get('q') || '';
  const appliedFilters = searchParams.getAll('filtros') || [];

  useEffect(() => {
    // Initialize filters from URL params
    setFilters(prev => ({
      ...prev,
      resourceType: appliedFilters
    }));
    
    // Simulate search with mock data
    setLoading(true);
    setTimeout(() => {
      if (query || appliedFilters.length > 0) {
        setResults(generateMockResults(query, appliedFilters));
      } else {
        setResults([]);
      }
      setLoading(false);
    }, 500);
  }, [query, appliedFilters]);

  const generateMockResults = (searchQuery: string, filters: string[]) => {
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
      }
    ];

    return mockData.filter(item => {
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filters.length > 0 && !filters.includes(item.type)) {
        return false;
      }
      return true;
    });
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
  };

  const hasResults = results.length > 0;
  const showEmptyState = !loading && !hasResults && (query || appliedFilters.length > 0);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchHeader 
          query={query}
          resultCount={results.length}
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
              <EmptySearchState query={query} onClearFilters={() => setFilters({})} />
            ) : (
              <SearchResultsGrid 
                results={results}
                loading={loading}
                hasMore={hasMore}
              />
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SearchResults;
