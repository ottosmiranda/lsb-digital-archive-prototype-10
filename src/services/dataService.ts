import { SearchResult } from '@/types/searchTypes';
import { supabase } from '@/integrations/supabase/client';

export class DataService {
  private static instance: DataService;
  private cachedData: SearchResult[] | null = null;
  private loadingPromise: Promise<SearchResult[]> | null = null;
  private lastLoadTime: number = 0;
  private maxCacheAge: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  async loadData(forceRefresh: boolean = false): Promise<SearchResult[]> {
    console.log('🔄 DataService.loadData called with forceRefresh:', forceRefresh);
    
    // Check if we should force refresh or if cache is stale
    const now = Date.now();
    const cacheIsStale = (now - this.lastLoadTime) > this.maxCacheAge;
    
    if (forceRefresh || cacheIsStale) {
      console.log('🔄 Force refreshing data cache...');
      this.clearCache();
    }

    // Return cached data if available and not forcing refresh
    if (this.cachedData && !forceRefresh && !cacheIsStale) {
      console.log('✅ Returning cached data, length:', this.cachedData.length);
      return this.cachedData;
    }

    // Return existing loading promise if already loading
    if (this.loadingPromise) {
      console.log('⏳ Returning existing loading promise');
      return this.loadingPromise;
    }

    // Start loading data
    console.log('🚀 Starting fresh data load...');
    this.loadingPromise = this.fetchDataFromAPIs();
    
    try {
      this.cachedData = await this.loadingPromise;
      this.lastLoadTime = Date.now();
      console.log('✅ Data loaded successfully, total items:', this.cachedData.length);
      
      // Log data summary for debugging
      const summary = this.cachedData.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('📊 Data summary by type:', summary);
      
      return this.cachedData;
    } catch (error) {
      console.error('❌ Failed to load data, clearing loading promise:', error);
      this.loadingPromise = null;
      throw error;
    }
  }

  private async fetchDataFromAPIs(): Promise<SearchResult[]> {
    console.log('📡 Starting API-only data fetch (Videos + Books + Podcasts)...');
    
    const results: SearchResult[] = [];
    const errors: string[] = [];

    try {
      // Fetch videos from API
      const videos = await this.fetchVideosFromAPI();
      results.push(...videos);
      console.log('🎬 Videos fetched:', videos.length);
      
      // Log video IDs for debugging
      if (videos.length > 0) {
        console.log('🎬 Video IDs preview:', videos.slice(0, 3).map(v => ({
          id: v.id,
          originalId: v.originalId,
          title: v.title
        })));
      }
    } catch (error) {
      console.error('❌ Failed to fetch videos:', error);
      errors.push('videos');
    }

    try {
      // Fetch books from API
      const books = await this.fetchBooksFromAPI();
      results.push(...books);
      console.log('📚 Books fetched:', books.length);
    } catch (error) {
      console.error('❌ Failed to fetch books:', error);
      errors.push('books');
    }

    try {
      // Fetch podcasts from API
      const podcasts = await this.fetchPodcastsFromAPI();
      results.push(...podcasts);
      console.log('🎧 Podcasts fetched:', podcasts.length);
    } catch (error) {
      console.error('❌ Failed to fetch podcasts:', error);
      errors.push('podcasts');
    }

    console.log('🔄 Combined API data, total items:', results.length);

    if (results.length === 0) {
      throw new Error(`Failed to fetch data from all APIs. Failed sources: ${errors.join(', ')}`);
    }

    if (errors.length > 0) {
      console.warn(`⚠️ Some APIs failed: ${errors.join(', ')}, but got ${results.length} items from successful APIs`);
    }

    return results;
  }

  private async fetchVideosFromAPI(): Promise<SearchResult[]> {
    console.log('🎬 Fetching videos from API...');
    
    const { data, error } = await supabase.functions.invoke('fetch-videos');
    
    if (error) {
      console.error('❌ Videos edge function error:', error);
      throw error;
    }

    if (!data.success) {
      console.error('❌ Videos API returned error:', data.error);
      throw new Error(data.error);
    }

    console.log('✅ Videos from API:', data.count);
    return data.videos;
  }

  private async fetchBooksFromAPI(): Promise<SearchResult[]> {
    console.log('📚 Fetching books from API...');
    
    const { data, error } = await supabase.functions.invoke('fetch-books');
    
    if (error) {
      console.error('❌ Books edge function error:', error);
      throw error;
    }

    if (!data.success) {
      console.error('❌ Books API returned error:', data.error);
      throw new Error(data.error);
    }

    console.log('✅ Books from API:', data.count);
    return data.books;
  }

  private async fetchPodcastsFromAPI(): Promise<SearchResult[]> {
    console.log('🎧 Fetching podcasts from API...');
    
    const { data, error } = await supabase.functions.invoke('fetch-podcasts');
    
    if (error) {
      console.error('❌ Podcasts edge function error:', error);
      throw error;
    }

    if (!data.success) {
      console.error('❌ Podcasts API returned error:', data.error);
      throw new Error(data.error);
    }

    console.log('✅ Podcasts from API:', data.count);
    return data.podcasts;
  }

  // Clear cache method for manual refresh
  clearCache(): void {
    console.log('🧹 Clearing DataService cache...');
    this.cachedData = null;
    this.loadingPromise = null;
    this.lastLoadTime = 0;
  }

  // Force refresh method
  async forceRefresh(): Promise<SearchResult[]> {
    console.log('🔄 Force refreshing data...');
    return this.loadData(true);
  }

  // Check if using fallback data - now always returns false since we don't use fallbacks
  isUsingFallbackData(): boolean {
    return false;
  }
}

export const dataService = DataService.getInstance();
