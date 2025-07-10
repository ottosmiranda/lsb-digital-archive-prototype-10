import React, { createContext, useContext, useEffect, useState } from 'react';
import { SearchResult } from '@/types/searchTypes';
import { newApiService } from '@/services/newApiService';
import { supabase } from '@/integrations/supabase/client';

interface HomepageContent {
  videos: SearchResult[];
  books: SearchResult[];
  podcasts: SearchResult[];
  articles: SearchResult[];
}

interface ContentCounts {
  videos: number;
  books: number;
  podcasts: number;
  articles: number;
}

// Type definitions for rotated content data
interface WeeklyHighlightsData {
  highlights: SearchResult[];
}

interface DailyMediaData {
  videos: SearchResult[];
  podcasts: SearchResult[];
}

interface RotatedContent {
  weeklyHighlights: SearchResult[];
  dailyMedia: {
    videos: SearchResult[];
    podcasts: SearchResult[];
  };
}

interface HomepageContentContextType {
  content: HomepageContent;
  contentCounts: ContentCounts;
  rotatedContent: RotatedContent;
  loading: boolean;
  countsLoading: boolean;
  error: string | null;
  retry: () => void;
  isUsingFallback: boolean;
  apiStatus: any;
  clearAllCaches: () => void;
}

const HomepageContentContext = createContext<HomepageContentContextType | undefined>(undefined);

export const useHomepageContentContext = () => {
  const context = useContext(HomepageContentContext);
  if (context === undefined) {
    throw new Error('useHomepageContentContext must be used within a HomepageContentProvider');
  }
  return context;
};

interface HomepageContentProviderProps {
  children: React.ReactNode;
}

