
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Weekly Content Rotation - Starting...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar todos os conteúdos das APIs
    const [videosResult, booksResult, podcastsResult] = await Promise.allSettled([
      supabase.functions.invoke('fetch-videos'),
      supabase.functions.invoke('fetch-books'),
      supabase.functions.invoke('fetch-podcasts')
    ]);

    let allItems: any[] = [];

    // Processar vídeos
    if (videosResult.status === 'fulfilled' && videosResult.value.data?.success) {
      allItems.push(...videosResult.value.data.videos.map((item: any) => ({ ...item, type: 'video' })));
    }

    // Processar livros
    if (booksResult.status === 'fulfilled' && booksResult.value.data?.success) {
      allItems.push(...booksResult.value.data.books.map((item: any) => ({ ...item, type: 'titulo' })));
    }

    // Processar podcasts
    if (podcastsResult.status === 'fulfilled' && podcastsResult.value.data?.success) {
      allItems.push(...podcastsResult.value.data.podcasts.map((item: any) => ({ ...item, type: 'podcast' })));
    }

    console.log(`📊 Total items available: ${allItems.length}`);

    // Implementar lógica de mesclagem inteligente para 6 itens
    const getWeeklyHighlights = (items: any[]) => {
      const videos = items.filter(item => item.type === 'video');
      const books = items.filter(item => item.type === 'titulo');
      const podcasts = items.filter(item => item.type === 'podcast');

      // Embaralhar cada categoria para variedade semanal
      const shuffleArray = (array: any[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const shuffledVideos = shuffleArray(videos);
      const shuffledBooks = shuffleArray(books);
      const shuffledPodcasts = shuffleArray(podcasts);

      // Criar padrão mesclado: livro, podcast, vídeo, livro, podcast, vídeo
      const highlights = [];
      const pattern = ['titulo', 'podcast', 'video'];
      
      for (let i = 0; i < 6; i++) {
        const targetType = pattern[i % 3];
        let item = null;

        if (targetType === 'titulo' && shuffledBooks.length > Math.floor(i / 3)) {
          item = shuffledBooks[Math.floor(i / 3)];
        } else if (targetType === 'podcast' && shuffledPodcasts.length > Math.floor(i / 3)) {
          item = shuffledPodcasts[Math.floor(i / 3)];
        } else if (targetType === 'video' && shuffledVideos.length > Math.floor(i / 3)) {
          item = shuffledVideos[Math.floor(i / 3)];
        }

        // Fallback: pegar qualquer item disponível se o tipo preferido não estiver disponível
        if (!item) {
          const remainingItems = [...shuffledBooks, ...shuffledPodcasts, ...shuffledVideos];
          const usedIds = highlights.map(h => h.id);
          item = remainingItems.find(i => !usedIds.includes(i.id));
        }

        if (item && !highlights.find(h => h.id === item.id)) {
          highlights.push(item);
        }
      }

      return highlights.slice(0, 6);
    };

    const weeklyHighlights = getWeeklyHighlights(allItems);
    console.log(`✅ Selected ${weeklyHighlights.length} weekly highlights:`, 
                weeklyHighlights.map(h => `${h.type}: ${h.title?.substring(0, 30)}...`));

    // Desativar rotações anteriores
    await supabase
      .from('featured_content_rotation')
      .update({ is_active: false })
      .eq('content_type', 'weekly_highlights');

    // Inserir nova rotação
    const { error: insertError } = await supabase
      .from('featured_content_rotation')
      .insert({
        content_type: 'weekly_highlights',
        content_data: { highlights: weeklyHighlights },
        rotation_date: new Date().toISOString(),
        is_active: true
      });

    if (insertError) {
      console.error('❌ Error inserting weekly highlights:', insertError);
      throw insertError;
    }

    console.log('✅ Weekly content rotation completed successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Weekly content rotation completed',
      highlightsCount: weeklyHighlights.length,
      rotationDate: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Weekly content rotation error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
