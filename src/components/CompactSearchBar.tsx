
import { Search, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearchForm } from '@/hooks/useSearchForm';
import SearchSuggestions from '@/components/SearchSuggestions';

const CompactSearchBar = () => {
  const {
    searchQuery,
    setSearchQuery,
    showSuggestions,
    searchRef,
    inputRef,
    handleSearch,
    handleSuggestionClick,
    handleSearchFocus,
  } = useSearchForm();

  return (
    <div className="relative w-full max-w-xs" ref={searchRef}>
      <form onSubmit={handleSearch} className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleSearchFocus}
          className="w-full pl-4 pr-16 py-2 bg-white/95 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-lsb-accent focus:border-transparent"
        />
        <div className="absolute right-1 top-1 bottom-1 flex items-center gap-1">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
            <Command className="h-2.5 w-2.5" />
            K
          </kbd>
          <Button
            type="submit"
            size="sm"
            className="px-2 py-1 bg-lsb-accent hover:bg-lsb-accent/90 text-lsb-primary rounded-md"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>

      <SearchSuggestions
        query={searchQuery}
        onSuggestionClick={handleSuggestionClick}
        onClose={() => {}}
        isVisible={showSuggestions}
        className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg z-[9999]"
      />
    </div>
  );
};

export default CompactSearchBar;
