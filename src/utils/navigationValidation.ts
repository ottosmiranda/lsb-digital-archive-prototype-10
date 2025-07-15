// ✅ UTILIDADE: Validação centralizada para navegação
export const NavigationValidator = {
  /**
   * Valida se um ID é válido para navegação
   */
  isValidNavigationId(id: any): boolean {
    const invalidIds = ['', '0', 'undefined', 'null', 'missing-id', null, undefined];
    const idString = String(id);
    
    return id && 
           !invalidIds.includes(idString) && 
           idString.trim() !== '' &&
           idString !== 'NaN';
  },

  /**
   * Log estruturado para tentativas de navegação bloqueadas
   */
  logBlockedNavigation(resource: any, reason: string) {
    console.group('🚫 NAVEGAÇÃO BLOQUEADA');
    console.error('❌ Motivo:', reason);
    console.error('📋 Resource data:', {
      id: resource?.id,
      originalId: resource?.originalId,
      type: resource?.type,
      title: resource?.title?.substring(0, 50) + '...'
    });
    console.error('🔍 Detalhes da validação:', {
      idValue: resource?.id,
      idType: typeof resource?.id,
      idString: String(resource?.id),
      isEmpty: !resource?.id,
      isInvalidId: this.isValidNavigationId(resource?.id) === false
    });
    console.groupEnd();
  },

  /**
   * Log estruturado para navegação bem-sucedida
   */
  logSuccessfulNavigation(resource: any, targetRoute: string, optimized: boolean = false) {
    console.group('✅ NAVEGAÇÃO AUTORIZADA');
    console.log('🎯 Resource:', {
      id: resource.id,
      type: resource.type,
      title: resource.title?.substring(0, 50) + '...'
    });
    console.log('🔗 Target route:', targetRoute);
    console.log('⚡ Optimized:', optimized ? 'YES (tipo na URL)' : 'NO (fallback)');
    console.groupEnd();
  }
};

/**
 * Métricas de performance para navegação
 */
export const NavigationMetrics = {
  private: {
    navigationAttempts: 0,
    blockedNavigations: 0,
    optimizedNavigations: 0
  },

  recordNavigationAttempt() {
    this.private.navigationAttempts++;
  },

  recordBlockedNavigation() {
    this.private.blockedNavigations++;
  },

  recordOptimizedNavigation() {
    this.private.optimizedNavigations++;
  },

  getMetrics() {
    const total = this.private.navigationAttempts;
    const blocked = this.private.blockedNavigations;
    const optimized = this.private.optimizedNavigations;
    
    return {
      totalAttempts: total,
      blockedCount: blocked,
      successfulCount: total - blocked,
      optimizedCount: optimized,
      blockRate: total > 0 ? (blocked / total * 100).toFixed(1) + '%' : '0%',
      optimizationRate: total > 0 ? (optimized / total * 100).toFixed(1) + '%' : '0%'
    };
  },

  logMetrics() {
    console.log('📊 NAVIGATION METRICS:', this.getMetrics());
  }
};