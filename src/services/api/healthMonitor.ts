
import { API_BASE_URL } from './apiConfig';
import { ApiTimeoutManager } from '../apiTimeoutManager';

export class HealthMonitor {
  private healthStatus: 'unknown' | 'healthy' | 'unhealthy' = 'unknown';
  private timeoutManager: ApiTimeoutManager;

  constructor(timeoutManager: ApiTimeoutManager) {
    this.timeoutManager = timeoutManager;
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Monitor de saúde a cada 45 segundos
    setInterval(async () => {
      const isHealthy = await this.healthCheck();
      console.log(`🔄 Saúde em background: ${isHealthy ? '✅ SAUDÁVEL' : '❌ INDISPONÍVEL'}`);
    }, 45000);
  }

  async healthCheck(): Promise<boolean> {
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

  getHealthStatus(): 'unknown' | 'healthy' | 'unhealthy' {
    return this.healthStatus;
  }
}
