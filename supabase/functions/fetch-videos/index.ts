
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
  idioma: string; // Added idioma field
  ano?: number;
  pais?: string;
  embed_url: string;
  duracao: number;
}

interface TransformedVideo {
  id: string;
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
  language?: string; // ✅ ADICIONADO: Campo language para vídeos
}

// ✅ NOVO: Mapeamento de códigos de idioma ISO para nomes legíveis
const languageMapping: Record<string, string> = {
  'en': 'Inglês',
  'en-US': 'Inglês',
  'en-GB': 'Inglês',
  'pt': 'Português',
  'pt-BR': 'Português',
  'pt-PT': 'Português',
  'es': 'Espanhol',
  'es-ES': 'Espanhol',
  'es-MX': 'Espanhol',
  'fr': 'Francês',
  'fr-FR': 'Francês',
  'de': 'Alemão',
  'de-DE': 'Alemão',
  'it': 'Italiano',
  'it-IT': 'Italiano',
  'ja': 'Japonês',
  'ja-JP': 'Japonês',
  'ko': 'Coreano',
  'ko-KR': 'Coreano',
  'zh': 'Chinês',
  'zh-CN': 'Chinês',
  'ru': 'Russo',
  'ru-RU': 'Russo'
};

const mapLanguageCode = (idioma: string): string => {
  if (!idioma) return 'Não especificado';
  
  // Tentar mapeamento exato primeiro
  if (languageMapping[idioma]) {
    return languageMapping[idioma];
  }
  
  // Tentar mapeamento por prefixo (ex: 'en-AU' -> 'en')
  const prefix = idioma.split('-')[0];
  if (languageMapping[prefix]) {
    return languageMapping[prefix];
  }
  
  // Fallback: retornar o código original capitalizado
  return idioma.charAt(0).toUpperCase() + idioma.slice(1);
};

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
    console.log('🎬 Starting optimized video API fetch with LANGUAGE support...');
    
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

    // ✅ CORRIGIDO: Transform videos incluindo language
    const transformedVideos: TransformedVideo[] = data.conteudo.map((video) => {
      const videoYear = video.ano || new Date().getFullYear();
      const mappedLanguage = mapLanguageCode(video.idioma);
      
      console.log(`🌐 Video language transformation: ${video.titulo.substring(0, 30)}... - Idioma: ${video.idioma} -> Language: ${mappedLanguage}`);
      
      return {
        id: video.id,
        originalId: video.id,
        title: video.titulo || 'Vídeo sem título',
        type: 'video' as const,
        author: video.canal || 'Canal não informado',
        duration: video.duracao ? formatDuration(video.duracao) : undefined,
        thumbnail: video.imagem_url,
        description: video.descricao || 'Descrição não disponível',
        year: videoYear,
        subject: video.categorias && video.categorias.length > 0 ? video.categorias[0] : 'Educação',
        embedUrl: video.embed_url,
        pais: video.pais,
        language: mappedLanguage // ✅ ADICIONADO: Idioma mapeado para nome legível
      };
    });

    console.log(`✅ Videos transformed with LANGUAGE: ${transformedVideos.length} items for page ${page}`);

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
