
import { useState, useEffect } from 'react';
import { Resource } from '@/types/resourceTypes';
import { ResourceByIdService } from '@/services/resourceByIdService';
import { ResourceLookupService } from '@/services/resourceLookupService';

interface UseResourceByIdResult {
  resource: Resource | null;
  loading: boolean;
  error: string | null;
}

export const useResourceById = (id: string | undefined): UseResourceByIdResult => {
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const findResource = async () => {
      if (!id) {
        setResource(null);
        setLoading(false);
        setError('ID não fornecido');
        return;
      }

      console.group('🎯 BUSCA OTIMIZADA DE RECURSO');
      console.log('🔍 Target ID:', id);

      try {
        setLoading(true);
        setError(null);

        // FASE 1: Busca no cache de recursos
        console.log('📦 Fase 1: Verificando cache de recursos...');
        const cachedResource = ResourceLookupService.getCachedResource(id);
        
        if (cachedResource) {
          console.log('✅ Fase 1 SUCCESS: Recurso encontrado no cache');
          setResource(cachedResource);
          setLoading(false);
          console.groupEnd();
          return;
        }

        // FASE 2: Busca tipo específico no mapeamento
        console.log('🗺️ Fase 2: Consultando mapeamento de tipos...');
        const resourceType = ResourceLookupService.getResourceType(id);
        
        if (resourceType) {
          console.log(`✅ Tipo encontrado: ${resourceType}`);
          console.log(`📡 Fase 2: Buscando diretamente na API /${resourceType}/${id}...`);
          
          const apiResource = await ResourceByIdService.fetchResourceById(id, resourceType);
          
          if (apiResource) {
            console.log('✅ Fase 2 SUCCESS: Recurso encontrado na API com tipo específico');
            
            // Cache the resource for future use
            ResourceLookupService.saveResourceCache(id, apiResource);
            setResource(apiResource);
            setLoading(false);
            console.groupEnd();
            return;
          } else {
            console.log('❌ Fase 2 FALHA: Recurso não encontrado na API com tipo específico');
          }
        } else {
          console.log('⚠️ Tipo não encontrado no mapeamento');
        }

        // FASE 3: Fallback - busca em todos os tipos (apenas como emergência)
        console.log('🆘 Fase 3: FALLBACK - Tentando todos os tipos...');
        const resourceTypes = ['video', 'titulo', 'podcast'];
        
        for (const resourceType of resourceTypes) {
          try {
            console.log(`🔍 Tentando ${resourceType} com ID: ${id}`);
            const apiResource = await ResourceByIdService.fetchResourceById(id, resourceType);
            
            if (apiResource) {
              console.log(`✅ Fase 3 SUCCESS: Encontrado como ${resourceType}`);
              
              // Save type mapping for future use
              ResourceLookupService.saveTypeMapping(id, resourceType as any);
              
              // Cache the resource
              ResourceLookupService.saveResourceCache(id, apiResource);
              
              setResource(apiResource);
              setLoading(false);
              console.groupEnd();
              return;
            }
          } catch (apiError) {
            console.log(`❌ Falha ao buscar ${resourceType}:`, apiError);
          }
        }
        
        // Se chegou aqui, recurso não foi encontrado
        console.log('💀 FALHA TOTAL: Recurso não encontrado em nenhum endpoint');
        setResource(null);
        setLoading(false);
        setError('Recurso não encontrado');
        
      } catch (error) {
        console.error('❌ Erro durante busca:', error);
        setResource(null);
        setLoading(false);
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
      }
      
      console.groupEnd();
    };

    findResource();
  }, [id]);

  return { resource, loading, error };
};
