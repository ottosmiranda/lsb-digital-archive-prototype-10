import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchFilters {
  resourceType: string[];
  subject: string[];
  author: string[];
  year: string;
  duration: string;
  language: string[];
  documentType: string[];
  program: string[];
  channel: string[];
}

interface SearchRequest {
  query: string;
  filters: SearchFilters;
  sortBy: string;
  page: number;
  resultsPerPage: number;
}

interface SearchResult {
  id: string;
  originalId?: string;
  title: string;
  type: 'video' | 'titulo' | 'podcast';
  author: string;
  duration?: string;
  pages?: number;
  episodes?: string | number;
  thumbnail?: string;
  description: string;
  year: number | null;
  subject: string;
  embedUrl?: string;
  pdfUrl?: string;
  documentType?: string;
  pais?: string;
  language?: string;
  program?: string;
  channel?: string;
}

// NOVA ARQUITETURA: APIs e Configurações
const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';

// TIMEOUTS OTIMIZADOS PARA PAGINAÇÃO REAL
const TIMEOUTS = {
  singleRequest: 8000,
  paginatedBatch: 12000,
  globalOperation: 25000,
  healthCheck: 3000
};

// ESTRATÉGIAS DE CACHE INTELIGENTE
const CACHE_STRATEGIES = {
  paginated: { ttl: 10 * 60 * 1000, prefix: 'paginated' }, // 10 min para páginas específicas
  global: { ttl: 15 * 60 * 1000, prefix: 'global' },       // 15 min para busca "Todos"
  filtered: { ttl: 2 * 60 * 1000, prefix: 'filtered' }     // 2 min para buscas filtradas
};

type SearchType = 'paginated' | 'global' | 'filtered';

// ✅ LIMPAR CACHE: Cache global reiniciado para forçar dados atualizados
const globalCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// ✅ CORRIGIDO: Mapeamento de códigos de idioma COM DEBUG
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
  'ru-RU': 'Russo',
  'Und': 'Indefinido' // ✅ MAPEAMENTO CORRETO
};

const mapLanguageCode = (idioma: string): string => {
  if (!idioma) return 'Não especificado';
  
  // ✅ DEBUG: Log do mapeamento de idioma
  console.log(`🌐 DEBUG IDIOMA: Input="${idioma}" -> Mapeando...`);
  
  // Tentar mapeamento exato primeiro
  if (languageMapping[idioma]) {
    const mapped = languageMapping[idioma];
    console.log(`✅ DEBUG IDIOMA: "${idioma}" -> "${mapped}" (mapeamento direto)`);
    return mapped;
  }
  
  // Tentar mapeamento por prefixo (ex: 'en-AU' -> 'en')
  const prefix = idioma.split('-')[0];
  if (languageMapping[prefix]) {
    const mapped = languageMapping[prefix];
    console.log(`✅ DEBUG IDIOMA: "${idioma}" -> "${mapped}" (mapeamento por prefixo "${prefix}")`);
    return mapped;
  }
  
  // Fallback: retornar o código original capitalizado
  const fallback = idioma.charAt(0).toUpperCase() + idioma.slice(1);
  console.log(`⚠️ DEBUG IDIOMA: "${idioma}" -> "${fallback}" (fallback - SEM MAPEAMENTO!)`);
  return fallback;
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
    console.log('🎬 ✅ CACHE CLEARED - Starting fresh video API fetch with LANGUAGE debug...');
    
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

    // ✅ DEBUG: Transform videos incluindo language com logs detalhados
    const transformedVideos: TransformedVideo[] = data.conteudo.map((video) => {
      const videoYear = video.ano || new Date().getFullYear();
      
      // ✅ DEBUG: Log detalhado do processo de mapeamento
      console.log(`🎬 VIDEO DEBUG: "${video.titulo.substring(0, 30)}..." - API idioma: "${video.idioma}"`);
      const mappedLanguage = mapLanguageCode(video.idioma);
      console.log(`🎬 VIDEO RESULT: "${video.titulo.substring(0, 30)}..." - Final language: "${mappedLanguage}"`);
      
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
        language: mappedLanguage // ✅ DEBUG: Agora com log detalhado
      };
    });

    console.log(`✅ Videos transformed with LANGUAGE DEBUG: ${transformedVideos.length} items for page ${page}`);

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
