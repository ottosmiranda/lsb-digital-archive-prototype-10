
import { useState, useEffect, useRef } from 'react';
import { Resource } from '@/types/resourceTypes';
import { useDataLoader } from './useDataLoader';
import { ResourceByIdService } from '@/services/resourceByIdService';
import { resourceLookupService } from '@/services/resourceLookupService';
import { idValidationService } from '@/services/idValidationService';

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

      console.group('🔍 BUSCA OTIMIZADA DE RECURSO (COM VALIDAÇÃO DE ID)');
      console.log('🎯 Target ID:', id);

      // ✅ NOVA VALIDAÇÃO: Verificar formato do ID primeiro
      const validation = idValidationService.validateId(id);
      console.log('📋 ID Validation:', validation);

      if (!validation.isValid) {
        console.log('❌ ID INVÁLIDO DETECTADO - Abortando busca');
        
        // ✅ Rastrear ID inválido
        idValidationService.trackInvalidIdOrigin(id, 'useResourceById', {
          validationResult: validation,
          dataLoaded,
          allDataCount: allData?.length || 0
        });

        setResource(null);
        setLoading(false);
        setError(`ID inválido: ${validation.errorReason}`);
        setRetrying(false);
        console.groupEnd();
        return;
      }

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
          const transformedResource = transformToResource(foundResource);
          
          // ✅ Validação do recurso transformado
          if (validateTransformedResource(transformedResource)) {
            setResource(transformedResource);
            setLoading(false);
            setError(null);
            console.groupEnd();
            return;
          } else {
            console.log('❌ FASE 1: Recurso inválido após transformação');
          }
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
          const transformedResource = transformToResource(foundResource);
          
          // ✅ Validação do recurso transformado
          if (validateTransformedResource(transformedResource)) {
            setResource(transformedResource);
            setLoading(false);
            setError(null);
            setRetrying(false);
            console.groupEnd();
            return;
          } else {
            console.log('❌ FASE 3: Recurso inválido após transformação');
          }
        }
      }

      // ✅ FASE 4: Só tentar API se ID passou na validação e tem tipo específico
      if (!apiAttempted && validation.type) {
        console.log('📡 FASE 4: Busca tipo-específica na API:', validation.type);
        setApiAttempted(true);
        
        try {
          const apiResource = await ResourceByIdService.fetchResourceById(id, validation.type);
          if (apiResource && validateTransformedResource(apiResource)) {
            console.log('✅ FASE 4 SUCCESS: Encontrado na API tipo-específica');
            setResource(apiResource);
            setLoading(false);
            setError(null);
            setRetrying(false);
            console.groupEnd();
            return;
          } else if (apiResource) {
            console.log('❌ FASE 4: Recurso da API inválido após validação');
          }
        } catch (apiError) {
          console.log('❌ FASE 4 FALHOU:', apiError);
        }
      }
        
      // Se chegou aqui, recurso não foi encontrado
      console.log('💀 FALHA TOTAL: Recurso não encontrado ou inválido');
      setResource(null);
      setLoading(false);
      setError('Recurso não encontrado ou dados inválidos');
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

// ✅ Validação robusta do recurso transformado
function validateTransformedResource(resource: Resource): boolean {
  if (!resource) {
    console.log('❌ VALIDAÇÃO: Recurso é null/undefined');
    return false;
  }
  
  if (!resource.id || resource.id === 'undefined' || resource.id === 'null' || resource.id.trim() === '') {
    console.log('❌ VALIDAÇÃO: ID inválido:', resource.id);
    return false;
  }
  
  if (!resource.title || resource.title.trim() === '') {
    console.log('❌ VALIDAÇÃO: Título inválido:', resource.title);
    return false;
  }
  
  if (!resource.author || resource.author.trim() === '') {
    console.log('❌ VALIDAÇÃO: Autor inválido:', resource.author);
    return false;
  }
  
  if (!resource.type || !['video', 'titulo', 'podcast'].includes(resource.type)) {
    console.log('❌ VALIDAÇÃO: Tipo inválido:', resource.type);
    return false;
  }
  
  console.log('✅ VALIDAÇÃO: Recurso válido');
  return true;
}

// ✅ Helper function para transformar item do cache
function transformToResource(item: any): Resource {
  console.log('🔄 Transformando item do cache local:', item);
  
  return {
    id: String(item.id),
    originalId: String(item.id),
    title: item.title || 'Título não disponível',
    type: item.type,
    author: item.author || 'Autor desconhecido',
    duration: item.duration,
    pages: item.pages,
    episodes: item.episodes,
    thumbnail: item.thumbnail,
    description: item.description || 'Descrição não disponível',
    year: item.year || new Date().getFullYear(),
    subject: item.subject || 'Assunto não especificado',
    embedUrl: item.embedUrl,
    pdfUrl: item.pdfUrl,
    fullDescription: item.description,
    tags: item.subject ? [item.subject] : undefined,
    language: item.language,
    documentType: item.documentType,
    categories: item.categories || [],
    podcast_titulo: item.podcast_titulo
  };
}
