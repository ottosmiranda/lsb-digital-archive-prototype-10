import { SearchResult } from '@/types/searchTypes';
import { ApiTimeoutManager } from './apiTimeoutManager';
import { ContentType, ContentCounts, SCALABLE_CONFIG, HOMEPAGE_CONFIG } from './api/apiConfig';
import { CacheManager } from './api/cacheManager';
import { CircuitBreaker } from './api/circuitBreaker';
import { HealthMonitor } from './api/healthMonitor';
import { ContentDiscovery } from './api/contentDiscovery';
import { ContentFetcher } from './api/contentFetcher';
import { DataTransformer } from './api/dataTransformer';
import { SupabaseFallback } from './api/supabaseFallback';

export class NewApiService {
  private static instance: NewApiService;
  private cacheManager: CacheManager;
  private circuitBreaker: CircuitBreaker;
  private healthMonitor: HealthMonitor;
  private contentDiscovery: ContentDiscovery;
  private contentFetcher: ContentFetcher;
  private dataTransformer: DataTransformer;
  private supabaseFallback: SupabaseFallback;
  private timeoutManager: ApiTimeoutManager;
  private activeRequests = new Map<string, Promise<SearchResult[]>>();

  private constructor() {
    console.log('🔧 NewApiService - Constructor com números exatos e escalabilidade');
    
    // Inicializar componentes
    this.timeoutManager = new ApiTimeoutManager();
    this.cacheManager = new CacheManager();
    this.circuitBreaker = new CircuitBreaker();
    this.dataTransformer = new DataTransformer();
    this.healthMonitor = new HealthMonitor(this.timeoutManager);
    this.contentDiscovery = new ContentDiscovery(this.timeoutManager, this.cacheManager);
    this.contentFetcher = new ContentFetcher(this.timeoutManager, this.dataTransformer);
    this.supabaseFallback = new SupabaseFallback();
  }

  static getInstance(): NewApiService {
    if (!NewApiService.instance) {
      console.log('🆕 NewApiService - Criando instância com números exatos');
      NewApiService.instance = new NewApiService();
    }
    return NewApiService.instance;
  }

  // MÉTODO PÚBLICO COM MODO "NÚMEROS EXATOS"
  async fetchContent(tipo: ContentType, page: number = 1, limit: number = 10, loadAll: boolean = false): Promise<SearchResult[]> {
    // Usar números exatos quando solicitado ou para limites altos
    if (loadAll || limit > 50) {
      const exactLimit = await this.contentDiscovery.calculateExactLimit(tipo, true);
      return this.fetchContentScalable(tipo, exactLimit, true);
    }
    
    // Para homepage e casos específicos, usar busca otimizada
    const homepageLimit = await this.contentDiscovery.calculateExactLimit(tipo, false);
    return this.fetchContentScalable(tipo, homepageLimit, false);
  }

  private async fetchContentScalable(tipo: ContentType, targetLimit: number, loadAll: boolean = false): Promise<SearchResult[]> {
    const cacheKey = this.cacheManager.getCacheKey(`${tipo}`, 1, targetLimit, loadAll);
    
    if (this.cacheManager.isValidCache(cacheKey)) {
      const cached = this.cacheManager.getCache(cacheKey);
      console.log(`📦 Cache HIT ${loadAll ? 'números exatos' : 'homepage'}: ${cached.length} ${tipo}s`);
      return cached;
    }

    if (this.circuitBreaker.isOpen()) {
      console.log(`⚡ Circuit breaker ABERTO - usando fallback Supabase`);
      return this.supabaseFallback.fetchFromSupabase(tipo);
    }

    try {
      const result = await this.contentFetcher.fetchContentScalable(tipo, targetLimit, loadAll);
      
      // Cache com TTL diferenciado
      const cacheTTL = loadAll ? 20 * 60 * 1000 : 10 * 60 * 1000; // 20min vs 10min
      this.cacheManager.setCache(cacheKey, result, cacheTTL);
      
      this.circuitBreaker.recordSuccess();
      return result;
      
    } catch (error) {
      this.circuitBreaker.recordFailure();
      console.error(`❌ Erro busca ${loadAll ? 'números exatos' : 'homepage'} ${tipo}:`, error);
      return this.supabaseFallback.fetchFromSupabase(tipo);
    }
  }

