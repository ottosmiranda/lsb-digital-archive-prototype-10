
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BibliotecaApiResponse {
  tipo: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  conteudo: ExternalResource[];
}

interface ExternalResource {
  Nome: string;
  Descricao: string;
  Link: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📚 Starting biblioteca API fetch...');
    
    const baseUrl = 'https://link-business-school.onrender.com/api/v1/conteudo-lbs';
    const allResources: ExternalResource[] = [];
    let currentPage = 1;
    let totalPages = 1;

    // Fetch all pages
    do {
      console.log(`📡 Fetching biblioteca page ${currentPage}/${totalPages}...`);
      
      const apiUrl = `${baseUrl}?tipo=biblioteca&page=${currentPage}&limit=10`;
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

      const data: BibliotecaApiResponse = await response.json();
      console.log(`✅ Page ${currentPage} fetched: ${data.conteudo.length} resources`);

      allResources.push(...data.conteudo);
      totalPages = data.totalPages;
      currentPage++;

    } while (currentPage <= totalPages);

    console.log(`🎯 Total biblioteca resources fetched: ${allResources.length}`);

    return new Response(JSON.stringify({
      success: true,
      count: allResources.length,
      resources: allResources
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('❌ Error in fetch-biblioteca function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      resources: []
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
