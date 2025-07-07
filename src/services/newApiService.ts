import { SearchResult } from '@/types/searchTypes';
import { ApiTimeoutManager } from './apiTimeoutManager';

const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';

interface APIResponse {
  tipo: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  conteudo: any[];
}

interface ContentCounts {
  videos: number;
  books: number;
  podcasts: number;
}

// CONFIGURAÇÃO DE ALTA ESCALABILIDADE
const SCALABLE_CONFIG = {
  podcast: {
    maxItems: 1500, // 60% de 2512 podcasts
    percentage: 0.6,
    chunkSize: 50,
    maxConcurrency: 5
  },
  aula: {
    maxItems: 300, // 100% dos vídeos
    percentage: 1.0,
    chunkSize: 50,
    maxConcurrency: 4
  },
  livro: {
    maxItems: 50, // Todos os livros
    percentage: 1.0,
    chunkSize: 25,
    maxConcurrency: 2
  }
};

export class NewApiService {
  private static instance: NewApiService;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private activeRequests = new Map<string, Promise<SearchResult[]>>();
  private timeoutManager = new ApiTimeoutManager();
  private circuitBreaker = {
    failures: 0,
    lastFailTime: 0,
    breakerOpen: false,
    openDuration: 20000 // Aumentado para 20 segundos
  };
  private healthStatus: 'unknown' | 'healthy' | 'unhealthy' = 'unknown';

  private constructor() {
    console.log('🔧 NewApiService - Constructor com sistema escalável');
    this.startHealthMonitoring();
  }

  static getInstance(): NewApiService {
    if (!NewApiService.instance) {
      console.log('🆕 NewApiService - Criando instância escalável');
      NewApiService.instance = new NewApiService();
    }
    return NewApiService.instance;
  }

  private startHealthMonitoring(): void {
    // Monitor de saúde a cada 45 segundos
    setInterval(async () => {
      if (!this.circuitBreaker.breakerOpen) {
        const isHealthy = await this.healthCheck();
        console.log(`🔄 Saúde em background: ${isHealthy ? '✅ SAUDÁVEL' : '❌ INDISPONÍVEL'}`);
      }
    }, 45000);
  }