  // HOMEPAGE OTIMIZADA (PERFORMANCE) vs FILTROS (NÚMEROS EXATOS)
  async fetchHomepageContent(): Promise<{
    videos: SearchResult[];
    books: SearchResult[];
    podcasts: SearchResult[];
    articles: SearchResult[];
  }> {
    const requestId = `homepage_optimized_${Date.now()}`;
    
    console.group(`🏠 ${requestId} - Homepage otimizada (performance)`);
    console.log(`⏰ Iniciado: ${new Date().toISOString()}`);
    console.log(`🌡️ Saúde: ${this.healthMonitor.getHealthStatus()}`);
    
    try {
      // Verificação de saúde rápida
      const isHealthy = await this.healthMonitor.healthCheck();
      
      if (!isHealthy) {
        console.warn(`⚠️ ${requestId} - Saúde falhou, fallback homepage`);
        const result = await this.supabaseFallback.fetchAllFromSupabase();
        console.groupEnd();
        return result;
      }
      
      // Carregamento OTIMIZADO para homepage (poucos itens, rápido)
      console.log(`📡 ${requestId} - Carregamento otimizado homepage`);
      
      const results = await Promise.allSettled([
        this.fetchContentScalable('livro', undefined, false),   // Homepage: ~12 livros
        this.fetchContentScalable('aula', undefined, false),    // Homepage: ~12 vídeos
        this.fetchContentScalable('podcast', undefined, false), // Homepage: ~12 podcasts
        this.fetchContentScalable('artigo', undefined, false)   // Homepage: ~12 artigos
      ]);

      const books = results[0].status === 'fulfilled' ? results[0].value : [];
      const videos = results[1].status === 'fulfilled' ? results[1].value : [];
      const podcasts = results[2].status === 'fulfilled' ? results[2].value : [];
      const articles = results[3].status === 'fulfilled' ? results[3].value : [];

      const totalItems = books.length + videos.length + podcasts.length + articles.length;
      
      console.group('📋 RELATÓRIO HOMEPAGE OTIMIZADA');
      console.log(`📊 Total: ${totalItems} (otimizado para performance)`);
      console.log(`📚 Livros: ${books.length}`);
      console.log(`🎬 Vídeos: ${videos.length}`);
      console.log(`🎧 Podcasts: ${podcasts.length}`);
      console.log(`📄 Artigos: ${articles.length}`);
      console.groupEnd();

      if (totalItems === 0) {
        console.log(`🔄 ${requestId} - Nenhum conteúdo homepage, fallback`);
        const fallbackResult = await this.supabaseFallback.fetchAllFromSupabase();
        console.groupEnd();
        return fallbackResult;
      }

      console.groupEnd();
      return { videos, books, podcasts, articles };
      
    } catch (error) {
      console.error(`❌ ${requestId} - Falha homepage:`, error);
      const fallbackResult = await this.supabaseFallback.fetchAllFromSupabase();
      console.groupEnd();
      return fallbackResult;
    }
  }

  // BUSCA COM NÚMEROS EXATOS PARA FILTROS
  async fetchContentForFilters(tipo: ContentType): Promise<SearchResult[]> {
    const requestId = `filters_exact_${tipo}_${Date.now()}`;
    console.log(`🔍 ${requestId} - Carregando NÚMEROS EXATOS para filtros`);
    
    try {
      // Usar modo "números exatos" (loadAll = true)
      const exactLimit = await this.contentDiscovery.calculateExactLimit(tipo, true);
      const result = await this.fetchContentScalable(tipo, exactLimit, true);
      console.log(`✅ ${requestId} - Números exatos carregados: ${result.length} ${tipo}s`);
      return result;
    } catch (error) {
      console.error(`❌ ${requestId} - Erro números exatos:`, error);
      return await this.supabaseFallback.fetchFromSupabase(tipo);
    }
  }

