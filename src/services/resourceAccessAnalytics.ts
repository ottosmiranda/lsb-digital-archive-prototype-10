
type AccessType = 'direct_access' | 'found' | 'not_found' | 'error' | 'suggestion_click';

interface AccessLog {
  id: string;
  timestamp: number;
  type: AccessType;
  userAgent: string;
  url: string;
}

class ResourceAccessAnalytics {
  private logs: AccessLog[] = [];
  private readonly MAX_LOGS = 1000; // Limitar logs em memória

  /**
   * Registra uma tentativa de acesso a um recurso
   */
  logAccessAttempt(resourceId: string, type: AccessType): void {
    const log: AccessLog = {
      id: resourceId,
      timestamp: Date.now(),
      type,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.logs.push(log);

    // Limitar tamanho dos logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    console.log(`📊 Analytics: ${type} para ID ${resourceId}`, log);

    // Em produção, aqui você enviaria para um serviço de analytics
    // this.sendToAnalyticsService(log);
  }

  /**
   * Obtém estatísticas de acesso
   */
  getAccessStats(): {
    total: number;
    notFound: number;
    errors: number;
    successRate: number;
    recentAccesses: AccessLog[];
  } {
    const total = this.logs.length;
    const notFound = this.logs.filter(log => log.type === 'not_found').length;
    const errors = this.logs.filter(log => log.type === 'error').length;
    const found = this.logs.filter(log => log.type === 'found').length;
    const successRate = total > 0 ? (found / total) * 100 : 0;
    const recentAccesses = this.logs.slice(-10); // Últimos 10 acessos

    return {
      total,
      notFound,
      errors,
      successRate,
      recentAccesses
    };
  }

  /**
   * Obtém IDs mais acessados que não foram encontrados
   */
  getMostRequestedNotFound(): { id: string; count: number }[] {
    const notFoundLogs = this.logs.filter(log => log.type === 'not_found');
    const counts: { [key: string]: number } = {};

    notFoundLogs.forEach(log => {
      counts[log.id] = (counts[log.id] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Limpa os logs
   */
  clearLogs(): void {
    this.logs = [];
    console.log('🧹 Analytics: Logs limpos');
  }

  /**
   * Exporta logs para análise (em formato JSON)
   */
  exportLogs(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalLogs: this.logs.length,
      stats: this.getAccessStats(),
      mostRequestedNotFound: this.getMostRequestedNotFound(),
      allLogs: this.logs
    }, null, 2);
  }
}

// Exportar instância singleton
export const resourceAccessAnalytics = new ResourceAccessAnalytics();
