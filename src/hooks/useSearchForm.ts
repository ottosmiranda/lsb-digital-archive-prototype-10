
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useSearchForm = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setShowSuggestions(true);
      }
      
      // Escape to close suggestions
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const queryParams = new URLSearchParams();
      queryParams.set('q', searchQuery);
      activeFilters.forEach(filter => {
        queryParams.append('filtros', filter);
      });
      navigate(`/buscar?${queryParams.toString()}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    navigate(`/buscar?q=${encodeURIComponent(suggestion)}`);
    setShowSuggestions(false);
  };

  const handleSearchFocus = () => {
    setShowSuggestions(true);
  };

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  return {
    searchQuery,
    setSearchQuery,
    showSuggestions,
    setShowSuggestions,
    activeFilters,
    setActiveFilters,
    toggleFilter,
    searchRef,
    inputRef,
    handleSearch,
    handleSuggestionClick,
    handleSearchFocus,
  };
};
