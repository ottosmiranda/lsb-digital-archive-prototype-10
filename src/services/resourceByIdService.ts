
import { Resource } from '@/types/resourceTypes';

export interface ResourceByIdResponse {
  success: boolean;
  resource: Resource | null;
  error?: string;
}

// Mapeamento de tipos para endpoints
const getEndpointByType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'video': 'aula',
    'titulo': 'livro', 
    'podcast': 'podcast'
  };
  
  return typeMap[type] || type;
};

// Transformar resposta da API para formato Resource
const transformApiResponseToResource = (data: any, type: string, id: string): Resource => {
  const baseResource: Resource = {
    id: parseInt(id),
    originalId: data.id,
    title: data.titulo || data.podcast_titulo || data.title || 'Título não disponível',
    type: type as 'video' | 'titulo' | 'podcast',
    author: data.autor || data.canal || 'Link Business School',
    duration: data.duracao_ms ? formatDuration(data.duracao_ms) : data.duracao,
    pages: data.paginas,
    episodes: data.episodios || (typeof data.episodes === 'string' ? 
      parseInt(data.episodes.replace(/\D/g, '')) : data.episodes),
    thumbnail: data.imagem_url || '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
    description: data.descricao || 'Descrição não disponível',
    year: data.ano || new Date().getFullYear(),
    subject: data.categorias?.[0] || getDefaultSubject(type),
    embedUrl: data.embed_url,
    pdfUrl: data.arquivo,
    documentType: data.tipo_documento || 'Livro',
    language: data.language,
    categories: data.categorias
  };

  return baseResource;
};

const formatDuration = (durationMs: number): string => {
  const minutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
};

const getDefaultSubject = (type: string): string => {
  switch (type) {
    case 'titulo': return 'Administração';
    case 'video': return 'Empreendedorismo';
    case 'podcast': return 'Negócios';
    default: return 'Geral';
  }
};

// Detectar tipo baseado no ID ou contexto
const detectResourceType = (id: string): string => {
  // Para IDs numéricos grandes (>1000), assumir video
  const numericId = parseInt(id);
  if (!isNaN(numericId) && numericId >= 1000) {
    return 'video';
  }
  
  // Para UUIDs, assumir podcast
  if (id.includes('-') && id.length > 10) {
    return 'podcast';
  }
  
  // Para IDs pequenos, assumir livro
  if (!isNaN(numericId) && numericId < 100) {
    return 'titulo';
  }
  
  // Fallback para video
  return 'video';
};

export const fetchResourceById = async (
  id: string, 
  resourceType?: string
): Promise<ResourceByIdResponse> => {
  console.log(`🔍 Buscando recurso por ID: ${id}, tipo: ${resourceType || 'auto-detectado'}`);
  
  // Detectar tipo se não fornecido
  const detectedType = resourceType || detectResourceType(id);
  const apiType = getEndpointByType(detectedType);
  
  const apiUrl = `https://lbs-src1.onrender.com/api/v1/conteudo-lbs/${apiType}/${id}`;
  
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout buscando ${apiType} ID ${id}`)), 8000);
    });
    
    const fetchPromise = fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'LSB-Resource-By-Id/1.0'
      }
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`❌ Recurso ${id} não encontrado na API`);
        return { success: false, resource: null, error: 'Recurso não encontrado' };
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const transformedResource = transformApiResponseToResource(data, detectedType, id);
    
    console.log(`✅ Recurso encontrado via API:`, {
      id: transformedResource.id,
      title: transformedResource.title.substring(0, 50) + '...',
      type: transformedResource.type
    });
    
    return { success: true, resource: transformedResource };
    
  } catch (error) {
    console.error(`❌ Erro buscando recurso ${id} via API:`, error);
    return { 
      success: false, 
      resource: null, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
};
