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

      console.group('🎯 BUSCA OTIMIZADA COM TIPO CONHECIDO');
      console.log('🎯 Target ID:', id);
      console.log('🎯 Target Type (URL):', type);

      setLoading(true);
      setError(null);

      // FASE 1: Busca no cache de lookup primeiro (muito rápida)
      const resourceInfo = resourceLookupService.getResourceInfo(id);
      const knownType = type || resourceInfo?.type;
      
      console.log('📦 Cache info:', resourceInfo);
      console.log('🎯 Known Type:', knownType);
      
      if (resourceInfo || knownType) {
        console.log('⚡ FASE 1: Info disponível, buscando no cache local');
        
        // Busca direta no allData usando o tipo conhecido
        const foundResource = allData.find(item => 
          String(item.id) === id && (!knownType || item.type === knownType)
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
          }
        }
      }

      // FASE 2: Se não encontrou no cache, mas dados ainda estão carregando, aguarda
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
          }
        }
      }

      // FASE 4: Busca na API - USANDO TIPO CONHECIDO PRIMEIRO
      if (!apiAttempted) {
        console.log('📡 FASE 4: Busca na API - BUSCA DIRETA POR TIPO');
        setApiAttempted(true);
        setLoading(true);
        setError(null);
        
        // ✅ NOVA LÓGICA: Se temos tipo conhecido, buscar só ele primeiro
        let searchTypes: string[];
        
        if (knownType) {
          // Se tipo conhecido da URL ou cache, buscar apenas ele
          const actualType = knownType === 'titulo' ? 'livro' : knownType;
          searchTypes = [actualType];
          console.log(`🎯 BUSCA DIRETA: Usando tipo conhecido "${actualType}"`);
        } else {
          // Fallback para busca sequencial (URLs antigas)
          searchTypes = ['titulo', 'video', 'podcast'];
          console.log('🔄 FALLBACK: Busca sequencial para URL sem tipo');
        }

        let foundValidResource = false;
        
        for (let i = 0; i < searchTypes.length; i++) {
          const resourceType = searchTypes[i];
          
          try {
            console.log(`🔍 Tentando buscar ${resourceType} com ID: ${id} (${i + 1}/${searchTypes.length})`);
            
            const actualType = resourceType === 'titulo' ? 'livro' : resourceType;
            let apiResource = await ResourceByIdService.fetchResourceById(id, actualType);
            
            // ✅ NOVA LÓGICA: Se é titulo e não encontrou como livro, tentar como artigo
            if (!apiResource && resourceType === 'titulo') {
              console.log(`📰 Tentando buscar como artigo...`);
              apiResource = await ResourceByIdService.fetchResourceById(id, 'artigos');
            }
            
            if (apiResource && isValidTransformedResource(apiResource)) {
              console.log(`✅ FASE 4 SUCCESS: Encontrado na API como ${actualType === 'livro' && !apiResource ? 'artigo' : actualType}`);
              setResource(apiResource);
              setLoading(false);
              setError(null);
              setRetrying(false);
              foundValidResource = true;
              console.groupEnd();
              return;
            }
          } catch (apiError) {
            console.log(`❌ Falha ao buscar ${resourceType} com ID ${id}:`, apiError);
          }
        }
        
        if (!foundValidResource) {
          console.log('💀 FALHA TOTAL: Recurso não encontrado após todas as tentativas');
          setResource(null);
          setLoading(false);
          setError('Recurso não encontrado ou dados inválidos');
          setRetrying(false);
        }
      } else {
        console.log('💀 FALHA TOTAL: Recurso não encontrado ou inválido');
        setResource(null);
        setLoading(false);
        setError('Recurso não encontrado ou dados inválidos');
        setRetrying(false);
      }
        
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
  }, [id, type, allData, dataLoading, dataLoaded, apiAttempted]);

  // Reset states when ID or type changes
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
