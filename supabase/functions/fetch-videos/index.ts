
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoApiResponse {
  tipo: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  conteudo: VideoItem[];
}

interface VideoItem {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  canal: string;
  imagem_url: string;
  categorias: string[];
  pais: string;
  embed_url: string;
}

interface TransformedVideo {
  id: number;
  title: string;
  type: 'video';
  author: string;
  duration?: string;
  thumbnail?: string;
  description: string;
  year: number;
  subject: string;
  embedUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎬 Starting video API fetch...');
    
    const baseUrl = 'https://link-business-school.onrender.com/api/v1/conteudo-lbs';
    const allVideos: VideoItem[] = [];
    let currentPage = 1;
    let totalPages = 1;

    // Fetch all pages
    do {
      console.log(`📡 Fetching page ${currentPage}/${totalPages}...`);
      
      const apiUrl = `${baseUrl}?tipo=aula&page=${currentPage}`;
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

      const data: VideoApiResponse = await response.json();
      console.log(`✅ Page ${currentPage} fetched: ${data.conteudo.length} videos`);

      allVideos.push(...data.conteudo);
      totalPages = data.totalPages;
      currentPage++;

    } while (currentPage <= totalPages);

    console.log(`🎯 Total videos fetched: ${allVideos.length}`);

    // Transform videos to match SearchResult interface
    const transformedVideos: TransformedVideo[] = allVideos.map((video, index) => ({
      id: index + 1000, // Start from 1000 to avoid conflicts with existing data
      title: video.titulo || 'Vídeo sem título',
      type: 'video' as const,
      author: video.canal || 'Canal não informado',
      duration: 'N/A', // API doesn't provide duration
      thumbnail: video.imagem_url,
      description: video.descricao || 'Descrição não disponível',
      year: 2024, // Default year since API doesn't provide it
      subject: video.categorias && video.categorias.length > 0 ? video.categorias[0] : 'Educação',
      embedUrl: video.embed_url
    }));

    console.log(`✅ Videos transformed successfully: ${transformedVideos.length} items`);

    return new Response(JSON.stringify({
      success: true,
      count: transformedVideos.length,
      videos: transformedVideos
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('❌ Error in fetch-videos function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      videos: []
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
