
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookApiResponse {
  tipo: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  conteudo: BookItem[];
}

interface BookItem {
  id: string;
  titulo: string;
  autor: string;
  language: string;
  ano: string;
  categorias: string[];
  descricao: string;
  paginas: number;
  arquivo: string;
  tipo_documento: string;
}

interface TransformedBook {
  id: number;
  title: string;
  type: 'titulo';
  author: string;
  pages?: number;
  thumbnail?: string;
  description: string;
  year: number;
  subject: string;
  documentType?: string;
  pdfUrl?: string;
  language?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📚 Starting optimized books API fetch...');
    
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

    const baseUrl = 'https://link-business-school.onrender.com/api/v1/conteudo-lbs';
    const apiUrl = `${baseUrl}?tipo=livro&page=${page}&limit=${limit}`;
    
    console.log(`📡 Fetching books from: ${apiUrl}`);
    
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

    const data: BookApiResponse = await response.json();
    console.log(`✅ API Response: ${data.conteudo.length} books, page ${data.page}/${data.totalPages}`);

    // Transform books to match SearchResult interface
    const transformedBooks: TransformedBook[] = data.conteudo.map((book, index) => {
      let description = book.descricao;
      if (!description || description.trim() === '') {
        description = `Livro de ${book.autor} sobre ${book.categorias && book.categorias.length > 0 ? book.categorias[0] : 'diversos temas'}, ${book.paginas} páginas.`;
      }

      const pdfUrl = book.arquivo || undefined;
      const defaultThumbnail = '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png';

      return {
        id: (page - 1) * limit + index + 3000, // Generate unique IDs based on page and position
        title: book.titulo || 'Livro sem título',
        type: 'titulo' as const,
        author: book.autor || 'Autor não informado',
        pages: book.paginas || undefined,
        thumbnail: defaultThumbnail,
        description: description,
        year: book.ano ? parseInt(book.ano) : 2024,
        subject: book.categorias && book.categorias.length > 0 ? book.categorias[0] : 'Literatura',
        documentType: book.tipo_documento || 'Livro',
        pdfUrl: pdfUrl,
        language: book.language || undefined
      };
    });

    console.log(`✅ Books transformed: ${transformedBooks.length} items for page ${page}`);

    return new Response(JSON.stringify({
      success: true,
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
      count: transformedBooks.length,
      books: transformedBooks
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('❌ Error in fetch-books function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      books: []
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
