
interface AccessLog {
  id: string;
  timestamp: number;
  success: boolean;
  resourceFound?: {
    id: number;
    title: string;
    type: string;
  };
  suggestionsCount?: number;
  errorType?: string;
  searchDuration?: number;
}

class ResourceAccessAnalytics {
  private logs: AccessLog[] = [];
  private readonly MAX_LOGS = 1000;
  private readonly STORAGE_KEY = 'lsb_resource_access_logs';

  constructor() {
    this.loadLogsFromStorage();
  }

  private loadLogsFromStorage(): void {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Erro ao carregar logs do sessionStorage:', error);
      this.logs = [];
    }
  }

  private saveLogsToStorage(): void {
    try {
      // Manter apenas os logs mais recentes
      if (this.logs.length > this.MAX_LOGS) {
        this.logs = this.logs.slice(-this.MAX_LOGS);
      }
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.warn('Erro ao salvar logs no sessionStorage:', error);
    }
  }

  private addLog(log: AccessLog): void {
    this.logs.push(log);
    this.saveLogsToStorage();
    
    console.log(`📊 Analytics: ${log.success ? 'SUCCESS' : 'FAILED'} - ID ${log.id}`, {
      resourceFound: log.resourceFound?.title,
      suggestionsCount: log.suggestionsCount,
      errorType: log.errorType
    });
  }

  logSuccessfulAccess(id: string, resource: any): void {
    this.addLog({
      id,
      timestamp: Date.now(),
      success: true,
      resourceFound: {
        id: resource.id,
        title: resource.title,
        type: resource.type
      }
    });
  }

  logFailedAccess(id: string, suggestions: any[]): void {
    this.addLog({
      id,
      timestamp: Date.now(),
      success: false,
      suggestionsCount: suggestions.length,
      errorType: 'not_found'
    });
  }

  logTechnicalError(id: string, errorMessage: string): void {
    this.addLog({
      id,
      timestamp: Date.now(),
      success: false,
      errorType: 'technical_error',
      searchDuration: Date.now()
    });
  }

  getAccessStats(): {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    successRate: number;
    mostRequestedIds: string[];
    recentFailures: string[];
  } {
    const totalAttempts = this.logs.length;
    const successfulAttempts = this.logs.filter(log => log.success).length;
    const failedAttempts = totalAttempts - successfulAttempts;
    const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;

    // IDs mais solicitados
    const idCounts = this.logs.reduce((acc, log) => {
      acc[log.id] = (acc[log.id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostRequestedIds = Object.entries(idCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);

    // Falhas recentes
    const recentFailures = this.logs
      .filter(log => !log.success)
      .slice(-20)
      .map(log => log.id);

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      successRate: Math.round(successRate * 100) / 100,
      mostRequestedIds,
      recentFailures
    };
  }

  exportLogs(): AccessLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    this.saveLogsToStorage();
    console.log('📊 Analytics: Logs limpos');
  }
}

export const resourceAccessAnalytics = new ResourceAccessAnalytics();
