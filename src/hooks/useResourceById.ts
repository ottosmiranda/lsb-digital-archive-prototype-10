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

export const useResourceById = (id: string | undefined, type?: string): UseResourceByIdResult => {
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

      console.group('🎯 BUSCA OTIMIZADA COM CACHE PRIORITÁRIO');
      console.log('🎯 Target ID:', id);
      console.log('🎯 URL Type:', type);

      setLoading(true);
      setError(null);

      // ✅ FASE 1: BUSCA PRIORITÁRIA NO CACHE DE LOOKUP
      console.log('📦 Verificando cache do resourceLookupService...');
      const resourceInfo = resourceLookupService.getResourceInfo(id);
      const cacheStats = resourceLookupService.getCacheStats();
      
      console.log('📊 Cache Stats:', cacheStats);
      console.log('📦 Resource Info no cache:', resourceInfo);
      
      // ✅ DECISÃO INTELIGENTE: Usar tipo do cache OU da URL
      const knownType = resourceInfo?.type || type;
      console.log('🎯 Tipo Definitivo:', knownType);
      
      if (knownType) {
        console.log('⚡ BUSCA DIRETA: Tipo conhecido, fazendo busca específica');
        
        // Busca no cache local primeiro
        const foundResource = allData.find(item => 
          String(item.id) === id && item.type === knownType
        );

        if (foundResource) {
          console.log('✅ SUCESSO CACHE LOCAL: Encontrado no allData');
          const transformedResource = transformToResource(foundResource);
          
          if (isValidTransformedResource(transformedResource)) {
            setResource(transformedResource);
            setLoading(false);
            setError(null);
            console.groupEnd();
            return;
          }
        }

        // ✅ BUSCA DIRETA NA API - SEM FALLBACK
        if (!apiAttempted) {
          console.log(`🚀 BUSCA DIRETA NA API: ${knownType} ID ${id}`);
          setApiAttempted(true);
          
          try {
            const actualType = knownType === 'titulo' ? 'livro' : knownType;
            console.log(`📡 Chamando API: ${actualType}/${id}`);
            
            const apiResource = await ResourceByIdService.fetchResourceById(id, actualType);
            
            if (apiResource && isValidTransformedResource(apiResource)) {
              console.log(`✅ SUCESSO API DIRETA: ${actualType} encontrado`);
              setResource(apiResource);
              setLoading(false);
              setError(null);
              setRetrying(false);
              console.groupEnd();
              return;
            } else {
              console.log(`❌ RECURSO INVÁLIDO: ${actualType}`);
            }
          } catch (apiError) {
            console.log(`❌ ERRO API DIRETA: ${knownType}`, apiError);
          }
          
          // Se falhou na busca direta, erro definitivo
          console.log('💀 FALHA NA BUSCA DIRETA: Recurso não encontrado');
          setResource(null);
          setLoading(false);
          setError('Recurso não encontrado');
          setRetrying(false);
          console.groupEnd();
          return;
        }
      }

      // ✅ FASE 2: AGUARDAR DADOS SE AINDA CARREGANDO
      if (dataLoading && !dataLoaded) {
        console.log('⏳ AGUARDANDO: Dados ainda carregando...');
        setRetrying(true);
        setLoading(true);
        
        retryTimeoutRef.current = setTimeout(() => {
          console.log('🔄 RETRY: Tentando buscar novamente após dados carregarem');
          findResource();
        }, 1000);
        
        console.groupEnd();
        return;
      }

      // ✅ FASE 3: BUSCA GERAL NO CACHE LOCAL (FALLBACK)
      if (allData && allData.length > 0) {
        console.log('📊 FALLBACK: Busca geral no cache local...');
        
        const foundResource = allData.find(item => String(item.id) === id);
        if (foundResource) {
          console.log('✅ SUCESSO FALLBACK CACHE: Encontrado no allData geral');
          const transformedResource = transformToResource(foundResource);
          
          if (isValidTransformedResource(transformedResource)) {
            setResource(transformedResource);
            setLoading(false);
            setError(null);
            setRetrying(false);
            console.groupEnd();
            return;
          }
        }
      }

      // ✅ FASE 4: BUSCA SEQUENCIAL NA API (SOMENTE SE CACHE VAZIO)
      if (!apiAttempted && cacheStats.totalResources === 0) {
        console.log('🔄 FALLBACK SEQUENCIAL: Cache vazio, tentando busca sequencial...');
        setApiAttempted(true);
        setLoading(true);
        setError(null);
        
        const searchTypes = ['titulo', 'video', 'podcast'];
        let foundValidResource = false;
        
        for (let i = 0; i < searchTypes.length; i++) {
          const resourceType = searchTypes[i];
          
          try {
            console.log(`🔍 Fallback ${i + 1}/${searchTypes.length}: ${resourceType} ID ${id}`);
            
            const actualType = resourceType === 'titulo' ? 'livro' : resourceType;
            const apiResource = await ResourceByIdService.fetchResourceById(id, actualType);
            
            if (apiResource && isValidTransformedResource(apiResource)) {
              console.log(`✅ SUCESSO SEQUENCIAL: Encontrado como ${actualType}`);
              setResource(apiResource);
              setLoading(false);
              setError(null);
              setRetrying(false);
              foundValidResource = true;
              console.groupEnd();
              return;
            }
          } catch (apiError) {
            console.log(`❌ Falha sequencial ${resourceType}:`, apiError);
          }
        }
        
        if (!foundValidResource) {
          console.log('💀 FALHA TOTAL: Não encontrado em nenhum tipo');
          setResource(null);
          setLoading(false);
          setError('Recurso não encontrado');
          setRetrying(false);
        }
      } else if (cacheStats.totalResources > 0) {
        console.log('💀 SEM BUSCA SEQUENCIAL: Cache populado mas recurso não encontrado');
        setResource(null);
        setLoading(false);
        setError('Recurso não encontrado ou dados inválidos');
        setRetrying(false);
      }
        
      console.groupEnd();
    };

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    findResource();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [id, type, allData, dataLoading, dataLoaded, apiAttempted]);

  useEffect(() => {
    setApiAttempted(false);
    setRetrying(false);
    setError(null);
    setLoading(true);
  }, [id, type]);

  return { 
    resource, 
    loading, 
    error, 
    retrying 
  };
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
