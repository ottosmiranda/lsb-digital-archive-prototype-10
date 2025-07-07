
export class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private breakerOpen = false;
  private readonly openDuration = 20000;
  private readonly failureThreshold = 5;

  isOpen(): boolean {
    if (!this.breakerOpen) return false;
    
    const now = Date.now();
    if (now - this.lastFailTime > this.openDuration) {
      console.log('🔄 Circuit breaker resetado - tentando novamente');
      this.breakerOpen = false;
      this.failures = 0;
      return false;
    }
    
    console.log('⚡ Circuit breaker ABERTO - falha rápida');
    return true;
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.breakerOpen = true;
      console.log('⚡ Circuit breaker ABERTO - muitas falhas');
    }
  }

  recordSuccess(): void {
    this.failures = 0;
    this.breakerOpen = false;
  }

  reset(): void {
    this.failures = 0;
    this.lastFailTime = 0;
    this.breakerOpen = false;
  }

  getStatus() {
    return {
      failures: this.failures,
      lastFailTime: this.lastFailTime,
      breakerOpen: this.breakerOpen,
      openDuration: this.openDuration
    };
  }
}