  private getCacheKey(tipo: string, page: number, limit: number): string {
    return `scalable_${tipo}_${page}_${limit}`;
  }

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      console.log(`📦 Cache MISS para ${cacheKey}`);
      return false;
    }
    
    const now = Date.now();
    const isValid = (now - cached.timestamp) < cached.ttl;
    console.log(`📦 Cache ${isValid ? 'HIT' : 'EXPIRADO'} para ${cacheKey}:`, {
      idade: Math.round((now - cached.timestamp) / 1000),
      ttl: Math.round(cached.ttl / 1000),
      itens: cached.data?.length || 0
    });
    return isValid;
  }

  private setCache(cacheKey: string, data: any, ttl: number = 15 * 60 * 1000): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
    console.log(`📦 Cache SET: ${cacheKey}`, {
      itens: data.length,
      ttlMinutos: Math.round(ttl / 60000)
    });
  }

  // DESCOBRIR TOTAL DISPONÍVEL NA API COM ESCALABILIDADE
  private async discoverTotalContent(tipo: 'livro' | 'aula' | 'podcast'): Promise<number> {
    const cacheKey = `total_${tipo}`;
    
    if (this.isValidCache(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      console.log(`📊 Total ${tipo} (cache): ${cached!.data}`);
      return cached!.data;
    }

    try {
      console.log(`🔍 Descobrindo total escalável de ${tipo}...`);
      const { controller, timeoutPromise, cleanup } = this.timeoutManager.createAbortableRequest(`discover_${tipo}`, 5000);
      
      const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=1&limit=1`;
      const fetchPromise = fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      const data: APIResponse = await response.json();
      const total = data.total || 0;
      
      // Cache por 30 minutos
      this.setCache(cacheKey, total, 30 * 60 * 1000);
      
      console.log(`📊 Total ${tipo} descoberto: ${total}`);
      cleanup();
      return total;
      
    } catch (error) {
      console.error(`❌ Erro descobrindo total ${tipo}:`, error);
      // Retornar estimativa baseada na configuração
      const config = SCALABLE_CONFIG[tipo];
      return Math.ceil(config.maxItems / config.percentage);
    }
  }

  // AUTO-SCALING INTELIGENTE
  private async calculateOptimalLimit(tipo: 'livro' | 'aula' | 'podcast'): Promise<number> {
    const config = SCALABLE_CONFIG[tipo];
    
    try {
      const totalAvailable = await this.discoverTotalContent(tipo);
      const calculatedLimit = Math.min(
        Math.ceil(totalAvailable * config.percentage),
        config.maxItems
      );
      
      console.log(`🎯 Auto-scaling ${tipo}: ${calculatedLimit} de ${totalAvailable} (${Math.round(config.percentage * 100)}%)`);
      return calculatedLimit;
      
    } catch (error) {
      console.error(`❌ Erro auto-scaling ${tipo}:`, error);
      return config.maxItems;
    }
  }

  // BUSCA ESCALÁVEL POR CHUNKS PARALELOS
  private async fetchContentScalable(tipo: 'livro' | 'aula' | 'podcast', targetLimit?: number): Promise<SearchResult[]> {
    const cacheKey = this.getCacheKey(`scalable_${tipo}`, 1, targetLimit || 1000);
    
    if (this.isValidCache(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      console.log(`📦 Cache HIT escalável: ${cached!.data.length} ${tipo}s`);
      return cached!.data;
    }

    const requestId = `scalable_${tipo}_${Date.now()}`;
    console.group(`🚀 ${requestId} - Busca escalável ${tipo}`);
    
    try {
      // Descobrir limite ótimo se não fornecido
      const finalLimit = targetLimit || await this.calculateOptimalLimit(tipo);
      const config = SCALABLE_CONFIG[tipo];
      
      console.log(`🎯 Buscando ${finalLimit} ${tipo}s em chunks de ${config.chunkSize}`);
      
      const allItems: SearchResult[] = [];
      const totalChunks = Math.ceil(finalLimit / config.chunkSize);
      
      // Processar em batches paralelos
      for (let batchStart = 0; batchStart < totalChunks; batchStart += config.maxConcurrency) {
        const batchEnd = Math.min(batchStart + config.maxConcurrency, totalChunks);
        const chunkPromises: Promise<SearchResult[]>[] = [];
        
        // Criar promises para o batch
        for (let chunkIndex = batchStart; chunkIndex < batchEnd; chunkIndex++) {
          const page = chunkIndex + 1;
          const chunkPromise = this.fetchSingleChunk(tipo, page, config.chunkSize, requestId);
          chunkPromises.push(chunkPromise);
        }
        
        console.log(`📦 Processando batch ${Math.ceil(batchStart / config.maxConcurrency) + 1}: chunks ${batchStart + 1}-${batchEnd}`);
        
        try {
          const batchResults = await Promise.allSettled(chunkPromises);
          
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              allItems.push(...result.value);
              console.log(`✅ Chunk ${batchStart + index + 1}: ${result.value.length} itens`);
            } else {
              console.error(`❌ Chunk ${batchStart + index + 1} falhou:`, result.reason?.message);
            }
          });
          
          // Verificar se já temos itens suficientes
          if (allItems.length >= finalLimit) {
            console.log(`🎯 Limite atingido: ${allItems.length}/${finalLimit}`);
            break;
          }
          
          // Pausa entre batches
          if (batchEnd < totalChunks) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
        } catch (error) {
          console.error(`❌ Erro no batch:`, error);
        }
      }

      const finalItems = allItems.slice(0, finalLimit);
      
      // Cache por 15 minutos
      this.setCache(cacheKey, finalItems, 15 * 60 * 1000);
      
      console.log(`✅ Busca escalável concluída: ${finalItems.length} ${tipo}s`);
      console.groupEnd();
      
      return finalItems;
      
    } catch (error) {
      console.error(`❌ Erro busca escalável ${tipo}:`, error);
      console.groupEnd();
      return await this.fetchFromSupabaseFallback(tipo);
    }
  }

  // BUSCA DE CHUNK INDIVIDUAL
  private async fetchSingleChunk(tipo: string, page: number, limit: number, requestId: string): Promise<SearchResult[]> {
    const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${page}&limit=${limit}`;
    
    try {
      const { controller, timeoutPromise, cleanup } = this.timeoutManager.createAbortableRequest(`${requestId}_chunk${page}`, 8000);
      
      const fetchPromise = fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'LSB-Scalable-Search/2.0'
        }
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} para ${tipo} página ${page}`);
      }

      const data: APIResponse = await response.json();
      const items = data.conteudo || [];
      
      if (items.length === 0) {
        console.log(`📄 Fim dos dados ${tipo} na página ${page}`);
        cleanup();
        return [];
      }

      const transformedItems = items.map((item: any) => this.transformToSearchResult(item, tipo));
      cleanup();
      return transformedItems;
      
    } catch (error) {
      console.error(`❌ Erro chunk ${tipo} página ${page}:`, error);
      return [];
    }
  }

  private transformToSearchResult(item: any, tipo: string): SearchResult {
    console.log(`🔄 Transformando item:`, {
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
      baseResult.channel = item.canal || 'Canal desconhecido';
    } else if (tipo === 'podcast') {
      baseResult.duration = item.duracao_ms ? this.formatDuration(item.duracao_ms) : undefined;
      baseResult.embedUrl = item.embed_url;
      baseResult.program = item.podcast_titulo || 'Programa desconhecido';
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
    console.log(`🏥 ${requestId} - Verificação de saúde escalável (5s timeout)`);
    
    try {
      const { controller, timeoutPromise, cleanup } = this.timeoutManager.createAbortableRequest(requestId, 5000);
      
      const healthUrl = `${API_BASE_URL}/health`;
      const fetchPromise = fetch(healthUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      const isHealthy = response.ok;
      
      this.healthStatus = isHealthy ? 'healthy' : 'unhealthy';
      console.log(`🏥 ${requestId} - Verificação: ${isHealthy ? '✅ SUCESSO' : '❌ FALHOU'}`);
      
      cleanup();
      return isHealthy;
      
    } catch (error) {
      this.healthStatus = 'unhealthy';
      console.error(`🏥 ${requestId} - Verificação FALHOU:`, error instanceof Error ? error.message : 'Desconhecido');
      return false;
    }
  }

  private isCircuitBreakerOpen(): boolean {
    if (!this.circuitBreaker.breakerOpen) return false;
    
    const now = Date.now();
    if (now - this.circuitBreaker.lastFailTime > this.circuitBreaker.openDuration) {
      console.log('🔄 Circuit breaker resetado - tentando novamente');
      this.circuitBreaker.breakerOpen = false;
      this.circuitBreaker.failures = 0;
      return false;
    }
    
    console.log('⚡ Circuit breaker ABERTO - falha rápida');
    return true;
  }

  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailTime = Date.now();
    
    if (this.circuitBreaker.failures >= 5) { // Aumentado threshold
      this.circuitBreaker.breakerOpen = true;
      console.log('⚡ Circuit breaker ABERTO - muitas falhas');
    }
  }

  private recordSuccess(): void {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.breakerOpen = false;
  }

  // MÉTODO PÚBLICO ESCALÁVEL PARA BUSCAR CONTEÚDO
  async fetchContent(tipo: 'livro' | 'aula' | 'podcast', page: number = 1, limit: number = 10): Promise<SearchResult[]> {
    // Para manter compatibilidade, usar busca escalável quando limite for alto
    if (limit > 50 || page === 1) {
      const targetLimit = limit > 50 ? await this.calculateOptimalLimit(tipo) : limit;
      return this.fetchContentScalable(tipo, targetLimit);
    }
    
    // Busca padrão para casos específicos
    return this.performStandardFetch(tipo, page, limit);
  }

  // BUSCA PADRÃO PARA COMPATIBILIDADE
  private async performStandardFetch(tipo: string, page: number, limit: number): Promise<SearchResult[]> {
    const cacheKey = this.getCacheKey(tipo, page, limit);
    const requestId = `standard_${tipo}_${Date.now()}`;
    
    if (this.isValidCache(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      console.log(`📦 Cache HIT padrão: ${cached!.data.length} itens`);
      return cached!.data;
    }

    if (this.isCircuitBreakerOpen()) {
      console.log(`⚡ Circuit breaker ABERTO - usando fallback Supabase`);
      return this.fetchFromSupabaseFallback(tipo);
    }

    try {
      const result = await this.fetchSingleChunk(tipo, page, limit, requestId);
      this.setCache(cacheKey, result, 10 * 60 * 1000);
      return result;
    } catch (error) {
      console.error(`❌ Busca padrão falhou:`, error);
      return this.fetchFromSupabaseFallback(tipo);
    }
  }

  // HOMEPAGE ESCALÁVEL COM ALTA PERFORMANCE
  async fetchHomepageContent(): Promise<{
    videos: SearchResult[];
    books: SearchResult[];
    podcasts: SearchResult[];
  }> {
    const requestId = `homepage_scalable_${Date.now()}`;
    
    console.group(`🏠 ${requestId} - Conteúdo homepage escalável`);
    console.log(`⏰ Iniciado: ${new Date().toISOString()}`);
    console.log(`🌡️ Saúde: ${this.healthStatus}`);
    console.log(`⚡ Circuit breaker: ${this.circuitBreaker.breakerOpen ? 'ABERTO' : 'FECHADO'}`);
    
    try {
      // Verificação de saúde rápida
      const isHealthy = await this.healthCheck();
      
      if (!isHealthy) {
        console.warn(`⚠️ ${requestId} - Saúde falhou, fallback de emergência`);
        const result = await this.fetchAllFromSupabase();
        console.groupEnd();
        return result;
      }
      
      // Carregamento escalável e paralelo
      console.log(`📡 ${requestId} - Carregamento escalável paralelo`);
      
      const results = await Promise.allSettled([
        this.fetchContentScalable('livro', 8), // Mais livros
        this.fetchContentScalable('aula', 8),  // Mais vídeos  
        this.fetchContentScalable('podcast', 8) // Mais podcasts
      ]);

      const books = results[0].status === 'fulfilled' ? results[0].value : [];
      const videos = results[1].status === 'fulfilled' ? results[1].value : [];
      const podcasts = results[2].status === 'fulfilled' ? results[2].value : [];

      const totalItems = books.length + videos.length + podcasts.length;
      
      console.group('📋 RELATÓRIO FINAL ESCALÁVEL');
      console.log(`📊 Total: ${totalItems}`);
      console.log(`📚 Livros: ${books.length}`);
      console.log(`🎬 Vídeos: ${videos.length}`);
      console.log(`🎧 Podcasts: ${podcasts.length}`);
      console.log(`🎯 Resultado: ${totalItems > 0 ? '✅ SUCESSO' : '❌ FALLBACK NECESSÁRIO'}`);
      console.groupEnd();

      if (totalItems === 0) {
        console.log(`🔄 ${requestId} - Nenhum conteúdo, fallback de emergência`);
        const fallbackResult = await this.fetchAllFromSupabase();
        console.groupEnd();
        return fallbackResult;
      }

      console.groupEnd();
      return { videos, books, podcasts };
      
    } catch (error) {
      console.error(`❌ ${requestId} - Falha completa, fallback de emergência:`, error);
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
    console.log('🔄 Emergência: Todo conteúdo do Supabase');
    
    try {
      const [booksResult, videosResult, podcastsResult] = await Promise.allSettled([
        this.fetchFromSupabaseFallback('livro'),
        this.fetchFromSupabaseFallback('aula'),
        this.fetchFromSupabaseFallback('podcast')
      ]);

      const books = booksResult.status === 'fulfilled' ? booksResult.value.slice(0, 8) : [];
      const videos = videosResult.status === 'fulfilled' ? videosResult.value.slice(0, 8) : [];
      const podcasts = podcastsResult.status === 'fulfilled' ? podcastsResult.value.slice(0, 8) : [];

      console.log('✅ Emergência Supabase completa:', {
        books: books.length,
        videos: videos.length,
        podcasts: podcasts.length
      });

      return { videos, books, podcasts };
      
    } catch (error) {
      console.error('❌ Emergência Supabase falhou:', error);
      return { videos: [], books: [], podcasts: [] };
    }
  }

  private async fetchFromSupabaseFallback(tipo: 'livro' | 'aula' | 'podcast'): Promise<SearchResult[]> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      let functionName: string;
      switch (tipo) {
        case 'livro': functionName = 'fetch-books'; break;
        case 'aula': functionName = 'fetch-videos'; break;
        case 'podcast': functionName = 'fetch-podcasts'; break;
        default: throw new Error(`Tipo não suportado: ${tipo}`);
      }
      
      console.log(`📡 Chamando função Supabase: ${functionName}`);
      const { data, error } = await supabase.functions.invoke(functionName);
      
      if (error || !data.success) {
        console.error(`❌ Supabase ${functionName} erro:`, error || data.error);
        return [];
      }
      
      const items = tipo === 'livro' ? data.books : tipo === 'aula' ? data.videos : data.podcasts;
      console.log(`✅ Supabase sucesso: ${items.length} ${tipo}s`);
      return items;
      
    } catch (error) {
      console.error(`❌ Fallback Supabase falhou para ${tipo}:`, error);
      return [];
    }
  }

  // CONTAGENS ESCALÁVEIS COM TOTAIS REAIS
  async fetchContentCounts(): Promise<ContentCounts> {
    const requestId = `counts_scalable_${Date.now()}`;
    
    console.group(`📊 ${requestId} - Contagens escaláveis com totais reais`);
    console.log(`⏰ Iniciado: ${new Date().toISOString()}`);
    
    const cacheKey = 'scalable_content_counts';
    if (this.isValidCache(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      console.log(`📦 Cache HIT: Contagens do cache`);
      console.groupEnd();
      return cached!.data;
    }

    if (this.isCircuitBreakerOpen()) {
      console.log(`⚡ Circuit breaker ABERTO - usando contagens de fallback escaláveis`);
      console.groupEnd();
      return this.getScalableFallbackCounts();
    }

    try {
      // Descobrir totais reais em paralelo
      const results = await Promise.allSettled([
        this.discoverTotalContent('livro'),
        this.discoverTotalContent('aula'),
        this.discoverTotalContent('podcast')
      ]);

      const books = results[0].status === 'fulfilled' ? results[0].value : 30;
      const videos = results[1].status === 'fulfilled' ? results[1].value : 300;
      const podcasts = results[2].status === 'fulfilled' ? results[2].value : 2512;

      const counts: ContentCounts = { videos, books, podcasts };
      
      // Cache por 45 minutos (contagens mudam pouco)
      this.setCache(cacheKey, counts, 45 * 60 * 1000);
      
      console.log(`✅ ${requestId} - Contagens reais descobertas:`, counts);
      console.groupEnd();
      return counts;
      
    } catch (error) {
      console.error(`❌ ${requestId} - Falha nas contagens, usando fallback escalável:`, error);
      console.groupEnd();
      return this.getScalableFallbackCounts();
    }
  }

  private async getScalableFallbackCounts(): Promise<ContentCounts> {
    console.log('🔄 Usando contagens de fallback escaláveis');
    
    const fallbackCacheKey = 'scalable_fallback_counts';
    if (this.isValidCache(fallbackCacheKey)) {
      const cached = this.cache.get(fallbackCacheKey);
      console.log(`📦 Cache HIT fallback: Usando contagens de fallback cacheadas`);
      return cached!.data;
    }
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const timeoutMs = 10000; // 10 segundos para Supabase
      const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout Supabase após ${ms}ms`)), ms)
          )
        ]);
      };

      const [booksResult, videosResult, podcastsResult] = await Promise.allSettled([
        withTimeout(supabase.functions.invoke('fetch-books'), timeoutMs),
        withTimeout(supabase.functions.invoke('fetch-videos'), timeoutMs),
        withTimeout(supabase.functions.invoke('fetch-podcasts'), timeoutMs)
      ]);

      // Usar totais reais do Supabase quando disponível
      const books = booksResult.status === 'fulfilled' && booksResult.value.data?.success 
        ? (booksResult.value.data.total || booksResult.value.data.books?.length || 30) : 30;
      const videos = videosResult.status === 'fulfilled' && videosResult.value.data?.success 
        ? (videosResult.value.data.total || videosResult.value.data.videos?.length || 300) : 300;
      const podcasts = podcastsResult.status === 'fulfilled' && podcastsResult.value.data?.success 
        ? (podcastsResult.value.data.total || podcastsResult.value.data.podcasts?.length || 2512) : 2512;

      const counts = { videos, books, podcasts };
      
      // Cache fallback por 20 minutos
      this.setCache(fallbackCacheKey, counts, 20 * 60 * 1000);
      
      console.log('✅ Contagens de fallback escaláveis:', counts);
      return counts;
      
    } catch (error) {
      console.error('❌ Fallback escalável falhou para contagens:', error);
      
      // Contagens de emergência baseadas na descoberta de escalabilidade
      return { 
        videos: 300,    // Total conhecido dos vídeos
        books: 30,      // Total conhecido dos livros  
        podcasts: 2512  // Total conhecido dos podcasts
      };
    }
  }

  clearCache(): void {
    console.log('🧹 Limpando cache escalável e cancelando requisições');
    this.timeoutManager.cancelAll();
    this.cache.clear();
    this.activeRequests.clear();
    this.circuitBreaker = {
      failures: 0,
      lastFailTime: 0,
      breakerOpen: false,
      openDuration: 20000
    };
    this.healthStatus = 'unknown';
    console.log('✅ Limpeza completa escalável realizada');
  }

  getStatus() {
    return {
      healthStatus: this.healthStatus,
      circuitBreaker: { ...this.circuitBreaker },
      cacheSize: this.cache.size,
      activeRequests: this.activeRequests.size,
      abortableRequests: this.timeoutManager.getActiveRequests(),
      scalableConfig: SCALABLE_CONFIG
    };
  }
}

export const newApiService = NewApiService.getInstance();
