
import { API_BASE_URL, ContentType, APIResponse, SCALABLE_CONFIG } from './apiConfig';
import { ApiTimeoutManager } from '../apiTimeoutManager';
import { CacheManager } from './cacheManager';

export class ContentDiscovery {
  private timeoutManager: ApiTimeoutManager;
  private cacheManager: CacheManager;

  constructor(timeoutManager: ApiTimeoutManager, cacheManager: CacheManager) {
    this.timeoutManager = timeoutManager;
    this.cacheManager = cacheManager;
  }

  // DESCOBRIR TOTAL DISPONÍVEL NA API COM ESCALABILIDADE
  async discoverTotalContent(tipo: ContentType): Promise<number> {
    const cacheKey = `total_${tipo}`;
    
    if (this.cacheManager.isValidCache(cacheKey)) {
      const cached = this.cacheManager.getCache(cacheKey);
      console.log(`📊 Total ${tipo} (cache): ${cached}`);
      return cached;
    }

    try {
      console.log(`🔍 Descobrindo total real de ${tipo}...`);
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
      this.cacheManager.setCache(cacheKey, total, 30 * 60 * 1000);
      
      console.log(`📊 Total REAL ${tipo} descoberto: ${total}`);
      cleanup();
      return total;
      
    } catch (error) {
      console.error(`❌ Erro descobrindo total ${tipo}:`, error);
      // Valores conhecidos como fallback
      const fallbackTotals = { podcast: 2512, aula: 300, livro: 30 };
      return fallbackTotals[tipo] || 100;
    }
  }

  // AUTO-SCALING PARA NÚMEROS EXATOS
  async calculateExactLimit(tipo: ContentType, loadAll: boolean = false): Promise<number> {
    if (!loadAll) {
      // Para homepage, usar limites otimizados
      const homepageConfig = { podcast: { limit: 12 }, aula: { limit: 12 }, livro: { limit: 12 } };
      return homepageConfig[tipo].limit;
    }

    try {
      // Para filtros, descobrir total real
      const totalAvailable = await this.discoverTotalContent(tipo);
      const config = SCALABLE_CONFIG[tipo];
      
      // Usar o menor entre o total real e o máximo configurado
      const exactLimit = Math.min(totalAvailable, config.maxItems);
      
      console.log(`🎯 Números exatos ${tipo}: ${exactLimit} (total real: ${totalAvailable})`);
      return exactLimit;
      
    } catch (error) {
      console.error(`❌ Erro calculando números exatos ${tipo}:`, error);
      return SCALABLE_CONFIG[tipo].maxItems;
    }
  }
}
