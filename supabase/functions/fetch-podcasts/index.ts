
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
  categorias: string[];
}

interface TransformedPodcast {
  id: string;
  title: string;
  type: 'podcast';
  author: string;
  description: string;
  year: number;
  subject: string;
  duration?: string;
  thumbnail?: string;
  embedUrl?: string;
  podcast_titulo?: string;
  episodio_id?: string;
  categories?: string[];
}

// ✅ CORRIGIDO: Usar primeira categoria para subject (badge) e capitalizar
const getSubjectFromCategories = (categorias: string[]): string => {
  if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
    return 'Podcast';
  }
  // Capitalizar primeira letra da primeira categoria para uso em badges
  const firstCategory = categorias[0];
  return firstCategory.charAt(0).toUpperCase() + firstCategory.slice(1);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎧 Starting podcast API fetch...');
    
    // Parse request body for pagination parameters and filters
    let page = 1;
    let limit = 10;
    let podcastTitulo = null;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        page = body.page || 1;
        limit = body.limit || 10;
        podcastTitulo = body.podcast_titulo || null;
        console.log(`📄 Request params: page=${page}, limit=${limit}, podcast_titulo=${podcastTitulo}`);
      } catch (e) {
        console.log('📄 No body params, using defaults');
      }
    }

    const baseUrl = 'https://lbs-src1.onrender.com/api/v1/conteudo-lbs';
    let apiUrl = `${baseUrl}?tipo=podcast&page=${page}&limit=${limit}`;
    
    // Add podcast title filter if provided
    if (podcastTitulo) {
      apiUrl += `&podcast_titulo=${encodeURIComponent(podcastTitulo)}`;
      console.log(`🎯 Filtering by podcast title: ${podcastTitulo}`);
    }
    
    console.log(`📡 Fetching podcasts from: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        // ✅ REMOVIDO: 'Content-Type': 'application/json' que causava preflight OPTIONS
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

    // ✅ CORRIGIDO: subject agora usa categorias (para badges), podcast_titulo é preservado separadamente
    const transformedPodcasts: TransformedPodcast[] = data.conteudo.map((episode) => {
      // CORREÇÃO: Usar categorias para subject (badges), preservar podcast_titulo
      const subject = getSubjectFromCategories(episode.categorias);
      
      console.log(`🏷️ Podcast "${episode.episodio_titulo}": subject="${subject}" (from categorias), podcast_titulo="${episode.podcast_titulo}"`);
      
      return {
        id: episode.episodio_id,
        title: episode.episodio_titulo || 'Episódio sem título',
        type: 'podcast' as const,
        author: episode.publicador || 'Autor não informado',
        description: episode.descricao || 'Descrição não disponível',
        year: episode.data_lancamento ? new Date(episode.data_lancamento).getFullYear() : 2024,
        subject: subject, // ✅ CORRIGIDO: Usar categorias para badges
        duration: episode.duracao_ms ? formatDuration(episode.duracao_ms) : undefined,
        thumbnail: episode.imagem_url,
        embedUrl: episode.embed_url,
        podcast_titulo: episode.podcast_titulo, // ✅ Preservar título do programa separadamente
        episodio_id: episode.episodio_id,
        categories: episode.categorias || [] // ✅ Categorias completas
      };
    });

    console.log(`✅ Podcasts transformed: ${transformedPodcasts.length} items with subject from categories for page ${page}`);

    // Extract program info from first episode if filtering by podcast title
    let programInfo = null;
    if (podcastTitulo && transformedPodcasts.length > 0) {
      const firstEpisode = data.conteudo[0];
      programInfo = {
        title: firstEpisode.podcast_titulo,
        publisher: firstEpisode.publicador,
        thumbnail: firstEpisode.imagem_url,
        description: `Programa de podcast com ${data.total} episódios disponíveis.`,
        categories: firstEpisode.categorias || []
      };
    }

    return new Response(JSON.stringify({
      success: true,
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
      count: transformedPodcasts.length,
      podcasts: transformedPodcasts,
      programInfo
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
      podcasts: [],
      programInfo: null
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
