
import { SearchResult } from '@/types/searchTypes';
import { supabase } from '@/integrations/supabase/client';

export class DataService {
  private static instance: DataService;
  private cachedData: SearchResult[] | null = null;
  private loadingPromise: Promise<SearchResult[]> | null = null;
  private lastLoadTime: number = 0;
  private maxCacheAge: number = 30 * 60 * 1000; // 30 minutes in milliseconds

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
    console.log('📡 Starting PARALLEL API fetch (Videos + Books + Podcasts)...');
    
    // Fetch all APIs in parallel for maximum speed
    const [videosResult, booksResult, podcastsResult] = await Promise.allSettled([
      this.fetchVideosFromAPI(),
      this.fetchBooksFromAPI(), 
      this.fetchPodcastsFromAPI()
    ]);

    const results: SearchResult[] = [];
    const errors: string[] = [];

    // Process videos result
    if (videosResult.status === 'fulfilled') {
      results.push(...videosResult.value);
      console.log('🎬 Videos fetched:', videosResult.value.length);
      
      // Log video IDs for debugging
      if (videosResult.value.length > 0) {
        console.log('🎬 Video IDs preview:', videosResult.value.slice(0, 3).map(v => ({
          id: v.id,
          originalId: v.originalId,
          title: v.title
        })));
      }
    } else {
      console.error('❌ Failed to fetch videos:', videosResult.reason);
      errors.push('videos');
    }

    // Process books result
    if (booksResult.status === 'fulfilled') {
      results.push(...booksResult.value);
      console.log('📚 Books fetched:', booksResult.value.length);
    } else {
      console.error('❌ Failed to fetch books:', booksResult.reason);
      errors.push('books');
    }

    // Process podcasts result
    if (podcastsResult.status === 'fulfilled') {
      results.push(...podcastsResult.value);
      console.log('🎧 Podcasts fetched:', podcastsResult.value.length);
      
      // Log podcast IDs for debugging
      if (podcastsResult.value.length > 0) {
        console.log('🎧 Podcast IDs preview:', podcastsResult.value.slice(0, 3).map(p => ({
          id: p.id,
          originalId: p.originalId,
          title: p.title
        })));
      }
    } else {
      console.error('❌ Failed to fetch podcasts:', podcastsResult.reason);
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
    console.log('🎬 Fetching ALL videos from API with complete pagination...');
    
    const allVideos: SearchResult[] = [];
    let page = 1;
    let totalPages = 1;
    
    do {
      console.log(`📄 Fetching videos page ${page}/${totalPages}...`);
      
      const { data, error } = await supabase.functions.invoke('fetch-videos', {
        body: { page, limit: 50 } // Increased limit for efficiency
      });
      
      if (error) {
        console.error(`❌ Videos page ${page} error:`, error);
        throw error;
      }

      if (!data.success) {
        console.error(`❌ Videos page ${page} API error:`, data.error);
        throw new Error(data.error);
      }

      // Add videos from this page
      allVideos.push(...data.videos);
      totalPages = data.totalPages;
      
      console.log(`✅ Page ${page}: ${data.videos.length} videos loaded (total so far: ${allVideos.length})`);
      
      // Log IDs for debugging on first few pages
      if (page <= 2) {
        console.log(`🎬 Video IDs from page ${page}:`, data.videos.slice(0, 3).map(v => ({
          id: v.id,
          originalId: v.originalId,
          title: v.title.substring(0, 30) + '...'
        })));
      }
      
      page++;
      
    } while (page <= totalPages);
    
    console.log(`🎉 ALL videos loaded: ${allVideos.length} total videos from ${totalPages} pages`);
    
    // Final summary of video IDs for debugging
    console.log('🎬 Final video ID ranges:', {
      minId: Math.min(...allVideos.map(v => v.id)),
      maxId: Math.max(...allVideos.map(v => v.id)),
      sampleOriginalIds: allVideos.slice(0, 5).map(v => v.originalId),
      totalCount: allVideos.length
    });
    
    return allVideos;
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
    console.log('🎧 Fetching ALL podcasts from API with complete pagination...');
    
    const allPodcasts: SearchResult[] = [];
    let page = 1;
    let totalPages = 1;
    
    do {
      console.log(`📄 Fetching podcasts page ${page}/${totalPages}...`);
      
      const { data, error } = await supabase.functions.invoke('fetch-podcasts', {
        body: { page, limit: 50 } // Increased limit for efficiency
      });
      
      if (error) {
        console.error(`❌ Podcasts page ${page} error:`, error);
        throw error;
      }

      if (!data.success) {
        console.error(`❌ Podcasts page ${page} API error:`, data.error);
        throw new Error(data.error);
      }

      // Add podcasts from this page
      allPodcasts.push(...data.podcasts);
      totalPages = data.totalPages;
      
      console.log(`✅ Page ${page}: ${data.podcasts.length} podcasts loaded (total so far: ${allPodcasts.length})`);
      
      // Log IDs for debugging on first few pages
      if (page <= 2) {
        console.log(`🎧 Podcast IDs from page ${page}:`, data.podcasts.slice(0, 3).map(p => ({
          id: p.id,
          originalId: p.originalId,
          title: p.title.substring(0, 30) + '...'
        })));
      }
      
      page++;
      
    } while (page <= totalPages);
    
    console.log(`🎉 ALL podcasts loaded: ${allPodcasts.length} total podcasts from ${totalPages} pages`);
    
    // Final summary of podcast IDs for debugging
    console.log('🎧 Final podcast ID ranges:', {
      minId: Math.min(...allPodcasts.map(p => p.id)),
      maxId: Math.max(...allPodcasts.map(p => p.id)),
      sampleOriginalIds: allPodcasts.slice(0, 5).map(p => p.originalId),
      totalCount: allPodcasts.length
    });
    
    return allPodcasts;
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
