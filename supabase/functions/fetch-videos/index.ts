
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
  duracao: number;
}

interface TransformedVideo {
  id: number;
  originalId: string;
  title: string;
  type: 'video';
  author: string;
  duration?: string;
  thumbnail?: string;
  description: string;
  year: number;
  subject: string;
  embedUrl?: string;
  pais?: string;
}

// Create a simple hash function to convert string IDs to unique numbers
function stringToHash(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) + 1000;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎬 Starting optimized video API fetch...');
    
    // Parse request body for pagination parameters
    let page = 1;
    let limit = 10; // Default limit for optimization
    
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

    const baseUrl = 'https://lbs-src1.onrender.com/api/v1/conteudo-lbs';
    const apiUrl = `${baseUrl}?tipo=aula&page=${page}&limit=${limit}`;
    
    console.log(`📡 Fetching videos from: ${apiUrl}`);
    
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

    const data: VideoApiResponse = await response.json();
    console.log(`✅ API Response: ${data.conteudo.length} videos, page ${data.page}/${data.totalPages}`);

    // Transform videos to match SearchResult interface
    const transformedVideos: TransformedVideo[] = data.conteudo.map((video) => {
      const hashedId = stringToHash(video.id);
      
      return {
        id: hashedId,
        originalId: video.id,
        title: video.titulo || 'Vídeo sem título',
        type: 'video' as const,
        author: video.canal || 'Canal não informado',
        duration: video.duracao ? formatDuration(video.duracao) : undefined,
        thumbnail: video.imagem_url,
        description: video.descricao || 'Descrição não disponível',
        year: 2024,
        subject: video.categorias && video.categorias.length > 0 ? video.categorias[0] : 'Educação',
        embedUrl: video.embed_url,
        pais: video.pais
      };
    });

    console.log(`✅ Videos transformed: ${transformedVideos.length} items for page ${page}`);

    return new Response(JSON.stringify({
      success: true,
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
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
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
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
