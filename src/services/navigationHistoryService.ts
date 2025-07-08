
export class NavigationHistoryService {
  private static readonly STORAGE_KEY = 'lsb_navigation_history';
  private static instance: NavigationHistoryService;

  private constructor() {}

  static getInstance(): NavigationHistoryService {
    if (!NavigationHistoryService.instance) {
      NavigationHistoryService.instance = new NavigationHistoryService();
    }
    return NavigationHistoryService.instance;
  }

  saveSearchContext(searchParams: URLSearchParams): void {
    try {
      const searchData = {
        query: searchParams.get('q') || '',
        type: searchParams.get('type') || '',
        subject: searchParams.get('subject') || '',
        author: searchParams.get('author') || '',
        year: searchParams.get('year') || '',
        page: searchParams.get('page') || '1',
        sortBy: searchParams.get('sortBy') || 'relevance',
        timestamp: Date.now()
      };
      
      sessionStorage.setItem(NavigationHistoryService.STORAGE_KEY, JSON.stringify(searchData));
      console.log('🔄 Navigation context saved:', searchData);
    } catch (error) {
      console.warn('⚠️ Failed to save navigation context:', error);
    }
  }

  getLastSearchUrl(): string | null {
    try {
      const stored = sessionStorage.getItem(NavigationHistoryService.STORAGE_KEY);
      if (!stored) return null;

      const searchData = JSON.parse(stored);
      
      // Check if data is not too old (24 hours)
      const isStale = Date.now() - (searchData.timestamp || 0) > 24 * 60 * 60 * 1000;
      if (isStale) {
        this.clearHistory();
        return null;
      }

      // Reconstruct URL with search parameters
      const params = new URLSearchParams();
      
      if (searchData.query) params.set('q', searchData.query);
      if (searchData.type) params.set('type', searchData.type);
      if (searchData.subject) params.set('subject', searchData.subject);
      if (searchData.author) params.set('author', searchData.author);
      if (searchData.year) params.set('year', searchData.year);
      if (searchData.page && searchData.page !== '1') params.set('page', searchData.page);
      if (searchData.sortBy && searchData.sortBy !== 'relevance') params.set('sortBy', searchData.sortBy);

      const queryString = params.toString();
      const url = queryString ? `/buscar?${queryString}` : '/buscar';
      
      console.log('🔙 Retrieved last search URL:', url);
      return url;
    } catch (error) {
      console.warn('⚠️ Failed to retrieve navigation context:', error);
      return null;
    }
  }

  // Get default search URL with video filter when no history exists
  getDefaultVideoSearchUrl(): string {
    return '/buscar?type=video';
  }

  clearHistory(): void {
    try {
      sessionStorage.removeItem(NavigationHistoryService.STORAGE_KEY);
      console.log('🧹 Navigation history cleared');
    } catch (error) {
      console.warn('⚠️ Failed to clear navigation history:', error);
    }
  }

  // Save current search context from location
  saveCurrentSearch(location: { search: string }): void {
    const searchParams = new URLSearchParams(location.search);
    this.saveSearchContext(searchParams);
  }
}

export const navigationHistoryService = NavigationHistoryService.getInstance();
