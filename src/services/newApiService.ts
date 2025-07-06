
import { SearchResult } from '@/types/searchTypes';

const API_BASE_URL = 'https://link-business-school.onrender.com/api/v1';

interface APIResponse {
  tipo: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  conteudo: any[];
}

export class NewApiService {
  private static instance: NewApiService;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private activeRequests = new Map<string, Promise<SearchResult[]>>();
  private circuitBreaker = {
    failures: 0,
    lastFailTime: 0,
    breakerOpen: false,
    openDuration: 10000 // 10 seconds
  };
  private healthStatus: 'unknown' | 'healthy' | 'unhealthy' = 'unknown';

  private constructor() {
    console.log('🔧 NewApiService - Constructor called with ultra-aggressive timeouts');
    // Start background health monitoring
    this.startHealthMonitoring();
  }

  static getInstance(): NewApiService {
    if (!NewApiService.instance) {
      console.log('🆕 NewApiService - Creating new instance with circuit breaker');
      NewApiService.instance = new NewApiService();
    }
    return NewApiService.instance;
  }

  private startHealthMonitoring(): void {
    // Monitor health every 30 seconds in background
    setInterval(async () => {
      if (!this.circuitBreaker.breakerOpen) {
        const isHealthy = await this.healthCheck();
        console.log(`🔄 Background health check: ${isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
      }
    }, 30000);
  }

  private getCacheKey(tipo: string, page: number, limit: number): string {
    return `${tipo}_${page}_${limit}`;
  }

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      console.log(`📦 Cache MISS for ${cacheKey}`);
      return false;
    }
    
    const now = Date.now();
    const isValid = (now - cached.timestamp) < cached.ttl;
    console.log(`📦 Cache ${isValid ? 'HIT' : 'EXPIRED'} for ${cacheKey}:`, {
      age: Math.round((now - cached.timestamp) / 1000),
      ttl: Math.round(cached.ttl / 1000),
      itemCount: cached.data?.length || 0
    });
    return isValid;
  }

  private setCache(cacheKey: string, data: any, ttl: number = 10 * 60 * 1000): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
    console.log(`📦 Cache SET: ${cacheKey}`, {
      itemCount: data.length,
      ttlMinutes: Math.round(ttl / 60000)
    });
  }

  private transformToSearchResult(item: any, tipo: string): SearchResult {
    console.log(`🔄 Transforming item:`, {
      tipo,
      id: item.id,
      titulo: item.titulo || item.podcast_titulo || item.title
    });
    
    const baseResult: SearchResult = {
      id: Math.floor(Math.random() * 10000) + 1000,
      originalId: item.id,
      title: item.titulo || item.podcast_titulo || item.title || 'Título não disponível',
      author: item.autor || item.canal || 'Link Business School',
      year: item.ano || new Date().getFullYear(),
      description: item.descricao || 'Descrição não disponível',
      subject: this.getSubjectFromCategories(item.categorias) || this.getSubject(tipo),
      type: tipo === 'livro' ? 'titulo' : tipo === 'aula' ? 'video' : 'podcast' as 'titulo' | 'video' | 'podcast',
      thumbnail: item.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png'
    };

    if (tipo === 'livro') {
      baseResult.pdfUrl = item.arquivo;
      baseResult.pages = item.paginas;
      baseResult.language = item.language;
      baseResult.documentType = item.tipo_documento || 'Livro';
    } else if (tipo === 'aula') {
      baseResult.embedUrl = item.embed_url;
      baseResult.duration = item.duracao_ms ? this.formatDuration(item.duracao_ms) : undefined;
    } else if (tipo === 'podcast') {
      baseResult.duration = item.duracao_ms ? this.formatDuration(item.duracao_ms) : undefined;
      baseResult.embedUrl = item.embed_url;
    }

    return baseResult;
  }

  private getSubjectFromCategories(categorias: string[]): string {
    if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
      return '';
    }
    return categorias[0];
  }

  private getSubject(tipo: string): string {
    switch (tipo) {
      case 'livro': return 'Administração';
      case 'aula': return 'Empreendedorismo';
      case 'podcast': return 'Negócios';
      default: return 'Geral';
    }
  }

  private formatDuration(durationMs: number): string {
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  private async healthCheck(): Promise<boolean> {
    const healthUrl = `${API_BASE_URL}/health`;
    const startTime = Date.now();
    
    try {
      console.log('🏥 DIAGNOSTIC Health Check - Starting (3s timeout)...');
      
      // Diagnostic timeout with detailed logging
      const healthPromise = fetch(healthUrl, {
        headers: { 'Accept': 'application/json' }
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.log('⏰ DIAGNOSTIC - Health check timeout after 3s');
          reject(new Error('Health check timeout (3s)'));
        }, 3000);
      });
      
      const response = await Promise.race([healthPromise, timeoutPromise]);
      const duration = Date.now() - startTime;
      const isHealthy = response.ok;
      
      this.healthStatus = isHealthy ? 'healthy' : 'unhealthy';
      
      console.log(`🏥 DIAGNOSTIC Health Check - ${isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}:`, {
        status: response.status,
        duration: `${duration}ms`,
        latency: duration > 2000 ? 'HIGH' : duration > 1000 ? 'MEDIUM' : 'LOW',
        timestamp: new Date().toISOString()
      });
      
      // FASE 4: Dashboard em tempo real
      console.group('📊 API DIAGNOSTIC DASHBOARD');
      console.log(`Health Status: ${this.healthStatus.toUpperCase()}`);
      console.log(`Response Time: ${duration}ms`);
      console.log(`Circuit Breaker: ${this.circuitBreaker.breakerOpen ? 'OPEN' : 'CLOSED'}`);
      console.log(`Failures: ${this.circuitBreaker.failures}`);
      console.log(`Cache Size: ${this.cache.size} entries`);
      console.log(`Active Requests: ${this.activeRequests.size}`);
      console.groupEnd();
      
      return isHealthy;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.healthStatus = 'unhealthy';
      console.error('🏥 DIAGNOSTIC Health Check - ❌ FAILED:', {
        error: error instanceof Error ? error.message : 'Unknown',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      // FASE 4: Alert de problema
      console.warn('🚨 API ALERT: External API is not responding properly');
      
      return false;
    }
  }

  private isCircuitBreakerOpen(): boolean {
    if (!this.circuitBreaker.breakerOpen) return false;
    
    const now = Date.now();
    if (now - this.circuitBreaker.lastFailTime > this.circuitBreaker.openDuration) {
      console.log('🔄 Circuit breaker reset - trying again');
      this.circuitBreaker.breakerOpen = false;
      this.circuitBreaker.failures = 0;
      return false;
    }
    
    console.log('⚡ Circuit breaker OPEN - fast-failing requests');
    return true;
  }

  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailTime = Date.now();
    
    if (this.circuitBreaker.failures >= 2) {
      this.circuitBreaker.breakerOpen = true;
      console.log('⚡ Circuit breaker OPENED - too many failures');
    }
  }

  private recordSuccess(): void {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.breakerOpen = false;
  }

  private async fetchWithUltraTimeout(url: string, requestId: string, timeoutMs: number = 3000): Promise<Response> {
    console.log(`🚀 ${requestId} - DIAGNOSTIC fetch (${timeoutMs}ms timeout)`);
    const startTime = Date.now();
    
    try {
      const fetchPromise = fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'LSB-Digital-Archive/1.0'
        }
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.error(`⏰ ${requestId} - DIAGNOSTIC TIMEOUT (${timeoutMs}ms) - API not responding`);
          reject(new Error(`DIAGNOSTIC timeout (${timeoutMs}ms)`));
        }, timeoutMs);
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      const duration = Date.now() - startTime;
      
      // FASE 4: Advanced monitoring
      console.group(`📊 ${requestId} - DIAGNOSTIC Response Analysis`);
      console.log(`Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
      console.log(`Duration: ${duration}ms`);
      console.log(`Performance: ${duration > 2000 ? '🐌 SLOW' : duration > 1000 ? '⚠️ MEDIUM' : '⚡ FAST'}`);
      console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
      console.groupEnd();
      
      if (response.ok) {
        this.recordSuccess();
        return response;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordFailure();
      
      // FASE 4: Error analysis
      console.group(`❌ ${requestId} - DIAGNOSTIC Error Analysis`);
      console.error(`Error Type: ${error instanceof Error ? error.name : 'Unknown'}`);
      console.error(`Error Message: ${error instanceof Error ? error.message : 'Unknown'}`);
      console.error(`Duration: ${duration}ms`);
      console.error(`Circuit Breaker Status: ${this.circuitBreaker.breakerOpen ? 'WILL OPEN' : 'STILL CLOSED'}`);
      console.error(`Failures Count: ${this.circuitBreaker.failures}`);
      console.groupEnd();
      
      throw error;
    }
  }

  async fetchContent(tipo: 'livro' | 'aula' | 'podcast', page: number = 1, limit: number = 10): Promise<SearchResult[]> {
    const cacheKey = this.getCacheKey(tipo, page, limit);
    const requestId = `${tipo}_${Date.now()}`;
    
    console.group(`🚀 ${requestId} - ULTRA-FAST fetchContent`);
    console.log(`📊 Request details:`, { tipo, page, limit });
    console.log(`⏰ Started at:`, new Date().toISOString());
    
    // Check cache first
    if (this.isValidCache(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      console.log(`📦 Returning cached data (${cached!.data.length} items)`);
      console.groupEnd();
      return cached!.data;
    }

    // Fast-fail if circuit breaker is open
    if (this.isCircuitBreakerOpen()) {
      console.log(`⚡ ${requestId} - Circuit breaker open, using Supabase fallback`);
      console.groupEnd();
      return this.fetchFromSupabaseFallback(tipo);
    }

    // Check for active requests
    if (this.activeRequests.has(cacheKey)) {
      console.log(`⏳ Request already in progress, waiting...`);
      const result = await this.activeRequests.get(cacheKey)!;
      console.groupEnd();
      return result;
    }

    const requestPromise = this.performUltraFastFetch(tipo, page, limit, requestId);
    this.activeRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      console.log(`✅ Request completed successfully (${result.length} items)`);
      console.groupEnd();
      return result;
    } catch (error) {
      console.error(`❌ Request failed, trying Supabase fallback:`, error);
      console.groupEnd();
      return this.fetchFromSupabaseFallback(tipo);
    } finally {
      this.activeRequests.delete(cacheKey);
    }
  }

  private async performUltraFastFetch(tipo: string, page: number, limit: number, requestId: string): Promise<SearchResult[]> {
    const cacheKey = this.getCacheKey(tipo, page, limit);
    const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${page}&limit=${limit}`;
    
    console.log(`🌐 ${requestId} - ULTRA-FAST HTTP request to:`, url);
    
    try {
      // Try with decreasing timeouts: 3s, 2s, 1s
      const timeouts = [3000, 2000, 1000];
      let lastError: Error;
      
      for (let i = 0; i < timeouts.length; i++) {
        const timeout = timeouts[i];
        const attemptId = `${requestId}_attempt_${i + 1}`;
        
        try {
          console.log(`🔥 ${attemptId} - Trying with ${timeout}ms timeout`);
          const response = await this.fetchWithUltraTimeout(url, attemptId, timeout);
          
          console.log(`📄 ${attemptId} - Parsing JSON response...`);
          const rawData: APIResponse = await response.json();
          
          console.log(`📊 ${attemptId} - SUCCESS:`, {
            tipo: rawData.tipo,
            total: rawData.total,
            contentLength: rawData.conteudo?.length || 0
          });
          
          const dataArray = rawData.conteudo || [];
          
          if (dataArray.length === 0) {
            console.warn(`⚠️ ${attemptId} - No content found`);
            return [];
          }
          
          const transformedData = dataArray.map((item: any) => this.transformToSearchResult(item, tipo));
          this.setCache(cacheKey, transformedData, 5 * 60 * 1000); // 5 min cache
          
          console.log(`✅ ${attemptId} - SUCCESS: ${transformedData.length} items`);
          return transformedData;
          
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          console.error(`❌ ${attemptId} - Failed: ${lastError.message}`);
          
          if (i < timeouts.length - 1) {
            console.log(`🔄 ${attemptId} - Trying with faster timeout...`);
          }
        }
      }
      
      throw lastError!;
      
    } catch (error) {
      console.error(`❌ ${requestId} - All ultra-fast attempts failed:`, error);
      throw error;
    }
  }

  private async fetchFromSupabaseFallback(tipo: 'livro' | 'aula' | 'podcast'): Promise<SearchResult[]> {
    console.log(`🔄 Using Supabase fallback for ${tipo}`);
    
    try {
      // Import supabase client dynamically to avoid circular dependencies
      const { supabase } = await import('@/integrations/supabase/client');
      
      let functionName: string;
      switch (tipo) {
        case 'livro':
          functionName = 'fetch-books';
          break;
        case 'aula':
          functionName = 'fetch-videos';
          break;
        case 'podcast':
          functionName = 'fetch-podcasts';
          break;
        default:
          throw new Error(`Unsupported tipo: ${tipo}`);
      }
      
      console.log(`📡 Calling Supabase function: ${functionName}`);
      const { data, error } = await supabase.functions.invoke(functionName);
      
      if (error) {
        console.error(`❌ Supabase ${functionName} error:`, error);
        throw error;
      }
      
      if (!data.success) {
        console.error(`❌ Supabase ${functionName} returned error:`, data.error);
        throw new Error(data.error);
      }
      
      const items = tipo === 'livro' ? data.books : tipo === 'aula' ? data.videos : data.podcasts;
      console.log(`✅ Supabase fallback success: ${items.length} ${tipo}s`);
      
      return items;
      
    } catch (error) {
      console.error(`❌ Supabase fallback failed for ${tipo}:`, error);
      return [];
    }
  }

  async fetchHomepageContent(): Promise<{
    videos: SearchResult[];
    books: SearchResult[];
    podcasts: SearchResult[];
  }> {
    const requestId = `homepage_${Date.now()}`;
    
    console.group(`🏠 ${requestId} - DIAGNOSTIC fetchHomepageContent`);
    console.log(`⏰ Started at:`, new Date().toISOString());
    console.log(`🌡️ Health status: ${this.healthStatus}`);
    console.log(`⚡ Circuit breaker: ${this.circuitBreaker.breakerOpen ? 'OPEN' : 'CLOSED'} (failures: ${this.circuitBreaker.failures})`);
    
    // FASE 4: Real-time dashboard update
    console.group('📊 DIAGNOSTIC REAL-TIME DASHBOARD');
    console.log(`🔄 Active Requests: ${this.activeRequests.size}`);
    console.log(`💾 Cache Size: ${this.cache.size} entries`);
    console.log(`📡 API Health: ${this.healthStatus.toUpperCase()}`);
    console.log(`⚡ Circuit Breaker: ${this.circuitBreaker.breakerOpen ? '🔴 OPEN' : '🟢 CLOSED'}`);
    console.groupEnd();
    
    try {
      // FASE 2: Ultra-fast health check first (3s timeout)
      console.log(`🏥 ${requestId} - DIAGNOSTIC health check with 3s timeout...`);
      const isHealthy = await this.healthCheck();
      
      if (!isHealthy) {
        console.warn(`⚠️ ${requestId} - Health check failed, attempting emergency fallback immediately`);
        const result = await this.fetchAllFromSupabase();
        console.log('🆘 DIAGNOSTIC: Using emergency fallback due to API health failure');
        console.groupEnd();
        return result;
      }
      
      // FASE 2: Progressive loading with 3s timeouts
      console.log(`📡 ${requestId} - Starting DIAGNOSTIC PROGRESSIVE content fetch (3s timeouts)...`);
      
      let books: SearchResult[] = [];
      let videos: SearchResult[] = [];
      let podcasts: SearchResult[] = [];
      
      // FASE 2: Load books first with aggressive timeout
      try {
        console.log(`📚 ${requestId} - Loading books with 3s diagnostic timeout...`);
        const bookStartTime = Date.now();
        books = await this.fetchContent('livro', 1, 6);
        const bookDuration = Date.now() - bookStartTime;
        console.log(`✅ ${requestId} - Books loaded in ${bookDuration}ms: ${books.length} items`);
      } catch (error) {
        console.error(`❌ ${requestId} - Books failed:`, error);
      }
      
      // FASE 2: Load videos second with aggressive timeout
      try {
        console.log(`🎬 ${requestId} - Loading videos with 3s diagnostic timeout...`);
        const videoStartTime = Date.now();
        videos = await this.fetchContent('aula', 1, 6);
        const videoDuration = Date.now() - videoStartTime;
        console.log(`✅ ${requestId} - Videos loaded in ${videoDuration}ms: ${videos.length} items`);
      } catch (error) {
        console.error(`❌ ${requestId} - Videos failed:`, error);
      }
      
      // FASE 2: Load podcasts last with aggressive timeout
      try {
        console.log(`🎧 ${requestId} - Loading podcasts with 3s diagnostic timeout...`);
        const podcastStartTime = Date.now();
        podcasts = await this.fetchContent('podcast', 1, 6);
        const podcastDuration = Date.now() - podcastStartTime;
        console.log(`✅ ${requestId} - Podcasts loaded in ${podcastDuration}ms: ${podcasts.length} items`);
      } catch (error) {
        console.error(`❌ ${requestId} - Podcasts failed:`, error);
      }

      const result = { videos, books, podcasts };
      const totalItems = books.length + videos.length + podcasts.length;

      // FASE 4: Final status report
      console.group('📋 DIAGNOSTIC FINAL REPORT');
      console.log(`📊 Total Items Loaded: ${totalItems}`);
      console.log(`📚 Books: ${books.length}`);
      console.log(`🎬 Videos: ${videos.length}`);
      console.log(`🎧 Podcasts: ${podcasts.length}`);
      console.log(`⏰ Completed at: ${new Date().toISOString()}`);
      console.log(`🎯 Success Rate: ${totalItems > 0 ? '✅ PARTIAL/FULL SUCCESS' : '❌ COMPLETE FAILURE'}`);
      console.groupEnd();

      // FASE 2: If no content was loaded at all, try emergency fallback
      if (totalItems === 0) {
        console.log(`🔄 ${requestId} - No content from external API, using emergency fallback`);
        const fallbackResult = await this.fetchAllFromSupabase();
        console.groupEnd();
        return fallbackResult;
      }

      console.groupEnd();
      return result;
      
    } catch (error) {
      console.error(`❌ ${requestId} - DIAGNOSTIC fetch failed, using emergency fallback:`, error);
      const fallbackResult = await this.fetchAllFromSupabase();
      console.groupEnd();
      return fallbackResult;
    }
  }

  private async fetchAllFromSupabase(): Promise<{
    videos: SearchResult[];
    books: SearchResult[];
    podcasts: SearchResult[];
  }> {
    console.log('🔄 Fetching all content from Supabase as fallback');
    
    try {
      const [booksResult, videosResult, podcastsResult] = await Promise.allSettled([
        this.fetchFromSupabaseFallback('livro'),
        this.fetchFromSupabaseFallback('aula'),
        this.fetchFromSupabaseFallback('podcast')
      ]);

      const books = booksResult.status === 'fulfilled' ? booksResult.value.slice(0, 6) : [];
      const videos = videosResult.status === 'fulfilled' ? videosResult.value.slice(0, 6) : [];
      const podcasts = podcastsResult.status === 'fulfilled' ? podcastsResult.value.slice(0, 6) : [];

      console.log('✅ Supabase fallback complete:', {
        books: books.length,
        videos: videos.length,
        podcasts: podcasts.length
      });

      return { videos, books, podcasts };
      
    } catch (error) {
      console.error('❌ Supabase fallback failed completely:', error);
      return { videos: [], books: [], podcasts: [] };
    }
  }

  clearCache(): void {
    console.log('🧹 Clearing API cache and resetting circuit breaker...');
    const cacheSize = this.cache.size;
    const activeRequests = this.activeRequests.size;
    
    this.cache.clear();
    this.activeRequests.clear();
    this.circuitBreaker = {
      failures: 0,
      lastFailTime: 0,
      breakerOpen: false,
      openDuration: 10000
    };
    this.healthStatus = 'unknown';
    
    console.log(`✅ Cache cleared and circuit breaker reset:`, {
      clearedEntries: cacheSize,
      cancelledRequests: activeRequests
    });
  }

  // Public method to get current status for debugging
  getStatus() {
    return {
      healthStatus: this.healthStatus,
      circuitBreaker: { ...this.circuitBreaker },
      cacheSize: this.cache.size,
      activeRequests: this.activeRequests.size
    };
  }
}

export const newApiService = NewApiService.getInstance();
