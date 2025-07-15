
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const findResource = async () => {
      if (!id) {
        setResource(null);
        setLoading(false);
        setError('ID não fornecido');
        return;
      }

      console.group('🎯 BUSCA BLINDADA COM CONTROLE TOTAL DE ESTADO');
      console.log('🎯 Target ID:', id);
      console.log('🎯 Target Type (URL):', type);

      // ✅ BLINDAGEM TOTAL: Limpar estados anteriores e iniciar fresh
      setLoading(true);
      setError(null);
      setResource(null); // Limpa recurso anterior para evitar mostrar dados velhos
      setRetrying(false);

      // Cancelar busca anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Criar novo controller para esta busca
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
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
              if (!signal.aborted) {
                setResource(transformedResource);
                setLoading(false);
                console.log('🛡️ SUCESSO: Recurso setado com segurança do cache');
                console.groupEnd();
                return;
              }
            }
          }
        }

        // FASE 2: Se dados ainda estão carregando, aguardar com retry
        if (dataLoading && !dataLoaded) {
          console.log('⏳ AGUARDANDO: Dados ainda carregando - configurando retry');
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
              if (!signal.aborted) {
                setResource(transformedResource);
                setLoading(false);
                console.log('🛡️ SUCESSO: Recurso setado com segurança do cache geral');
                console.groupEnd();
                return;
              }
            }
          }
        }

        // FASE 4: Busca na API - USANDO TIPO CONHECIDO PRIMEIRO
        console.log('📡 FASE 4: Busca na API - BUSCA DIRETA POR TIPO');
        
        // ✅ LÓGICA OTIMIZADA: Busca direta por tipo quando conhecido
        let searchTypes: string[];
        let optimizedSearch = false;
        
        if (knownType) {
          if (knownType === 'titulo') {
            searchTypes = ['livro', 'artigos'];
            optimizedSearch = true;
          } else if (knownType === 'video') {
            searchTypes = ['video'];
            optimizedSearch = true;
          } else if (knownType === 'podcast') {
            searchTypes = ['podcast'];
            optimizedSearch = true;
          } else {
            const actualType = knownType === 'titulo' ? 'livro' : knownType;
            searchTypes = [actualType];
            optimizedSearch = true;
          }
          
          console.log(`🎯 BUSCA DIRETA OTIMIZADA: Tipo "${knownType}" → API calls: [${searchTypes.join(', ')}]`);
        } else {
          searchTypes = ['livro', 'video', 'podcast', 'artigos'];
          console.log('🔄 FALLBACK: Busca sequencial completa para URL sem tipo');
        }

        // ✅ TENTATIVAS DE API COM CONTROLE TOTAL
        for (let i = 0; i < searchTypes.length; i++) {
          if (signal.aborted) {
            console.log('⚠️ Busca cancelada pelo AbortController');
            console.groupEnd();
            return;
          }

          const resourceType = searchTypes[i];
          
          try {
            console.log(`🔍 ${optimizedSearch ? 'BUSCA DIRETA' : 'BUSCA SEQUENCIAL'}: ${resourceType} com ID: ${id} (${i + 1}/${searchTypes.length})`);
            
            const apiResource = await ResourceByIdService.fetchResourceById(id, resourceType);
            
            if (apiResource && isValidTransformedResource(apiResource)) {
              if (!signal.aborted) {
                console.log(`✅ FASE 4 SUCCESS: Encontrado na API como ${resourceType} ${optimizedSearch ? '(BUSCA OTIMIZADA)' : '(FALLBACK)'}`);
                setResource(apiResource);
                setLoading(false);
                console.log('🛡️ SUCESSO: Recurso setado com segurança da API');
                console.groupEnd();
                return;
              }
            } else if (optimizedSearch && i === 0 && !apiResource) {
              console.log(`⚠️ BUSCA OTIMIZADA FALHOU para tipo "${resourceType}" - continuando...`);
            }
          } catch (apiError) {
            if (signal.aborted) {
              console.log('⚠️ Busca cancelada durante chamada de API');
              console.groupEnd();
              return;
            }

            const errorMsg = apiError instanceof Error ? apiError.message : String(apiError);
            
            if (optimizedSearch && errorMsg.includes('404')) {
              console.log(`❌ Busca otimizada: HTTP 404 para ${resourceType} ID ${id}`);
            } else {
              console.log(`❌ Falha ao buscar ${resourceType} com ID ${id}:`, errorMsg);
            }
          }
        }
        
        // ⚠️ SÓ CHEGA AQUI SE TODAS AS TENTATIVAS FALHARAM
        if (!signal.aborted) {
          throw new Error('Recurso não encontrado após todas as tentativas de busca');
        }
        
      } catch (finalError) {
        if (signal.aborted) {
          console.log('✅ Busca cancelada - ignorando erro final');
          console.groupEnd();
          return;
        }

        // ✅ ERRO DEFINITIVO: SÓ É SETADO AQUI, APÓS TODAS AS TENTATIVAS
        console.log('💀 FALHA FINAL E DEFINITIVA: Todas as tentativas de busca falharam');
        console.error('Detalhes do erro final:', finalError);
        
        setResource(null);
        setError('Recurso não encontrado ou dados inválidos');
        setRetrying(false);
        console.log('🛡️ ERRO DEFINITIVO: Estado de erro setado com segurança');
      } finally {
        // ✅ FINALIZAÇÃO SEGURA
        if (!signal.aborted) {
          setLoading(false);
          setRetrying(false);
          console.log('🛡️ FINALIZAÇÃO: Loading finalizado com segurança');
        }
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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [id, type, allData, dataLoading, dataLoaded]);

  // Reset states when ID or type changes
  useEffect(() => {
    console.log('🔄 ID ou tipo mudou - resetando estados:', { id, type });
    setRetrying(false);
    setError(null);
    setLoading(true);
    setResource(null); // Limpar recurso anterior imediatamente
  }, [id, type]);

  return { 
    resource, 
    loading, 
    error, 
    retrying 
  };
};

// ✅ VALIDAÇÃO ROBUSTA para recursos transformados
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
  
  console.log('✅ VALIDAÇÃO: Recurso válido e seguro para renderização');
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
