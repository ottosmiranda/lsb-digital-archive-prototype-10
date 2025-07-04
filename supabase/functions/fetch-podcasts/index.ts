
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PodcastApiResponse {
  tipo: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  conteudo: PodcastEpisodeItem[];
}

interface PodcastEpisodeItem {
  tipo: string;
  podcast_id: string;
  podcast_titulo: string;
  publicador: string;
  episodio_id: string;
  episodio_titulo: string;
  descricao: string;
  data_lancamento: string;
  duracao_ms: number;
  url: string;
  embed_url: string;
  imagem_url: string;
}

interface TransformedPodcast {
  id: number;
  title: string;
  type: 'podcast';
  author: string;
  description: string;
  year: number;
  subject: string;
  duration?: string;
  thumbnail?: string;
  embedUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎧 Starting optimized podcast API fetch...');
    
    // Parse request body for pagination parameters
    let page = 1;
    let limit = 10;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        page = body.page || 1;
        limit = body.limit || 10;
        console.log(`📄 Request params: page=${page}, limit=${limit}`);
      } catch (e) {
        console.log('📄 No body params, using defaults');
      }
    }

    const baseUrl = 'https://link-business-school.onrender.com/api/v1/conteudo-lbs';
    const apiUrl = `${baseUrl}?tipo=podcast&page=${page}&limit=${limit}`;
    
    console.log(`📡 Fetching podcasts from: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LSB-Digital-Library/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: PodcastApiResponse = await response.json();
    console.log(`✅ API Response: ${data.conteudo.length} podcasts, page ${data.page}/${data.totalPages}`);

    // Format duration from milliseconds to readable format
    const formatDuration = (durationMs: number): string => {
      const minutes = Math.floor(durationMs / 60000);
      if (minutes < 60) {
        return `${minutes}min`;
      }
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    };

    // Transform episodes to match SearchResult interface
    const transformedPodcasts: TransformedPodcast[] = data.conteudo.map((episode, index) => ({
      id: (page - 1) * limit + index + 2000, // Generate unique IDs based on page and position
      title: episode.episodio_titulo || 'Episódio sem título',
      type: 'podcast' as const,
      author: episode.publicador || 'Autor não informado',
      description: episode.descricao || 'Descrição não disponível',
      year: episode.data_lancamento ? new Date(episode.data_lancamento).getFullYear() : 2024,
      subject: episode.podcast_titulo || 'Podcast',
      duration: episode.duracao_ms ? formatDuration(episode.duracao_ms) : undefined,
      thumbnail: episode.imagem_url,
      embedUrl: episode.embed_url
    }));

    console.log(`✅ Podcasts transformed: ${transformedPodcasts.length} items for page ${page}`);

    return new Response(JSON.stringify({
      success: true,
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
      count: transformedPodcasts.length,
      podcasts: transformedPodcasts
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('❌ Error in fetch-podcasts function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      podcasts: []
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

serve(handler);
