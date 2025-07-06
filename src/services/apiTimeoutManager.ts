
// Sistema de gerenciamento de timeout e cancelamento forçado
export class ApiTimeoutManager {
  private activeControllers = new Map<string, AbortController>();
  private timeoutIds = new Map<string, NodeJS.Timeout>();

  createAbortableRequest(requestId: string, timeoutMs: number = 2000): {
    controller: AbortController;
    timeoutPromise: Promise<never>;
    cleanup: () => void;
  } {
    // Cancelar qualquer requisição anterior com mesmo ID
    this.cleanup(requestId);

    const controller = new AbortController();
    this.activeControllers.set(requestId, controller);

    console.log(`⚡ ${requestId} - Creating abortable request with ${timeoutMs}ms timeout`);

    // Timeout Promise que força cancelamento
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        console.log(`⏰ ${requestId} - FORCE ABORT: Timeout reached (${timeoutMs}ms)`);
        controller.abort();
        this.cleanup(requestId);
        reject(new Error(`Request timeout after ${timeoutMs}ms - FORCE ABORTED`));
      }, timeoutMs);
      
      this.timeoutIds.set(requestId, timeoutId);
    });

    const cleanup = () => this.cleanup(requestId);

    return { controller, timeoutPromise, cleanup };
  }

  private cleanup(requestId: string): void {
    const controller = this.activeControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.activeControllers.delete(requestId);
    }

    const timeoutId = this.timeoutIds.get(requestId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeoutIds.delete(requestId);
    }
  }

  cancelAll(): void {
    console.log('🧹 Cancelling all active requests');
    this.activeControllers.forEach((controller, id) => {
      console.log(`❌ Cancelling ${id}`);
      controller.abort();
    });
    this.timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
    this.activeControllers.clear();
    this.timeoutIds.clear();
  }

  getActiveRequests(): string[] {
    return Array.from(this.activeControllers.keys());
  }
}
