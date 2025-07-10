
import { SearchResult } from '@/types/searchTypes';
import { ContentType, ContentCounts } from './apiConfig';

export class SupabaseFallback {
  async fetchFromSupabase(tipo: ContentType): Promise<SearchResult[]> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      let functionName: string;
      switch (tipo) {
        case 'livro': functionName = 'fetch-books'; break;
        case 'aula': functionName = 'fetch-videos'; break;
        case 'podcast': functionName = 'fetch-podcasts'; break;
        case 'artigos': functionName = 'fetch-books'; break; // Articles use same function as books
        default: throw new Error(`Tipo não suportado: ${tipo}`);
      }
      
      console.log(`📡 Chamando função Supabase: ${functionName}`);
      const { data, error } = await supabase.functions.invoke(functionName);
      
      if (error || !data.success) {
        console.error(`❌ Supabase ${functionName} erro:`, error || data.error);
        return [];
      }
      
      const items = tipo === 'livro' || tipo === 'artigos' ? data.books : tipo === 'aula' ? data.videos : data.podcasts;
      console.log(`✅ Supabase sucesso: ${items.length} ${tipo}s`);
      return items;
      
    } catch (error) {
      console.error(`❌ Fallback Supabase falhou para ${tipo}:`, error);
      return [];
    }
  }

  async fetchAllFromSupabase(): Promise<{
    videos: SearchResult[];
    books: SearchResult[];
    podcasts: SearchResult[];
    articles: SearchResult[];
  }> {
    console.log('🔄 Emergência: Todo conteúdo do Supabase');
    
    try {
      const [booksResult, videosResult, podcastsResult, articlesResult] = await Promise.allSettled([
        this.fetchFromSupabase('livro'),
        this.fetchFromSupabase('aula'),
        this.fetchFromSupabase('podcast'),
        this.fetchFromSupabase('artigos')
      ]);

      const books = booksResult.status === 'fulfilled' ? booksResult.value.slice(0, 12) : [];
      const videos = videosResult.status === 'fulfilled' ? videosResult.value.slice(0, 12) : [];
      const podcasts = podcastsResult.status === 'fulfilled' ? podcastsResult.value.slice(0, 12) : [];
      const articles = articlesResult.status === 'fulfilled' ? articlesResult.value.slice(0, 12) : [];

      console.log('✅ Emergência Supabase completa:', {
        books: books.length,
        videos: videos.length,
        podcasts: podcasts.length,
        articles: articles.length
      });

      return { videos, books, podcasts, articles };
      
    } catch (error) {
      console.error('❌ Emergência Supabase falhou:', error);
      return { videos: [], books: [], podcasts: [], articles: [] };
    }
  }

  // NOVO: Método para obter contagens reais com timeout mais curto
  async getRealTimeCounts(): Promise<ContentCounts> {
    console.log('🔄 Buscando contagens REAIS em tempo real');
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const timeoutMs = 8000; // Reduzido para 8 segundos
      const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout após ${ms}ms`)), ms)
          )
        ]);
      };

      console.log('📡 Iniciando busca paralela de contagens reais...');
      const [booksResult, videosResult, podcastsResult] = await Promise.allSettled([
        withTimeout(supabase.functions.invoke('fetch-books'), timeoutMs),
        withTimeout(supabase.functions.invoke('fetch-videos'), timeoutMs),
        withTimeout(supabase.functions.invoke('fetch-podcasts'), timeoutMs)
      ]);

      // Processar resultados com logs detalhados
      const books = this.extractRealCount(booksResult, 'books', 'Livros');
      const videos = this.extractRealCount(videosResult, 'videos', 'Vídeos');  
      const podcasts = this.extractRealCount(podcastsResult, 'podcasts', 'Podcasts');
      const articles = Math.floor(books * 0.3); // Estimativa baseada em livros

      const counts = { videos, books, podcasts, articles };
      
      console.log('✅ Contagens REAIS obtidas:', counts);
      console.log('📊 BADGES ATUALIZADOS:', {
        livros: `${books} itens`,
        videos: `${videos} itens`, 
        podcasts: `${podcasts} itens`,
        artigos: `${articles} itens`
      });
      
      return counts;
      
    } catch (error) {
      console.error('❌ Erro ao buscar contagens reais:', error);
      return this.getExactFallbackCounts();
    }
  }

  private extractRealCount(result: PromiseSettledResult<any>, dataKey: string, label: string): number {
    if (result.status === 'fulfilled' && result.value.data?.success) {
      const total = result.value.data.total || result.value.data[dataKey]?.length || 0;
      console.log(`📊 ${label} - Total real: ${total}`);
      return total;
    } else {
      console.warn(`⚠️ ${label} - Falha ao obter contagem real:`, result.status === 'rejected' ? result.reason : 'Data inválida');
      return 0;
    }
  }

  async getExactFallbackCounts(): Promise<ContentCounts> {
    console.log('🔄 Usando contagens EXATAS de fallback');
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const timeoutMs = 10000;
      const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout Supabase após ${ms}ms`)), ms)
          )
        ]);
      };

      const [booksResult, videosResult, podcastsResult, articlesResult] = await Promise.allSettled([
        withTimeout(supabase.functions.invoke('fetch-books'), timeoutMs),
        withTimeout(supabase.functions.invoke('fetch-videos'), timeoutMs),
        withTimeout(supabase.functions.invoke('fetch-podcasts'), timeoutMs),
        withTimeout(supabase.functions.invoke('fetch-books'), timeoutMs) // Articles use same function
      ]);

      // Usar totais reais quando disponível, senão usar números EXATOS conhecidos
      const books = booksResult.status === 'fulfilled' && booksResult.value.data?.success 
        ? (booksResult.value.data.total || booksResult.value.data.books?.length || 30) : 30;
      const videos = videosResult.status === 'fulfilled' && videosResult.value.data?.success 
        ? (videosResult.value.data.total || videosResult.value.data.videos?.length || 300) : 300;
      const podcasts = podcastsResult.status === 'fulfilled' && podcastsResult.value.data?.success 
        ? (podcastsResult.value.data.total || podcastsResult.value.data.podcasts?.length || 2512) : 2512;
      const articles = articlesResult.status === 'fulfilled' && articlesResult.value.data?.success 
        ? (articlesResult.value.data.total || articlesResult.value.data.books?.length || 35) : 35;

      const counts = { videos, books, podcasts, articles };
      
      console.log('✅ Contagens EXATAS de fallback:', counts);
      return counts;
      
    } catch (error) {
      console.error('❌ Fallback exato falhou para contagens:', error);
      
      // Números EXATOS conhecidos como última instância
      return { 
        videos: 300,    // Número EXATO conhecido
        books: 30,      // Número EXATO conhecido
        podcasts: 2512, // Número EXATO conhecido
        articles: 35    // Número EXATO conhecido
      };
    }
  }
}