  // ATUALIZADO: Método de contagens com TTL reduzido e fallback inteligente
  async fetchContentCounts(): Promise<ContentCounts> {
    const requestId = `counts_realtime_${Date.now()}`;
    
    console.group(`📊 ${requestId} - Contagens em TEMPO REAL (TTL reduzido)`);
    console.log(`⏰ Iniciado: ${new Date().toISOString()}`);
    
    // MUDANÇA CRÍTICA: TTL reduzido de 45min para 5min
    const cacheKey = 'realtime_content_counts';
    const shortTTL = 5 * 60 * 1000; // 5 minutos em vez de 45
    
    if (this.cacheManager.isValidCache(cacheKey)) {
      const cached = this.cacheManager.getCache(cacheKey);
      console.log(`📦 Cache HIT (5min TTL): Contagens do cache`, cached);
      console.groupEnd();
      return cached;
    }

    console.log('🔄 Cache expirado ou inexistente - buscando contagens REAIS...');

    if (this.circuitBreaker.isOpen()) {
      console.log(`⚡ Circuit breaker ABERTO - usando fallback imediato`);
      console.groupEnd();
      return this.supabaseFallback.getRealTimeCounts();
    }

    try {
      // NOVO: Tentar buscar contagens reais primeiro
      console.log('🚀 Tentativa 1: Contagens em tempo real...');
      const realTimeCounts = await this.supabaseFallback.getRealTimeCounts();
      
      // Validar se as contagens são válidas (não zeros)
      const totalItems = realTimeCounts.videos + realTimeCounts.books + realTimeCounts.podcasts + realTimeCounts.articles;
      
      if (totalItems > 100) { // Threshold mínimo razoável
        // Cache com TTL reduzido para atualizações mais frequentes
        this.cacheManager.setCache(cacheKey, realTimeCounts, shortTTL);
        this.circuitBreaker.recordSuccess();
        
        console.log(`✅ ${requestId} - Contagens REAIS obtidas:`, realTimeCounts);
        console.log(`🎯 BADGES ATUALIZADOS automaticamente!`);
        console.groupEnd();
        return realTimeCounts;
      } else {
        console.warn(`⚠️ Contagens muito baixas - usando fallback: ${totalItems} total`);
        throw new Error('Contagens insuficientes');
      }
      
    } catch (error) {
      this.circuitBreaker.recordFailure();
      console.error(`❌ ${requestId} - Falha nas contagens reais:`, error);
      
      // Fallback para método original
      console.log('🔄 Tentativa 2: Descoberta de totais via API...');
      try {
        const results = await Promise.allSettled([
          this.contentDiscovery.discoverTotalContent('livro'),
          this.contentDiscovery.discoverTotalContent('aula'), 
          this.contentDiscovery.discoverTotalContent('podcast'),
          this.contentDiscovery.discoverTotalContent('artigo')
        ]);

        const books = results[0].status === 'fulfilled' ? results[0].value : 30;
        const videos = results[1].status === 'fulfilled' ? results[1].value : 300;  
        const podcasts = results[2].status === 'fulfilled' ? results[2].value : 2512;
        const articles = results[3].status === 'fulfilled' ? results[3].value : 35;

        const counts: ContentCounts = { videos, books, podcasts, articles };
        
        // Cache com TTL reduzido
        this.cacheManager.setCache(cacheKey, counts, shortTTL);
        
        console.log(`✅ ${requestId} - Contagens via descoberta:`, counts);
        console.groupEnd();
        return counts;
        
      } catch (discoveryError) {
        console.error(`❌ ${requestId} - Descoberta também falhou:`, discoveryError);
        console.groupEnd();
        return this.supabaseFallback.getExactFallbackCounts();
      }
    }
  }

  // NOVO: Método para forçar atualização das contagens
  async refreshContentCounts(): Promise<ContentCounts> {
    console.log('🔄 REFRESH FORÇADO: Invalidando cache e buscando contagens frescas');
    
    // Invalidar cache de contagens
    this.cacheManager.invalidateCache('content_counts');
    
    // Buscar contagens frescas
    return this.fetchContentCounts();
  }

  clearCache(): void {
    console.log('🧹 Limpando cache com números exatos e cancelando requisições');
    this.timeoutManager.cancelAll();
    this.cacheManager.clearCache();
    this.activeRequests.clear();
    this.circuitBreaker.reset();
    console.log('✅ Limpeza completa com números exatos realizada');
  }

  getStatus() {
    return {
      healthStatus: this.healthMonitor.getHealthStatus(),
      circuitBreaker: this.circuitBreaker.getStatus(),
      cacheSize: this.cacheManager.getCacheSize(),
      activeRequests: this.activeRequests.size,
      abortableRequests: this.timeoutManager.getActiveRequests(),
      scalableConfig: SCALABLE_CONFIG,
      homepageConfig: HOMEPAGE_CONFIG
    };
  }
}

export const newApiService = NewApiService.getInstance();
