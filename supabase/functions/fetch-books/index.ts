
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
  id: string;
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
  categories?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const bookId = url.searchParams.get('id');
    
    // ✅ NOVA LÓGICA: Se ID fornecido, buscar livro específico
    if (bookId && bookId.trim() !== '') {
      console.log(`📖 BUSCA LIVRO POR ID: ${bookId}`);
      return await fetchBookById(bookId);
    }

    // ✅ MANTER: Lógica original de paginação para listagem
    console.log('📚 Starting optimized books API fetch...');
    
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

    const transformedBooks: TransformedBook[] = data.conteudo.map((book) => {
      let description = book.descricao;
      if (!description || description.trim() === '') {
        description = `Livro de ${book.autor} sobre ${book.categorias && book.categorias.length > 0 ? book.categorias[0] : 'diversos temas'}, ${book.paginas} páginas.`;
      }

      const pdfUrl = book.arquivo || undefined;
      const defaultThumbnail = '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png';

      return {
        id: book.id,
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
        language: book.language || undefined,
        categories: book.categorias || []
      };
    });

    console.log(`✅ Books transformed: ${transformedBooks.length} items using REAL IDs for page ${page}`);

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

// ✅ NOVA FUNÇÃO: Buscar livro específico por ID
async function fetchBookById(bookId: string): Promise<Response> {
  try {
    console.log(`🎯 BUSCANDO LIVRO ESPECÍFICO: ID ${bookId}`);
    
    const apiUrl = `https://lbs-src1.onrender.com/api/v1/conteudo-lbs/livro/${bookId}`;
    console.log(`📡 Calling API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LSB-Digital-Library/1.0'
      },
      signal: AbortSignal.timeout(8000)
    });

    console.log(`📊 API Response Status: ${response.status}`);

    if (response.status === 404) {
      console.log(`📚 LIVRO NÃO ENCONTRADO: ID ${bookId}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Book not found',
        message: `Livro com ID ${bookId} não foi encontrado`,
        book: null
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const bookData = await response.json();
    console.log(`✅ LIVRO ENCONTRADO:`, {
      id: bookData.id,
      titulo: bookData.titulo,
      autor: bookData.autor
    });

    // ✅ TRANSFORMAR DADOS DO LIVRO
    const transformedBook: TransformedBook = {
      id: bookData.id,
      title: bookData.titulo || 'Livro sem título',
      type: 'titulo' as const,
      author: bookData.autor || 'Autor não informado',
      pages: bookData.paginas || undefined,
      thumbnail: '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
      description: bookData.descricao || `Livro de ${bookData.autor || 'autor desconhecido'}`,
      year: bookData.ano ? parseInt(bookData.ano) : 2024,
      subject: bookData.categorias && bookData.categorias.length > 0 ? bookData.categorias[0] : 'Literatura',
      documentType: bookData.tipo_documento || 'Livro',
      pdfUrl: bookData.arquivo || undefined,
      language: bookData.language || undefined,
      categories: bookData.categorias || []
    };

    console.log(`✅ LIVRO TRANSFORMADO COM SUCESSO: ${transformedBook.title}`);

    return new Response(JSON.stringify({
      success: true,
      book: transformedBook,
      message: `Livro ${transformedBook.title} carregado com sucesso`
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error(`❌ ERRO AO BUSCAR LIVRO ${bookId}:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: `Erro ao carregar livro com ID ${bookId}`,
      book: null
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

serve(handler);
