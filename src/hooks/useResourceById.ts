
import { useState, useEffect } from 'react';
import { Resource } from '@/types/resourceTypes';
import { useDataLoader } from '@/hooks/useDataLoader';
import { fetchResourceById } from '@/services/resourceByIdService';

interface UseResourceByIdResult {
  resource: Resource | null;
  loading: boolean;
  error: string | null;
  foundVia: 'cache' | 'api' | null;
}

export const useResourceById = (id: string | undefined): UseResourceByIdResult => {
  const { allData, loading: dataLoading } = useDataLoader();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [foundVia, setFoundVia] = useState<'cache' | 'api' | null>(null);

  useEffect(() => {
    const findResource = async () => {
      if (!id) {
        setLoading(false);
        setError('ID não fornecido');
        return;
      }

      console.group(`🔍 BUSCA HÍBRIDA - ID: ${id}`);
      
      // ETAPA 1: Buscar no cache local primeiro
      if (!dataLoading && allData && allData.length > 0) {
        console.log('📦 Buscando no cache local...');
        
        // Busca direta por ID
        let foundResource = allData.find(item => String(item.id) === id);
        
        // Busca por originalId (para vídeos com UUID)
        if (!foundResource) {
          foundResource = allData.find(item => 
            item.type === 'video' && (item as any).originalId === id
          );
        }
        
        // Busca por similaridade numérica
        if (!foundResource) {
          const numericId = parseInt(id);
          if (!isNaN(numericId) && numericId >= 1000) {
            const videos = allData.filter(item => item.type === 'video');
            const closest = videos
              .map(v => ({ video: v, distance: Math.abs(v.id - numericId) }))
              .sort((a, b) => a.distance - b.distance)[0];
            
            if (closest && closest.distance < 1000) {
              foundResource = closest.video;
            }
          }
        }
        
        if (foundResource) {
          console.log('✅ Encontrado no cache local!');
          
          // Converter para formato Resource
          const convertedResource: Resource = {
            id: typeof foundResource.id === 'string' ? parseInt(id) : foundResource.id,
            title: foundResource.title,
            type: foundResource.type,
            author: foundResource.author,
            duration: foundResource.duration,
            pages: foundResource.pages,
            episodes: foundResource.episodes ? 
              (typeof foundResource.episodes === 'string' ? 
                parseInt(foundResource.episodes.replace(/\D/g, '')) : foundResource.episodes) : undefined,
            thumbnail: foundResource.thumbnail,
            description: foundResource.description,
            year: foundResource.year,
            subject: foundResource.subject,
            embedUrl: (foundResource as any).embedUrl,
            pdfUrl: (foundResource as any).pdfUrl,
            fullDescription: foundResource.description,
            tags: foundResource.subject ? [foundResource.subject] : undefined,
            language: (foundResource as any).language,
            documentType: (foundResource as any).documentType,
            categories: (foundResource as any).categories
          };
          
          setResource(convertedResource);
          setFoundVia('cache');
          setLoading(false);
          setError(null);
          console.groupEnd();
          return;
        }
      }
      
      // ETAPA 2: Fallback para API se não encontrou no cache
      if (!dataLoading) {
        console.log('🌐 Não encontrado no cache, buscando via API...');
        
        const apiResult = await fetchResourceById(id);
        
        if (apiResult.success && apiResult.resource) {
          console.log('✅ Encontrado via API!');
          setResource(apiResult.resource);
          setFoundVia('api');
          setError(null);
        } else {
          console.log('❌ Não encontrado nem no cache nem na API');
          setResource(null);
          setFoundVia(null);
          setError(apiResult.error || 'Recurso não encontrado');
        }
        
        setLoading(false);
        console.groupEnd();
      }
    };

    if (!dataLoading || allData) {
      findResource();
    }
  }, [id, allData, dataLoading]);

  return { resource, loading: dataLoading || loading, error, foundVia };
};
