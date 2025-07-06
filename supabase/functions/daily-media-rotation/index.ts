
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
    console.log('🔄 Daily Media Rotation - Starting...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar vídeos e podcasts das APIs
    const [videosResult, podcastsResult] = await Promise.allSettled([
      supabase.functions.invoke('fetch-videos'),
      supabase.functions.invoke('fetch-podcasts')
    ]);

    let videos: any[] = [];
    let podcasts: any[] = [];

    // Processar vídeos
    if (videosResult.status === 'fulfilled' && videosResult.value.data?.success) {
      videos = videosResult.value.data.videos;
    }

    // Processar podcasts
    if (podcastsResult.status === 'fulfilled' && podcastsResult.value.data?.success) {
      podcasts = podcastsResult.value.data.podcasts;
    }

    console.log(`📊 Available - Videos: ${videos.length}, Podcasts: ${podcasts.length}`);

    // Embaralhar e selecionar 3 de cada tipo
    const shuffleArray = (array: any[]) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const selectedVideos = shuffleArray(videos).slice(0, 3);
    const selectedPodcasts = shuffleArray(podcasts).slice(0, 3);

    console.log(`✅ Selected - Videos: ${selectedVideos.length}, Podcasts: ${selectedPodcasts.length}`);

    const dailyMedia = {
      videos: selectedVideos.map(video => ({
        id: video.id,
        title: video.title,
        duration: video.duration || 'N/A',
        thumbnail: video.thumbnail,
        author: video.author
      })),
      podcasts: selectedPodcasts.map(podcast => ({
        id: podcast.id,
        title: podcast.title,
        duration: podcast.duration || 'N/A',
        thumbnail: podcast.thumbnail,
        author: podcast.author
      }))
    };

    // Desativar rotações anteriores
    await supabase
      .from('featured_content_rotation')
      .update({ is_active: false })
      .eq('content_type', 'daily_media');

    // Inserir nova rotação
    const { error: insertError } = await supabase
      .from('featured_content_rotation')
      .insert({
        content_type: 'daily_media',
        content_data: dailyMedia,
        rotation_date: new Date().toISOString(),
        is_active: true
      });

    if (insertError) {
      console.error('❌ Error inserting daily media:', insertError);
      throw insertError;
    }

    console.log('✅ Daily media rotation completed successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Daily media rotation completed',
      videosCount: selectedVideos.length,
      podcastsCount: selectedPodcasts.length,
      rotationDate: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Daily media rotation error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
