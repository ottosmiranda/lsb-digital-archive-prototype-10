
import { API_BASE_URL, ContentType, SCALABLE_CONFIG, APIResponse } from './apiConfig';
import { SearchResult } from '@/types/searchTypes';
import { ApiTimeoutManager } from '../apiTimeoutManager';
import { DataTransformer } from './dataTransformer';

export class ContentFetcher {
  private timeoutManager: ApiTimeoutManager;
  private dataTransformer: DataTransformer;

  constructor(timeoutManager: ApiTimeoutManager, dataTransformer: DataTransformer) {
    this.timeoutManager = timeoutManager;
    this.dataTransformer = dataTransformer;
  }

  // BUSCA ESCALÁVEL COM MODO "NÚMEROS EXATOS"
  async fetchContentScalable(tipo: ContentType, finalLimit: number, loadAll: boolean = false): Promise<SearchResult[]> {
    const requestId = `${loadAll ? 'exact' : 'homepage'}_${tipo}_${Date.now()}`;
    console.group(`🚀 ${requestId} - Busca ${loadAll ? 'números exatos' : 'homepage'} ${tipo}`);
    
    try {
      console.log(`🎯 Buscando ${finalLimit} ${tipo}s (modo: ${loadAll ? 'NÚMEROS EXATOS' : 'HOMEPAGE'})`);
      
      const config = SCALABLE_CONFIG[tipo];
      const allItems: SearchResult[] = [];
      const totalChunks = Math.ceil(finalLimit / config.chunkSize);
      
      // Timeout ajustado baseado no modo
      const timeoutMs = loadAll ? 60000 : 15000; // 60s para números exatos, 15s para homepage
      
      // Processar em batches paralelos
      for (let batchStart = 0; batchStart < totalChunks; batchStart += config.maxConcurrency) {
        const batchEnd = Math.min(batchStart + config.maxConcurrency, totalChunks);
        const chunkPromises: Promise<SearchResult[]>[] = [];
        
        // Criar promises para o batch
        for (let chunkIndex = batchStart; chunkIndex < batchEnd; chunkIndex++) {
          const page = chunkIndex + 1;
          const chunkPromise = this.fetchSingleChunk(tipo, page, config.chunkSize, requestId, timeoutMs);
          chunkPromises.push(chunkPromise);
        }
        
        console.log(`📦 Batch ${Math.ceil(batchStart / config.maxConcurrency) + 1}: chunks ${batchStart + 1}-${batchEnd}`);
        
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
          
          // Pausa entre batches (menor para homepage)
          if (batchEnd < totalChunks) {
            await new Promise(resolve => setTimeout(resolve, loadAll ? 500 : 200));
          }
          
        } catch (error) {
          console.error(`❌ Erro no batch:`, error);
        }
      }

      const finalItems = allItems.slice(0, finalLimit);
      
      console.log(`✅ Busca ${loadAll ? 'números exatos' : 'homepage'} concluída: ${finalItems.length} ${tipo}s`);
      console.groupEnd();
      
      return finalItems;
      
    } catch (error) {
      console.error(`❌ Erro busca ${loadAll ? 'números exatos' : 'homepage'} ${tipo}:`, error);
      console.groupEnd();
      throw error;
    }
  }

  // BUSCA DE CHUNK INDIVIDUAL COM TIMEOUT CONFIGURÁVEL
  async fetchSingleChunk(tipo: string, page: number, limit: number, requestId: string, timeoutMs: number = 8000): Promise<SearchResult[]> {
    const url = `${API_BASE_URL}/conteudo-lbs?tipo=${tipo}&page=${page}&limit=${limit}`;
    
    try {
      const { controller, timeoutPromise, cleanup } = this.timeoutManager.createAbortableRequest(`${requestId}_chunk${page}`, timeoutMs);
      
      const fetchPromise = fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'LSB-ExactNumbers-Search/2.0'
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

      const transformedItems = items.map((item: any) => this.dataTransformer.transformToSearchResult(item, tipo));
      cleanup();
      return transformedItems;
      
    } catch (error) {
      console.error(`❌ Erro chunk ${tipo} página ${page}:`, error);
      return [];
    }
  }
}