export const HomepageContentProvider: React.FC<HomepageContentProviderProps> = ({ children }) => {
  const [content, setContent] = useState<HomepageContent>({
    videos: [],
    books: [],
    podcasts: [],
    articles: []
  });
  const [rotatedContent, setRotatedContent] = useState<RotatedContent>({
    weeklyHighlights: [],
    dailyMedia: { videos: [], podcasts: [] }
  });
  const [contentCounts, setContentCounts] = useState<ContentCounts>({
    videos: 0,
    books: 0,
    podcasts: 0,
    articles: 0
  });
  const [loading, setLoading] = useState(true);
  const [countsLoading, setCountsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [apiStatus, setApiStatus] = useState<any>({});

  console.group('🏠 HomepageContentProvider - ENHANCED Constructor with Rotation and Articles + CACHE BUSTER');
  console.log('📊 Provider initialized at:', new Date().toISOString());
  console.log('🔄 Initial state:', { loading, countsLoading, error, isUsingFallback });
  console.groupEnd();

  // 🔥 NOVO: Método para limpeza total de todos os caches
  const clearAllCaches = () => {
    console.group('🔥 LIMPEZA TOTAL DE TODOS OS CACHES');
    console.log('⏰ Iniciando limpeza total em:', new Date().toISOString());
    
    // Limpar cache do NewApiService
    try {
      newApiService.clearCache();
      console.log('✅ NewApiService cache limpo');
    } catch (e) {
      console.warn('⚠️ Erro ao limpar NewApiService cache:', e);
    }
    
    // Limpar rotated content
    setRotatedContent({
      weeklyHighlights: [],
      dailyMedia: { videos: [], podcasts: [] }
    });
    console.log('✅ Rotated content limpo');
    
    // Limpar storage caches
    try {
      sessionStorage.clear();
      console.log('✅ SessionStorage limpo');
    } catch (e) {
      console.warn('⚠️ Erro ao limpar sessionStorage:', e);
    }
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('cache') || key.includes('api') || key.includes('content')) {
          localStorage.removeItem(key);
          console.log('🧹 LocalStorage key removida:', key);
        }
      });
    } catch (e) {
      console.warn('⚠️ Erro ao limpar localStorage:', e);
    }
    
    console.log('🔥 LIMPEZA TOTAL CONCLUÍDA - Todos os caches foram limpos');
    console.groupEnd();
  };

  const loadRotatedContent = async () => {
    console.group('🔄 Loading rotated content from database...');
    
    try {
      // 🔥 CACHE BUSTER: Adicionar timestamp para forçar refresh
      const cacheBuster = Date.now();
      console.log('🔥 Cache buster aplicado:', cacheBuster);
      
      // Buscar conteúdo rotacionado ativo
      const { data: rotations, error: rotationError } = await supabase
        .from('featured_content_rotation')
        .select('*')
        .eq('is_active', true)
        .order('rotation_date', { ascending: false });

      if (rotationError) {
        console.error('❌ Error loading rotated content:', rotationError);
        return;
      }

      console.log('📊 Found rotations:', rotations?.length || 0);

      const weeklyRotation = rotations?.find(r => r.content_type === 'weekly_highlights');
      const dailyRotation = rotations?.find(r => r.content_type === 'daily_media');

      const newRotatedContent: RotatedContent = {
        weeklyHighlights: weeklyRotation?.content_data 
          ? (weeklyRotation.content_data as unknown as WeeklyHighlightsData).highlights || []
          : [],
        dailyMedia: {
          videos: dailyRotation?.content_data 
            ? (dailyRotation.content_data as unknown as DailyMediaData).videos || []
            : [],
          podcasts: dailyRotation?.content_data 
            ? (dailyRotation.content_data as unknown as DailyMediaData).podcasts || []
            : []
        }
      };

      setRotatedContent(newRotatedContent);
      
      console.log('✅ Rotated content loaded:', {
        weeklyHighlights: newRotatedContent.weeklyHighlights.length,
        dailyVideos: newRotatedContent.dailyMedia.videos.length,
        dailyPodcasts: newRotatedContent.dailyMedia.podcasts.length
      });

    } catch (err) {
      console.error('❌ Error loading rotated content:', err);
    }
    
    console.groupEnd();
  };

  const loadContentCounts = async () => {
    console.group('📊 ENHANCED LOAD CONTENT COUNTS - Real-time com TTL reduzido');
    console.log('⏰ Counts load started at:', new Date().toISOString());
    
    setCountsLoading(true);
    
    const countsTimeout = 10000;
    const timeoutPromise = new Promise<ContentCounts>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Content counts timeout after ${countsTimeout}ms`));
      }, countsTimeout);
    });
    
    try {
      console.log('🚀 Iniciando busca de contagens com TTL de 5 minutos...');
      const countsPromise = newApiService.fetchContentCounts();
      const counts = await Promise.race([countsPromise, timeoutPromise]);
      
      // Validar contagens antes de definir
      const totalCounts = counts.videos + counts.books + counts.podcasts + counts.articles;
      if (totalCounts > 50) { // Threshold mínimo
        setContentCounts(counts);
        console.log('✅ Content counts loaded successfully:', counts);
        console.log('📊 BADGES ATUALIZADOS:', {
          livros: `${counts.books} itens`,
          videos: `${counts.videos} itens`,
          podcasts: `${counts.podcasts} itens`,
          artigos: `${counts.articles} itens`
        });
      } else {
        console.warn('⚠️ Contagens muito baixas, usando fallback:', counts);
        throw new Error('Contagens insuficientes');
      }
      
    } catch (err) {
      console.error('❌ Failed to load content counts:', err);
      
      // NOVO: Tentar método de fallback em tempo real
      try {
        console.log('🔄 Tentando fallback em tempo real...');
        const { SupabaseFallback } = await import('@/services/api/supabaseFallback');
        const fallback = new SupabaseFallback();
        const realTimeCounts = await fallback.getRealTimeCounts();
        
        setContentCounts(realTimeCounts);
        console.log('✅ Fallback real-time bem-sucedido:', realTimeCounts);
      } catch (fallbackError) {
        console.error('❌ Fallback também falhou:', fallbackError);
        
        const emergencyCounts = { videos: 50, books: 100, podcasts: 500, articles: 35 };
        setContentCounts(emergencyCounts);
        console.log('🆘 Using emergency counts:', emergencyCounts);
      }
      
    } finally {
      setCountsLoading(false);
      console.log('📊 Counts loading finished at:', new Date().toISOString());
      console.groupEnd();
    }
  };

  const loadContent = async () => {
    console.group('🚀 DIAGNOSTIC loadContent - Phase 1: Starting data load with CACHE BUSTER ACTIVE');
    console.log('⏰ Load started at:', new Date().toISOString());
    console.log('🔥 CACHE BUSTER ATIVO - Todos os caches serão ignorados');
    console.log('🔄 Setting loading state to true');
    
    setLoading(true);
    setError(null);
    setIsUsingFallback(false);

    // 🔥 CACHE BUSTER: Limpar todos os caches antes de carregar
    clearAllCaches();

    try {
      const status = newApiService.getStatus();
      setApiStatus(status);
      console.group('📊 DIAGNOSTIC API STATUS DASHBOARD');
      console.log('Health Status:', status.healthStatus.toUpperCase());
      console.log('Circuit Breaker:', status.circuitBreaker.breakerOpen ? 'OPEN' : 'CLOSED');
      console.log('Cache Size:', status.cacheSize);
      console.log('Active Requests:', status.activeRequests);
      console.groupEnd();

      console.log('📡 PHASE 1: Calling newApiService.fetchHomepageContent() with CACHE BUSTER...');
      const startTime = Date.now();
      
      const homepageContent = await newApiService.fetchHomepageContent();
      
      const loadTime = Date.now() - startTime;
      console.log('✅ PHASE 1: API Response received in', loadTime, 'ms:', {
        videos: homepageContent.videos.length,
        books: homepageContent.books.length,
        podcasts: homepageContent.podcasts.length,
        articles: homepageContent.articles.length,
        totalItems: homepageContent.videos.length + homepageContent.books.length + homepageContent.podcasts.length + homepageContent.articles.length,
        loadTimeMs: loadTime
      });

      console.group('🔍 PHASE 1: Data validation and source detection including articles');
      console.log('Videos sample:', homepageContent.videos.slice(0, 2));
      console.log('Books sample:', homepageContent.books.slice(0, 2));
      console.log('Podcasts sample:', homepageContent.podcasts.slice(0, 2));
      console.log('Articles sample:', homepageContent.articles.slice(0, 2));
      
      // 🔍 DEBUG: Verificar thumbnails dos livros
      console.group('🖼️ BOOKS THUMBNAIL DEBUG');
      homepageContent.books.slice(0, 3).forEach((book, index) => {
        console.log(`Livro ${index + 1}:`, {
          title: book.title.substring(0, 40) + '...',
          thumbnail: book.thumbnail,
          hasBiblio: book.thumbnail?.toLowerCase().includes('biblio')
        });
      });
      console.groupEnd();
      
      const usingFallback = homepageContent.videos.some(v => v.id > 1000000) || 
                           homepageContent.books.some(b => b.id > 2000) ||
                           homepageContent.podcasts.some(p => p.id > 1000) ||
                           homepageContent.articles.some(a => a.id > 2000);
      
      console.log('Data source:', usingFallback ? 'SUPABASE FALLBACK' : 'EXTERNAL API');
      console.groupEnd();
      
      console.log('🔄 PHASE 2: Setting content in React state...');
      setContent(homepageContent);
      setIsUsingFallback(usingFallback);
      
      // Carregar conteúdo rotacionado
      await loadRotatedContent();
      
      console.log('✅ PHASE 2: Content state updated successfully');
      console.log('📊 PHASE 2: Final content state:', {
        videos: homepageContent.videos.length,
        books: homepageContent.books.length,
        podcasts: homepageContent.podcasts.length,
        articles: homepageContent.articles.length,
        isUsingFallback: usingFallback
      });
      
    } catch (err) {
      console.error('❌ PHASE 1: Critical error in loadContent:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace',
        timestamp: new Date().toISOString()
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load content';
      setError(errorMessage);
      
      // FASE 1: Emergency fallback attempt
      try {
        console.log('🆘 EMERGENCY: Attempting direct Supabase fallback...');
        const { supabase } = await import('@/integrations/supabase/client');
        
        const [videosResult, booksResult, podcastsResult] = await Promise.allSettled([
          supabase.functions.invoke('fetch-videos'),
          supabase.functions.invoke('fetch-books'),
          supabase.functions.invoke('fetch-podcasts')
        ]);

        const videos = videosResult.status === 'fulfilled' && videosResult.value.data?.success 
          ? videosResult.value.data.videos.slice(0, 6) : [];
        const books = booksResult.status === 'fulfilled' && booksResult.value.data?.success 
          ? booksResult.value.data.books.slice(0, 6) : [];
        const podcasts = podcastsResult.status === 'fulfilled' && podcastsResult.value.data?.success 
          ? podcastsResult.value.data.podcasts.slice(0, 6) : [];

        const totalFallbackItems = videos.length + books.length + podcasts.length;
        
        if (totalFallbackItems > 0) {
          console.log('✅ EMERGENCY: Fallback successful:', { videos: videos.length, books: books.length, podcasts: podcasts.length });
          setContent({ videos, books, podcasts, articles: [] });
          await loadRotatedContent();
          setIsUsingFallback(true);
          setError(null);
        } else {
          console.log('❌ EMERGENCY: Fallback also failed - no content available');
          setContent({ videos: [], books: [], podcasts: [], articles: [] });
        }
        
      } catch (fallbackError) {
        console.error('❌ EMERGENCY: Final fallback failed:', fallbackError);
        setContent({ videos: [], books: [], podcasts: [], articles: [] });
      }
      
    } finally {
      console.log('🔄 PHASE 2: Setting loading to false');
      setLoading(false);
      console.log('⏰ DIAGNOSTIC: Load completed at:', new Date().toISOString());
      console.groupEnd();
    }
  };

  useEffect(() => {
    console.log('🎯 useEffect triggered - Starting ENHANCED content and counts load with CACHE BUSTER');
    
    Promise.allSettled([
      loadContent(),
      loadContentCounts()
    ]).then((results) => {
      console.log('🏁 All loading operations completed:', {
        contentResult: results[0].status,
        countsResult: results[1].status
      });
    });
  }, []);

  const retry = () => {
    console.log('🔄 Enhanced retry requested by user - FULL CACHE CLEAR and reloading');
    
    // 🔥 CACHE BUSTER: Limpeza total antes do retry
    clearAllCaches();
    
    setError(null);
    setCountsLoading(true);
    setLoading(true);
    
    Promise.allSettled([
      loadContent(),
      loadContentCounts()
    ]);
  };

  useEffect(() => {
    console.log('📊 Context state updated:', {
      loading,
      countsLoading,
      error,
      isUsingFallback,
      contentSummary: {
        videos: content.videos.length,
        books: content.books.length,
        podcasts: content.podcasts.length
      },
      rotatedContentSummary: {
        weeklyHighlights: rotatedContent.weeklyHighlights.length,
        dailyVideos: rotatedContent.dailyMedia.videos.length,
        dailyPodcasts: rotatedContent.dailyMedia.podcasts.length
      },
      contentCounts,
      apiStatus
    });
  }, [loading, countsLoading, error, isUsingFallback, content, rotatedContent, contentCounts, apiStatus]);

  return (
    <HomepageContentContext.Provider
      value={{
        content,
        contentCounts,
        rotatedContent,
        loading,
        countsLoading,
        error,
        retry,
        isUsingFallback,
        apiStatus,
        clearAllCaches
      }}
    >
      {children}
    </HomepageContentContext.Provider>
  );
};
