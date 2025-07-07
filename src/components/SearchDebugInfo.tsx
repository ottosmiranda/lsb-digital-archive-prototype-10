
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchFilters } from '@/types/searchTypes';

interface SearchDebugInfoProps {
  filters: SearchFilters;
  totalResults: number;
  loading: boolean;
  hasActiveFilters: boolean;
  usingFallback?: boolean;
}

const SearchDebugInfo: React.FC<SearchDebugInfoProps> = ({
  filters,
  totalResults,
  loading,
  hasActiveFilters,
  usingFallback = false
}) => {
  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const isGlobalSearch = filters.resourceType.includes('all') || 
    (filters.resourceType.length === 0 && !hasActiveFilters);

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-blue-800">Debug Info (Dev Only)</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="font-medium text-blue-700">Status:</span>
            <Badge variant={loading ? "secondary" : "default"} className="ml-1">
              {loading ? "Loading" : "Ready"}
            </Badge>
          </div>
          
          <div>
            <span className="font-medium text-blue-700">Search Type:</span>
            <Badge variant={isGlobalSearch ? "outline" : "secondary"} className="ml-1">
              {isGlobalSearch ? "Global (Todos)" : "Filtered"}
            </Badge>
          </div>
          
          <div>
            <span className="font-medium text-blue-700">Results:</span>
            <Badge variant="default" className="ml-1">
              {totalResults}
            </Badge>
          </div>
          
          <div>
            <span className="font-medium text-blue-700">Data Source:</span>
            <Badge variant={usingFallback ? "destructive" : "default"} className="ml-1">
              {usingFallback ? "Fallback" : "API"}
            </Badge>
          </div>
        </div>
        
        <div className="mt-2">
          <span className="font-medium text-blue-700 text-xs">Resource Types:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {filters.resourceType.length === 0 ? (
              <Badge variant="outline" className="text-xs">None</Badge>
            ) : (
              filters.resourceType.map(type => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type}
                </Badge>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchDebugInfo;
