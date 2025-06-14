
import React, { useState, useCallback } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { SearchFilters, SearchResult } from '@/types/searchTypes';
import FilterContent from '@/components/FilterContent';

interface StreamlinedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters, options?: { authorTyping?: boolean }) => void;
  currentResults?: SearchResult[];
}

const StreamlinedSearchFilters = React.memo(({ filters, onFiltersChange, currentResults = [] }: StreamlinedSearchFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    subject: true,
    itemType: true,
    author: false,
    language: true,
    year: false,
    duration: false
  });

  const hasActiveFilters = 
    filters.documentType.length > 0 ||
    filters.language.length > 0 ||
    filters.subject.length > 0 || 
    filters.author || 
    filters.year || 
    filters.duration;

  const activeFilterCount = 
    filters.documentType.length +
    filters.language.length +
    filters.subject.length + 
    (filters.author ? 1 : 0) + 
    (filters.year ? 1 : 0) + 
    (filters.duration ? 1 : 0);

  const toggleSection = useCallback((section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 shrink-0">
        <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24 shadow-sm">
          <h3 className="font-semibold text-lg mb-4 lsb-primary flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </h3>
          <FilterContent
            filters={filters}
            onFiltersChange={onFiltersChange}
            currentResults={currentResults}
            openSections={openSections}
            onToggleSection={toggleSection}
          />
        </div>
      </div>

      {/* Mobile Sheet */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full mb-4 h-12">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <Badge className="ml-2 bg-lsb-accent text-lsb-primary">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Busca
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent
                filters={filters}
                onFiltersChange={onFiltersChange}
                currentResults={currentResults}
                openSections={openSections}
                onToggleSection={toggleSection}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
});

StreamlinedSearchFilters.displayName = 'StreamlinedSearchFilters';

export default StreamlinedSearchFilters;
