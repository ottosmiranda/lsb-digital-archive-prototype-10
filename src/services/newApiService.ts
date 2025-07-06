import { SearchResult } from '@/types/searchTypes';
import { ApiTimeoutManager } from './apiTimeoutManager';

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
  private timeoutManager = new ApiTimeoutManager();
  private circuitBreaker = {
    failures: 0,
    lastFailTime: 0,
    breakerOpen: false,
    openDuration: 10000 // 10 seconds
  };
  private healthStatus: 'unknown' | 'healthy' | 'unhealthy' = 'unknown';

  private constructor() {
    console.log('🔧 NewApiService - Constructor with AbortController system');
    this.startHealthMonitoring();
  }

  static getInstance(): NewApiService {
    if (!NewApiService.instance) {
      console.log('🆕 NewApiService - Creating instance with forced timeout system');
      NewApiService.instance = new NewApiService();
    }
    return NewApiService.instance;
  }

  private startHealthMonitoring(): void {
    // Monitor health every 30 seconds with forced timeout
    setInterval(async () => {
      if (!this.circuitBreaker.breakerOpen) {
        const isHealthy = await this.healthCheck();
        console.log(`🔄 Background health: ${isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
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
    const requestId = `health_${Date.now()}`;
    console.log(`🏥 ${requestId} - Starting forced health check (1s timeout)`);
    
    try {
      const { controller, timeoutPromise, cleanup } = this.timeoutManager.createAbortableRequest(requestId, 1000);
      
      const healthUrl = `${API_BASE_URL}/health`;
      const fetchPromise = fetch(healthUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      const isHealthy = response.ok;
      
      this.healthStatus = isHealthy ? 'healthy' : 'unhealthy';
      console.log(`🏥 ${requestId} - Health check: ${isHealthy ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      cleanup();
      return isHealthy;
      
    } catch (error) {
      this.healthStatus = 'unhealthy';
      console.error(`🏥 ${requestId} - Health check FAILED:`, error instanceof Error ? error.message : 'Unknown');
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

  private async fetchWithForcedTimeout(url: string, requestId: string, timeoutMs: number = 2000): Promise<Response> {
    console.log(`🚀 ${requestId} - Fetch with FORCED timeout (${timeoutMs}ms)`);
    
    const { controller, timeoutPromise, cleanup } = this.timeoutManager.createAbortableRequest(requestId, timeoutMs);
    
    try {
      const fetchPromise = fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'LSB-Digital-Archive/1.0'
        }
      });

      // Usar Promise.race com timeout forçado
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (response.ok) {
        console.log(`✅ ${requestId} - Request successful`);
        this.recordSuccess();
        cleanup();
        return response;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      this.recordFailure();
      cleanup();
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`⚡ ${requestId} - Request ABORTED by force timeout`);
        throw new Error(`Request forcefully aborted after ${timeoutMs}ms`);
      }
      
      console.error(`❌ ${requestId} - Request failed:`, error instanceof Error ? error.message : 'Unknown');
      throw error;
    }
  }

  async fetchContent(tipo: 'livro' | 'aula' | 'podcast', page: number = 1, limit: number = 10): Promise<SearchResult[]> {
    const cacheKey = this.getCacheKey(tipo, page, limit);
    const requestId = `${tipo}_${Date.now()}`;
    
    console.group(`🚀 ${requestId} - fetchContent with forced timeout`);
    
    // Check cache first
    if (this.isValidCache(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      console.log(`📦 Cache HIT: ${cached!.data.length} items`);
      console.groupEnd();
      return cached!.data;
    }

    // Fast-fail if circuit breaker is open
    if (this.isCircuitBreakerOpen()) {
      console.log(`⚡ Circuit breaker OPEN - using Supabase fallback`);
      console.groupEnd();
      return this.fetchFromSupabaseFallback(tipo);
    }

    // Check for active requests
    if (this.activeRequests.has(cacheKey)) {
      console.log(`⏳ Request already in progress`);
      const result = await this.activeRequests.get(cacheKey)!;
      console.groupEnd();
      return result;
    }

    const requestPromise = this.performForcedFetch(tipo, page, limit, requestId);
    this.activeRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      console.log(`✅ Success: ${result.length} items`);
      console.groupEnd();
      return result;
    } catch (error) {
      console.error(`❌ Failed, using Supabase fallback:`, error);
      console.groupEnd();
      return this.fetchFromSupabaseFallback(tipo);
    } finally {
      this.activeRequests.delete(cacheKey);
    }
  }

  private async performForcedFetch(tipo: string, page: number, limit: number, requestId: string): Promise<SearchResult[]> {
    const cacheKey = this.getCacheKey(tipo, page, limit);
    const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${page}&limit=${limit}`;
    
    console.log(`🌐 ${requestId} - Attempting forced fetch`);
    
    try {
      // Primeira tentativa: 2 segundos
      const response = await this.fetchWithForcedTimeout(url, `${requestId}_attempt1`, 2000);
      
      console.log(`📄 ${requestId} - Parsing JSON response`);
      const rawData: APIResponse = await response.json();
      
      const dataArray = rawData.conteudo || [];
      if (dataArray.length === 0) {
        console.warn(`⚠️ ${requestId} - No content found`);
        return [];
      }
      
      const transformedData = dataArray.map((item: any) => this.transformToSearchResult(item, tipo));
      this.setCache(cacheKey, transformedData, 5 * 60 * 1000);
      
      console.log(`✅ ${requestId} - SUCCESS: ${transformedData.length} items`);
      return transformedData;
      
    } catch (error) {
      console.error(`❌ ${requestId} - Forced fetch failed:`, error);
      throw error;
    }
  }

  private async fetchFromSupabaseFallback(tipo: 'livro' | 'aula' | 'podcast'): Promise<SearchResult[]> {
    console.log(`🔄 Using Supabase fallback for ${tipo}`);
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      let functionName: string;
      switch (tipo) {
        case 'livro': functionName = 'fetch-books'; break;
        case 'aula': functionName = 'fetch-videos'; break;
        case 'podcast': functionName = 'fetch-podcasts'; break;
        default: throw new Error(`Unsupported tipo: ${tipo}`);
      }
      
      console.log(`📡 Calling Supabase function: ${functionName}`);
      const { data, error } = await supabase.functions.invoke(functionName);
      
      if (error || !data.success) {
        console.error(`❌ Supabase ${functionName} error:`, error || data.error);
        return [];
      }
      
      const items = tipo === 'livro' ? data.books : tipo === 'aula' ? data.videos : data.podcasts;
      console.log(`✅ Supabase success: ${items.length} ${tipo}s`);
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
    
    console.group(`🏠 ${requestId} - fetchHomepageContent with forced timeouts`);
    console.log(`⏰ Started: ${new Date().toISOString()}`);
    console.log(`🌡️ Health: ${this.healthStatus}`);
    console.log(`⚡ Circuit breaker: ${this.circuitBreaker.breakerOpen ? 'OPEN' : 'CLOSED'}`);
    
    try {
      // Health check com timeout forçado
      console.log(`🏥 ${requestId} - Forced health check (1s)`);
      const isHealthy = await this.healthCheck();
      
      if (!isHealthy) {
        console.warn(`⚠️ ${requestId} - Health failed, emergency fallback`);
        const result = await this.fetchAllFromSupabase();
        console.groupEnd();
        return result;
      }
      
      // Carregamento progressivo com timeouts forçados
      console.log(`📡 ${requestId} - Progressive loading with forced timeouts`);
      
      const results = await Promise.allSettled([
        this.fetchContent('livro', 1, 6),
        this.fetchContent('aula', 1, 6),
        this.fetchContent('podcast', 1, 6)
      ]);

      const books = results[0].status === 'fulfilled' ? results[0].value : [];
      const videos = results[1].status === 'fulfilled' ? results[1].value : [];
      const podcasts = results[2].status === 'fulfilled' ? results[2].value : [];

      const totalItems = books.length + videos.length + podcasts.length;
      
      console.group('📋 FINAL REPORT');
      console.log(`📊 Total: ${totalItems}`);
      console.log(`📚 Books: ${books.length}`);
      console.log(`🎬 Videos: ${videos.length}`);
      console.log(`🎧 Podcasts: ${podcasts.length}`);
      console.log(`🎯 Result: ${totalItems > 0 ? '✅ SUCCESS' : '❌ FALLBACK NEEDED'}`);
      console.groupEnd();

      // Se nenhum conteúdo foi carregado, usar fallback
      if (totalItems === 0) {
        console.log(`🔄 ${requestId} - No content, using emergency fallback`);
        const fallbackResult = await this.fetchAllFromSupabase();
        console.groupEnd();
        return fallbackResult;
      }

      console.groupEnd();
      return { videos, books, podcasts };
      
    } catch (error) {
      console.error(`❌ ${requestId} - Complete failure, emergency fallback:`, error);
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
    console.log('🔄 Emergency: All content from Supabase');
    
    try {
      const [booksResult, videosResult, podcastsResult] = await Promise.allSettled([
        this.fetchFromSupabaseFallback('livro'),
        this.fetchFromSupabaseFallback('aula'),
        this.fetchFromSupabaseFallback('podcast')
      ]);

      const books = booksResult.status === 'fulfilled' ? booksResult.value.slice(0, 6) : [];
      const videos = videosResult.status === 'fulfilled' ? videosResult.value.slice(0, 6) : [];
      const podcasts = podcastsResult.status === 'fulfilled' ? podcastsResult.value.slice(0, 6) : [];

      console.log('✅ Supabase emergency complete:', {
        books: books.length,
        videos: videos.length,
        podcasts: podcasts.length
      });

      return { videos, books, podcasts };
      
    } catch (error) {
      console.error('❌ Supabase emergency failed:', error);
      return { videos: [], books: [], podcasts: [] };
    }
  }

  clearCache(): void {
    console.log('🧹 Clearing cache and cancelling requests');
    this.timeoutManager.cancelAll();
    this.cache.clear();
    this.activeRequests.clear();
    this.circuitBreaker = {
      failures: 0,
      lastFailTime: 0,
      breakerOpen: false,
      openDuration: 10000
    };
    this.healthStatus = 'unknown';
    console.log('✅ Complete cleanup done');
  }

  getStatus() {
    return {
      healthStatus: this.healthStatus,
      circuitBreaker: { ...this.circuitBreaker },
      cacheSize: this.cache.size,
      activeRequests: this.activeRequests.size,
      abortableRequests: this.timeoutManager.getActiveRequests()
    };
  }
}

export const newApiService = NewApiService.getInstance();
