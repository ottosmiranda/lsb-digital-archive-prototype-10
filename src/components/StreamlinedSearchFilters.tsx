
import React, { useState, useCallback } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { SearchFilters, SearchResult } from '@/types/searchTypes';
import { ContentCounts } from '@/services/api/apiConfig';
import DynamicFilterContent from '@/components/DynamicFilterContent';
import { useContentAwareFilters } from '@/hooks/useContentAwareFilters';

interface StreamlinedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters, options?: { authorTyping?: boolean }) => void;
  currentResults?: SearchResult[];
  activeContentType?: string;
  globalContentCounts?: ContentCounts;
  isMobile?: boolean;
}

const StreamlinedSearchFilters = React.memo(({ 
  filters, 
  onFiltersChange, 
  currentResults = [],
  activeContentType = 'all',
  globalContentCounts,
  isMobile = false
}: StreamlinedSearchFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const { defaultOpenSections } = useContentAwareFilters({
    currentResults,
    activeContentType
  });

  const [openSections, setOpenSections] = useState(defaultOpenSections);

  const hasActiveFilters = 
    filters.documentType.length > 0 ||
    filters.language.length > 0 ||
    filters.subject.length > 0 || 
    filters.author.length > 0 ||
    filters.year || 
    filters.duration;

  const activeFilterCount = 
    filters.documentType.length +
    filters.language.length +
    filters.subject.length + 
    filters.author.length +
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
      <div className="hidden lg:block w-full">
        <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24 shadow-sm">
          <h3 className="font-semibold text-lg mb-4 lsb-primary flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </h3>
          <DynamicFilterContent
            filters={filters}
            onFiltersChange={onFiltersChange}
            currentResults={currentResults}
            openSections={openSections}
            onToggleSection={toggleSection}
            activeContentType={activeContentType}
            globalContentCounts={globalContentCounts}
          />
        </div>
      </div>

      {/* ✅ Mobile - Sempre mostra o botão de filtros */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full mb-0 h-12 text-left justify-start"
              size="lg"
            >
              <Filter className="h-4 w-4 mr-2" />
              <span className="flex-1">Filtros</span>
              {hasActiveFilters && (
                <Badge className="ml-2 bg-lsb-accent text-lsb-primary">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="w-[90vw] max-w-[400px] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Busca
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <DynamicFilterContent
                filters={filters}
                onFiltersChange={onFiltersChange}
                currentResults={currentResults}
                openSections={openSections}
                onToggleSection={toggleSection}
                activeContentType={activeContentType}
                globalContentCounts={globalContentCounts}
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
