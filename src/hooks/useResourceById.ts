import { useState, useEffect, useRef } from 'react';
import { Resource } from '@/types/resourceTypes';
import { useDataLoader } from './useDataLoader';
import { ResourceByIdService } from '@/services/resourceByIdService';
import { resourceLookupService } from '@/services/resourceLookupService';

interface UseResourceByIdResult {
  resource: Resource | null;
  loading: boolean;
  error: string | null;
  retrying: boolean;
}

export const useResourceById = (id: string | undefined): UseResourceByIdResult => {
  const { allData, loading: dataLoading, dataLoaded } = useDataLoader();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [apiAttempted, setApiAttempted] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const findResource = async () => {
      if (!id) {
        setResource(null);
        setLoading(false);
        setError('ID não fornecido');
        return;
      }

      console.group('🔍 BUSCA OTIMIZADA DE RECURSO');
      console.log('🎯 Target ID:', id);

      // FASE 1: Busca no cache de lookup primeiro (muito rápida)
      const resourceInfo = resourceLookupService.getResourceInfo(id);
      if (resourceInfo) {
        console.log('⚡ FASE 1: Info encontrada no cache lookup:', resourceInfo);
        
        // Busca direta no allData usando o tipo conhecido
        const foundResource = allData.find(item => 
          String(item.id) === id && item.type === resourceInfo.type
        );

        if (foundResource) {
          console.log('✅ FASE 1 SUCCESS: Encontrado no cache local');
          setResource(transformToResource(foundResource));
          setLoading(false);
          setError(null);
          console.groupEnd();
          return;
        }
      }

      // FASE 2: Se não encontrou no cache, mas dados ainda estão carregando, aguarda
      if (dataLoading && !dataLoaded) {
        console.log('⏳ AGUARDANDO: Dados ainda carregando, tentando novamente...');
        setRetrying(true);
        
        // Retry após um delay
        retryTimeoutRef.current = setTimeout(() => {
          console.log('🔄 RETRY: Tentando buscar novamente após dados carregarem');
          findResource();
        }, 1000);
        
        console.groupEnd();
        return;
      }

      // FASE 3: Busca geral no allData (fallback)
      if (allData && allData.length > 0) {
        console.log('📊 FASE 3: Busca geral no cache local...');
        
        const foundResource = allData.find(item => String(item.id) === id);
        if (foundResource) {
          console.log('✅ FASE 3 SUCCESS: Encontrado no cache geral');
          setResource(transformToResource(foundResource));
          setLoading(false);
          setError(null);
          setRetrying(false);
          console.groupEnd();
          return;
        }
      }

      // FASE 4: Busca na API usando tipo específico se conhecido
      if (!apiAttempted && resourceInfo?.type) {
        console.log('📡 FASE 4: Busca tipo-específica na API:', resourceInfo.type);
        setApiAttempted(true);
        
        try {
          const apiResource = await ResourceByIdService.fetchResourceById(id, resourceInfo.type);
          if (apiResource) {
            console.log('✅ FASE 4 SUCCESS: Encontrado na API tipo-específica');
            setResource(apiResource);
            setLoading(false);
            setError(null);
            setRetrying(false);
            console.groupEnd();
            return;
          }
        } catch (apiError) {
          console.log('❌ FASE 4 FALHOU:', apiError);
        }
      }

      // FASE 5: Busca na API tentando todos os tipos (último recurso)
      if (!apiAttempted) {
        console.log('📡 FASE 5: Busca na API - todos os tipos');
        setApiAttempted(true);
        
        const resourceTypes = ['video', 'titulo', 'podcast'];
        
        for (const resourceType of resourceTypes) {
          try {
            console.log(`🔍 Tentando buscar ${resourceType} com ID: ${id}`);
            const apiResource = await ResourceByIdService.fetchResourceById(id, resourceType);
            
            if (apiResource) {
              console.log(`✅ FASE 5 SUCCESS: Encontrado na API como ${resourceType}`);
              setResource(apiResource);
              setLoading(false);
              setError(null);
              setRetrying(false);
              console.groupEnd();
              return;
            }
          } catch (apiError) {
            console.log(`❌ Falha ao buscar ${resourceType} com ID ${id}:`, apiError);
          }
        }
      }
        
      // Se chegou aqui, recurso não foi encontrado
      console.log('💀 FALHA TOTAL: Recurso não encontrado');
      setResource(null);
      setLoading(false);
      setError('Recurso não encontrado');
      setRetrying(false);
      
      console.groupEnd();
    };

    // Limpa timeout anterior se existir
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    findResource();

    // Cleanup
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [id, allData, dataLoading, dataLoaded, apiAttempted]);

  // Reset states when ID changes
  useEffect(() => {
    setApiAttempted(false);
    setRetrying(false);
    setError(null);
    setLoading(true);
  }, [id]);

  return { resource, loading: dataLoading || loading, error, retrying };
};

// Helper function to transform SearchResult to Resource
function transformToResource(item: any): Resource {
  return {
    id: String(item.id),
    originalId: String(item.id),
    title: item.title,
    type: item.type,
    author: item.author,
    duration: item.duration,
    pages: item.pages,
    episodes: item.episodes,
    thumbnail: item.thumbnail,
    description: item.description,
    year: item.year,
    subject: item.subject,
    embedUrl: item.embedUrl,
    pdfUrl: item.pdfUrl,
    fullDescription: item.description,
    tags: item.subject ? [item.subject] : undefined,
    language: item.language,
    documentType: item.documentType,
    categories: item.categories || []
  };
}
