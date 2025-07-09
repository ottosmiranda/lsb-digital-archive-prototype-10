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

      console.group('🔍 BUSCA HÍBRIDA DE RECURSO (IDs REAIS)');
      console.log('🎯 Target Real ID:', id);

      // FASE 1: Busca no cache local usando ID real
      if (allData && allData.length > 0) {
        console.log('📊 Fase 1: Buscando no cache local com ID real...');
        
        // Direct match with real ID
        const foundResource = allData.find(item => String(item.id) === id);

        if (foundResource) {
          console.log('✅ Fase 1 SUCCESS: Encontrado no cache local com ID real');
          
          const convertedResource: Resource = {
            id: String(foundResource.id),
            originalId: (foundResource as any).originalId || String(foundResource.id),
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

      // FASE 2: Busca na API usando ID real
      if (!dataLoading && !apiAttempted) {
        console.log('📡 Fase 2: Buscando na API com ID real...');
        setApiAttempted(true);
        
        // Try different resource types with the REAL ID
        const resourceTypes = ['video', 'titulo', 'podcast'];
        
        for (const resourceType of resourceTypes) {
          try {
            console.log(`🔍 Tentando buscar ${resourceType} com ID real: ${id}`);
            const apiResource = await ResourceByIdService.fetchResourceById(id, resourceType);
            
            if (apiResource) {
              console.log(`✅ Fase 2 SUCCESS: Encontrado na API como ${resourceType} com ID real`);
              setResource(apiResource);
              setLoading(false);
              setError(null);
              console.groupEnd();
              return;
            }
          } catch (apiError) {
            console.log(`❌ Falha ao buscar ${resourceType} com ID ${id}:`, apiError);
          }
        }
        
        // If we get here, resource not found anywhere
        console.log('💀 FALHA TOTAL: Recurso não encontrado com ID real');
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
