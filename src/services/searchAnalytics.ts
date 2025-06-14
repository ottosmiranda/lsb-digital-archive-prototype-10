
interface SearchEntry {
  query: string;
  timestamp: number;
  count: number;
}

interface SearchAnalytics {
  recentSearches: SearchEntry[];
  searchCounts: Map<string, number>;
  lastCleanup: number;
}

const STORAGE_KEY = 'lsb_search_analytics';
const MAX_RECENT_SEARCHES = 15;
const MAX_TRENDING_SEARCHES = 10;
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const RECENT_SEARCH_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

class SearchAnalyticsService {
  private analytics: SearchAnalytics;

  constructor() {
    this.analytics = this.loadAnalytics();
    this.cleanupOldData();
  }

  private loadAnalytics(): SearchAnalytics {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          recentSearches: parsed.recentSearches || [],
          searchCounts: new Map(parsed.searchCounts || []),
          lastCleanup: parsed.lastCleanup || Date.now()
        };
      }
    } catch (error) {
      console.warn('Failed to load search analytics:', error);
    }

    return {
      recentSearches: [],
      searchCounts: new Map(),
      lastCleanup: Date.now()
    };
  }

  private saveAnalytics(): void {
    try {
      const data = {
        recentSearches: this.analytics.recentSearches,
        searchCounts: Array.from(this.analytics.searchCounts.entries()),
        lastCleanup: this.analytics.lastCleanup
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save search analytics:', error);
    }
  }

  private cleanupOldData(): void {
    const now = Date.now();
    
    // Only cleanup if it's been more than the cleanup interval
    if (now - this.analytics.lastCleanup < CLEANUP_INTERVAL) {
      return;
    }

    // Remove old recent searches
    this.analytics.recentSearches = this.analytics.recentSearches.filter(
      entry => now - entry.timestamp < RECENT_SEARCH_EXPIRY
    );

    this.analytics.lastCleanup = now;
    this.saveAnalytics();
  }

  trackSearch(query: string): void {
    if (!query.trim()) return;

    const normalizedQuery = query.trim().toLowerCase();
    const now = Date.now();

    // Update search count
    const currentCount = this.analytics.searchCounts.get(normalizedQuery) || 0;
    this.analytics.searchCounts.set(normalizedQuery, currentCount + 1);

    // Add to recent searches (remove if already exists to avoid duplicates)
    this.analytics.recentSearches = this.analytics.recentSearches.filter(
      entry => entry.query.toLowerCase() !== normalizedQuery
    );

    // Add to beginning of recent searches
    this.analytics.recentSearches.unshift({
      query: query.trim(),
      timestamp: now,
      count: currentCount + 1
    });

    // Limit recent searches
    this.analytics.recentSearches = this.analytics.recentSearches.slice(0, MAX_RECENT_SEARCHES);

    this.saveAnalytics();
  }

  getRecentSearches(): string[] {
    this.cleanupOldData();
    return this.analytics.recentSearches.map(entry => entry.query);
  }

  getTrendingSearches(): string[] {
    const now = Date.now();
    const recentThreshold = 3 * 24 * 60 * 60 * 1000; // 3 days for trending

    // Get searches from recent period
    const recentSearches = this.analytics.recentSearches.filter(
      entry => now - entry.timestamp < recentThreshold
    );

    // Calculate trending score (frequency + recency)
    const trendingScores = new Map<string, number>();
    
    recentSearches.forEach(entry => {
      const ageInHours = (now - entry.timestamp) / (60 * 60 * 1000);
      const recencyScore = Math.max(0, 1 - ageInHours / 72); // Decay over 72 hours
      const frequencyScore = entry.count;
      const totalScore = frequencyScore * (1 + recencyScore);
      
      const current = trendingScores.get(entry.query.toLowerCase()) || 0;
      trendingScores.set(entry.query.toLowerCase(), current + totalScore);
    });

    // Sort by score and return top results
    return Array.from(trendingScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_TRENDING_SEARCHES)
      .map(([query]) => {
        // Find original casing
        const original = recentSearches.find(
          entry => entry.query.toLowerCase() === query
        );
        return original?.query || query;
      });
  }

  clearHistory(): void {
    this.analytics = {
      recentSearches: [],
      searchCounts: new Map(),
      lastCleanup: Date.now()
    };
    this.saveAnalytics();
  }

  getSearchCount(query: string): number {
    return this.analytics.searchCounts.get(query.toLowerCase()) || 0;
  }
}

export const searchAnalytics = new SearchAnalyticsService();
