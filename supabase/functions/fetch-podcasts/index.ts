
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
  conteudo: PodcastItem[];
}

interface PodcastItem {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  publicador: string;
  url: string;
  ano: string;
  categorias: string[];
  total_episodes: string;
  imagem_url: string;
  pais: string;
  embed_url: string;
}

interface TransformedPodcast {
  id: number;
  title: string;
  type: 'podcast';
  author: string;
  description: string;
  year: number;
  subject: string;
  episodes?: string;
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
    const allPodcasts: PodcastItem[] = [];
    let currentPage = 1;
    let totalPages = 1;

    // Fetch all pages
    do {
      console.log(`📡 Fetching page ${currentPage}/${totalPages}...`);
      
      const apiUrl = `${baseUrl}?tipo=podcast&page=${currentPage}`;
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
      console.log(`✅ Page ${currentPage} fetched: ${data.conteudo.length} podcasts`);

      allPodcasts.push(...data.conteudo);
      totalPages = data.totalPages;
      currentPage++;

    } while (currentPage <= totalPages);

    console.log(`🎯 Total podcasts fetched: ${allPodcasts.length}`);

    // Transform podcasts to match SearchResult interface
    const transformedPodcasts: TransformedPodcast[] = allPodcasts.map((podcast, index) => ({
      id: index + 2000, // Start from 2000 to avoid conflicts with videos
      title: podcast.titulo || 'Podcast sem título',
      type: 'podcast' as const,
      author: podcast.publicador || 'Autor não informado',
      description: podcast.descricao || 'Descrição não disponível',
      year: podcast.ano ? parseInt(podcast.ano) : 2023,
      subject: podcast.categorias && podcast.categorias.length > 0 ? podcast.categorias[0] : 'Podcast',
      episodes: podcast.total_episodes ? `${podcast.total_episodes} episódios` : undefined,
      thumbnail: podcast.imagem_url,
      embedUrl: podcast.embed_url
    }));

    console.log(`✅ Podcasts transformed successfully: ${transformedPodcasts.length} items`);

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
