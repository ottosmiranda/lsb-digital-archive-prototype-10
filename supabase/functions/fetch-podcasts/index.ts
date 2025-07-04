

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎧 Starting podcast API fetch...');
    
    const baseUrl = 'https://link-business-school.onrender.com/api/v1/conteudo-lbs';
    const allEpisodes: PodcastEpisodeItem[] = [];
    
    // Fetch 5 pages with limit 10 (as per API pagination) for ~50 episodes
    const maxPages = 5;
    const itemsPerPage = 10; // API uses 10 items per page
    let currentPage = 1;
    let totalPages = 1;

    do {
      console.log(`📡 Fetching page ${currentPage}/${Math.min(totalPages, maxPages)}...`);
      
      const apiUrl = `${baseUrl}?tipo=podcast&page=${currentPage}&limit=${itemsPerPage}`;
      console.log(`🔗 API URL: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LSB-Digital-Library/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: PodcastApiResponse = await response.json();
      console.log(`✅ Page ${currentPage} fetched: ${data.conteudo.length} episodes`);
      console.log(`📊 API Response meta: total=${data.total}, totalPages=${data.totalPages}, limit=${data.limit}`);

      allEpisodes.push(...data.conteudo);
      totalPages = Math.min(data.totalPages, maxPages); // Limit total pages
      currentPage++;

    } while (currentPage <= totalPages);

    console.log(`🎯 Total episodes fetched: ${allEpisodes.length}`);

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
    const transformedPodcasts: TransformedPodcast[] = allEpisodes.map((episode, index) => ({
      id: index + 2000, // Start from 2000 to avoid conflicts with videos
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

    console.log(`✅ Podcasts transformed successfully: ${transformedPodcasts.length} items`);
    console.log(`🔍 Sample podcast data:`, transformedPodcasts.slice(0, 2));

    return new Response(JSON.stringify({
      success: true,
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

