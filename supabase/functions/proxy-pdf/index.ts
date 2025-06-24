
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pdfUrl = url.searchParams.get('url');

    if (!pdfUrl) {
      return new Response(JSON.stringify({ error: 'URL parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log('📄 Proxying PDF from:', pdfUrl);

    // Fetch the PDF from the external API
    const pdfResponse = await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'LSB-Digital-Library/1.0'
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!pdfResponse.ok) {
      console.error(`❌ Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
      return new Response(JSON.stringify({ 
        error: `Failed to fetch PDF: ${pdfResponse.status}` 
      }), {
        status: pdfResponse.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const contentType = pdfResponse.headers.get('content-type') || 'application/pdf';
    const contentLength = pdfResponse.headers.get('content-length');

    console.log(`✅ PDF fetched successfully, Content-Type: ${contentType}, Size: ${contentLength} bytes`);

    // Stream the PDF content with proper headers
    return new Response(pdfResponse.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': contentLength || '',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        ...corsHeaders
      }
    });

  } catch (error: any) {
    console.error('❌ Error in proxy-pdf function:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
};

serve(handler);
