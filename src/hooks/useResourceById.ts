
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

      console.group('🔍 BUSCA OTIMIZADA DE RECURSO - FOCO EM LIVROS');
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
          const transformedResource = transformToResource(foundResource);
          
          if (isValidTransformedResource(transformedResource)) {
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
        console.log('⏳ AGUARDANDO: Dados ainda carregando...');
        setRetrying(true);
        
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
          
          if (isValidTransformedResource(transformedResource)) {
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

      // FASE 4: Busca na API - FOCO EM LIVROS
      if (!apiAttempted) {
        console.log('📡 FASE 4: Busca na API - PRIORITIZANDO LIVROS');
        setApiAttempted(true);
        
        // ✅ CORREÇÃO: Para títulos, tentar apenas livro (não artigo)
        const searchTypes = resourceInfo?.type ? [resourceInfo.type] : ['titulo', 'video', 'podcast'];
        
        for (const resourceType of searchTypes) {
          try {
            console.log(`🔍 Tentando buscar ${resourceType} com ID: ${id}`);
            
            // ✅ CORREÇÃO ESPECÍFICA: Para 'titulo', usar endpoint de livro
            const actualType = resourceType === 'titulo' ? 'livro' : resourceType;
            
            const apiResource = await ResourceByIdService.fetchResourceById(id, actualType);
            
            if (apiResource && isValidTransformedResource(apiResource)) {
              console.log(`✅ FASE 4 SUCCESS: Encontrado na API como ${actualType}`);
              setResource(apiResource);
              setLoading(false);
              setError(null);
              setRetrying(false);
              console.groupEnd();
              return;
            } else if (apiResource) {
              console.log(`❌ FASE 4: Recurso ${actualType} inválido após validação`);
            }
          } catch (apiError) {
            console.log(`❌ Falha ao buscar ${resourceType} com ID ${id}:`, apiError);
          }
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

// ✅ VALIDAÇÃO MAIS PERMISSIVA para recursos transformados
function isValidTransformedResource(resource: Resource): boolean {
  if (!resource) {
    console.log('❌ VALIDAÇÃO: Recurso é null/undefined');
    return false;
  }
  
  if (!resource.id || resource.id === 'undefined' || resource.id === 'null' || resource.id.trim() === '') {
    console.log('❌ VALIDAÇÃO: ID inválido:', resource.id);
    return false;
  }
  
  if (!resource.title || resource.title.trim() === '' || resource.title === 'Título não disponível') {
    console.log('❌ VALIDAÇÃO: Título inválido ou fallback:', resource.title);
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

// ✅ TRANSFORMAÇÃO MAIS ROBUSTA para cache local
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
