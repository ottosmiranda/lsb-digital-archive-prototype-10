export interface SearchResult {
  id: number;
  title: string;
  type: 'video' | 'titulo' | 'podcast';
  author: string;
  duration?: string;
  pages?: number;
  thumbnail?: string;
  description: string;
  year: number;
  subject: string;
  pais?: string; // Added for language filtering
}

export interface SearchFilters {
  resourceType: string[]; // This was previously used for item type, let's clarify or rename if needed.
                          // For now, I'll assume resourceType is distinct and add itemType.
                          // Based on SearchLayout.tsx, resourceType is indeed used for item type filtering via tabs.
                          // The new "Tipo de Item" filter will be more granular or could replace this.
                          // For now, let's stick to the plan and add a new `itemType` for the sidebar filter.
                          // If `resourceType` from tabs and `itemType` from sidebar filters are meant to be the same,
                          // this will need consolidation later.
                          // Let's assume `resourceType` is for the top tabs, and the new filter is `itemType` for the sidebar.
                          // However, looking at `SearchLayout.tsx` `handleContentTypeChange`, `resourceType` is set based on tabs.
                          // `StreamlinedSearchFilters` doesn't have a `resourceType` filter section.
                          // The plan states: "Tipo de Item" filter with options like: Livros/Artigos (titulo), Vídeos (video), Podcasts (podcast)
                          // This maps directly to the `type` field of SearchResult, and what `resourceType` handles via tabs.
                          // To avoid conflict and simplify, I will make "Tipo de Item" in `StreamlinedSearchFilters` control `SearchFilters.resourceType`.
                          // So, `resourceType` will be the field for "Tipo de Item".

  subject: string[];
  author: string;
  year: string;
  duration: string;
  // New filters as per plan:
  // itemType: string[]; // Replaced by using resourceType for "Tipo de Item"
  language: string[];
}

export interface DataValidationError {
  field: string;
  message: string;
  item: any;
}
