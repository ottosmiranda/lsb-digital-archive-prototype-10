
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Iniciando busca de artigos...');
    
    const timeoutMs = 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        'https://lbs-src1.onrender.com/api/v1/conteudo-lbs?tipo=artigos&page=1&limit=12',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API retornou status ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Artigos encontrados: ${data.total || data.conteudo?.length || 0}`);

      return new Response(
        JSON.stringify({
          success: true,
          articles: data.conteudo || [],
          total: data.total || data.conteudo?.length || 0,
          totalPages: data.totalPages || 1
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('❌ Timeout na busca de artigos');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Timeout na busca de artigos',
            articles: []
          }),
          { 
            status: 408,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      throw error;
    }

  } catch (error) {
    console.error('❌ Erro na busca de artigos:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        articles: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
