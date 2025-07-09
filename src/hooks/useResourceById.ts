
import { useState, useEffect } from 'react';
import { Resource } from '@/types/resourceTypes';
import { useDataLoader } from './useDataLoader';
import { ResourceByIdService } from '@/services/resourceByIdService';

interface UseResourceByIdResult {
  resource: Resource | null;
  loading: boolean;
  error: string | null;
}

export const useResourceById = (id: string | undefined): UseResourceByIdResult => {
  const { allData, loading: dataLoading } = useDataLoader();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAttempted, setApiAttempted] = useState(false);

  useEffect(() => {
    const findResource = async () => {
      if (!id) {
        setResource(null);
        setLoading(false);
        setError('ID não fornecido');
        return;
      }

      console.group('🔍 BUSCA HÍBRIDA DE RECURSO');
      console.log('🎯 Target ID:', id);

      // FASE 1: Busca no cache local
      if (allData && allData.length > 0) {
        console.log('📊 Fase 1: Buscando no cache local...');
        
        // Direct ID match
        let foundResource = allData.find(item => String(item.id) === id);
        
        // originalId match for videos
        if (!foundResource) {
          foundResource = allData.find(item => 
            item.type === 'video' && (item as any).originalId === id
          );
        }

        // Smart numerical matching
        if (!foundResource) {
          const numericId = parseInt(id);
          if (numericId >= 1000) {
            const videos = allData.filter(item => item.type === 'video');
            const videoMatches = videos
              .map(v => ({ video: v, distance: Math.abs(v.id - numericId) }))
              .sort((a, b) => a.distance - b.distance);
            
            if (videoMatches.length > 0 && videoMatches[0].distance < 1000) {
              foundResource = videoMatches[0].video;
            }
          }
        }

        if (foundResource) {
          console.log('✅ Fase 1 SUCCESS: Encontrado no cache local');
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
          setLoading(false);
          setError(null);
          console.groupEnd();
          return;
        }
      }

      // FASE 2: Busca na API por ID único (fallback)
      if (!dataLoading && !apiAttempted) {
        console.log('📡 Fase 2: Buscando na API por ID único...');
        setApiAttempted(true);
        
        // Tentar diferentes tipos de recursos
        const resourceTypes = ['video', 'titulo', 'podcast'];
        
        for (const resourceType of resourceTypes) {
          try {
            console.log(`🔍 Tentando buscar como ${resourceType}...`);
            const apiResource = await ResourceByIdService.fetchResourceById(id, resourceType);
            
            if (apiResource) {
              console.log(`✅ Fase 2 SUCCESS: Encontrado na API como ${resourceType}`);
              setResource(apiResource);
              setLoading(false);
              setError(null);
              console.groupEnd();
              return;
            }
          } catch (apiError) {
            console.log(`❌ Falha ao buscar como ${resourceType}:`, apiError);
          }
        }
        
        // Se chegou até aqui, não encontrou em lugar nenhum
        console.log('💀 FALHA TOTAL: Recurso não encontrado em cache local nem na API');
        setResource(null);
        setLoading(false);
        setError('Recurso não encontrado');
      }
      
      console.groupEnd();
    };

    if (!dataLoading) {
      findResource();
    }
  }, [id, allData, dataLoading, apiAttempted]);

  return { resource, loading: dataLoading || loading, error };
};
