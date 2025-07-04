
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📚 Starting books API fetch...');
    
    const baseUrl = 'https://link-business-school.onrender.com/api/v1/conteudo-lbs';
    const baseFileUrl = 'https://link-business-school.onrender.com';
    const allBooks: BookItem[] = [];
    let currentPage = 1;
    let totalPages = 1;

    // Fetch all pages
    do {
      console.log(`📡 Fetching books page ${currentPage}/${totalPages}...`);
      
      const apiUrl = `${baseUrl}?tipo=livro&page=${currentPage}`;
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

      const data: BookApiResponse = await response.json();
      console.log(`✅ Page ${currentPage} fetched: ${data.conteudo.length} books`);

      allBooks.push(...data.conteudo);
      totalPages = data.totalPages;
      currentPage++;

    } while (currentPage <= totalPages);

    console.log(`🎯 Total books fetched: ${allBooks.length}`);

    // Transform books to match SearchResult interface
    const transformedBooks: TransformedBook[] = allBooks.map((book, index) => {
      // Generate description if empty
      let description = book.descricao;
      if (!description || description.trim() === '') {
        description = `Livro de ${book.autor} sobre ${book.categorias && book.categorias.length > 0 ? book.categorias[0] : 'diversos temas'}, ${book.paginas} páginas.`;
      }

      // Use direct PDF URL from API
      const pdfUrl = book.arquivo || undefined;

      // Use default thumbnail for books
      const defaultThumbnail = '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png';

      return {
        id: index + 3000, // Start from 3000 to avoid conflicts with videos (1000+) and podcasts (2000+)
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

    console.log(`✅ Books transformed successfully: ${transformedBooks.length} items`);

    return new Response(JSON.stringify({
      success: true,
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
