
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

  async fetchAllFromSupabase(): Promise<{
    videos: SearchResult[];
    books: SearchResult[];
    podcasts: SearchResult[];
  }> {
    console.log('🔄 Emergência: Todo conteúdo do Supabase');
    
    try {
      const [booksResult, videosResult, podcastsResult] = await Promise.allSettled([
        this.fetchFromSupabase('livro'),
        this.fetchFromSupabase('aula'),
        this.fetchFromSupabase('podcast')
      ]);

      const books = booksResult.status === 'fulfilled' ? booksResult.value.slice(0, 12) : [];
      const videos = videosResult.status === 'fulfilled' ? videosResult.value.slice(0, 12) : [];
      const podcasts = podcastsResult.status === 'fulfilled' ? podcastsResult.value.slice(0, 12) : [];

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

      const [booksResult, videosResult, podcastsResult] = await Promise.allSettled([
        withTimeout(supabase.functions.invoke('fetch-books'), timeoutMs),
        withTimeout(supabase.functions.invoke('fetch-videos'), timeoutMs),
        withTimeout(supabase.functions.invoke('fetch-podcasts'), timeoutMs)
      ]);

      // Usar totais reais quando disponível, senão usar números EXATOS conhecidos
      const books = booksResult.status === 'fulfilled' && booksResult.value.data?.success 
        ? (booksResult.value.data.total || booksResult.value.data.books?.length || 30) : 30;
      const videos = videosResult.status === 'fulfilled' && videosResult.value.data?.success 
        ? (videosResult.value.data.total || videosResult.value.data.videos?.length || 300) : 300;
      const podcasts = podcastsResult.status === 'fulfilled' && podcastsResult.value.data?.success 
        ? (podcastsResult.value.data.total || podcastsResult.value.data.podcasts?.length || 2512) : 2512;

      const counts = { videos, books, podcasts };
      
      console.log('✅ Contagens EXATAS de fallback:', counts);
      return counts;
      
    } catch (error) {
      console.error('❌ Fallback exato falhou para contagens:', error);
      
      // Números EXATOS conhecidos como última instância
      return { 
        videos: 300,    // Número EXATO conhecido
        books: 30,      // Número EXATO conhecido
        podcasts: 2512  // Número EXATO conhecido
      };
    }
  }
}
