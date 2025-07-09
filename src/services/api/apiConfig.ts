
// Configurações centralizadas para a API
export const API_BASE_URL = 'https://lbs-src1.onrender.com/api/v1';

export type ContentType = 'livro' | 'aula' | 'podcast';

export interface APIResponse {
  tipo: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  conteudo: any[];
}

export interface ContentCounts {
  videos: number;
  books: number;
  podcasts: number;
}

// CONFIGURAÇÃO ESCALÁVEL PARA NÚMEROS EXATOS
export const SCALABLE_CONFIG = {
  podcast: {
    maxItems: 2600, // Preparado para crescimento (atual: 2512)
    percentage: 1.0, // 100% dos itens para números exatos
    chunkSize: 50,
    maxConcurrency: 5
  },
  aula: {
    maxItems: 350, // Preparado para crescimento (atual: 300)
    percentage: 1.0, // 100% dos itens para números exatos
    chunkSize: 50,
    maxConcurrency: 4
  },
  livro: {
    maxItems: 100, // Preparado para crescimento (atual: 30)
    percentage: 1.0, // 100% dos itens para números exatos
    chunkSize: 25,
    maxConcurrency: 2
  }
};

// CONFIGURAÇÃO OTIMIZADA PARA HOMEPAGE (PERFORMANCE)
export const HOMEPAGE_CONFIG = {
  podcast: { limit: 12 },
  aula: { limit: 12 },
  livro: { limit: 12 }
};

// NOVOS ENDPOINTS PARA BUSCA POR ID ÚNICO
export const RESOURCE_BY_ID_ENDPOINTS = {
  video: `${API_BASE_URL}/conteudo-lbs/aula`,
  titulo: `${API_BASE_URL}/conteudo-lbs/livro`, 
  podcast: `${API_BASE_URL}/conteudo-lbs/podcast`
};

// Função utilitária para construir URL por ID
export const getResourceByIdUrl = (type: string, id: string): string => {
  const typeMap: Record<string, string> = {
    'video': 'aula',
    'titulo': 'livro',
    'podcast': 'podcast'
  };
  
  const apiType = typeMap[type] || type;
  return `${API_BASE_URL}/conteudo-lbs/${apiType}/${id}`;
};
