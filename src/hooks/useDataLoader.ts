import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';
import { SearchResult } from '@/types/searchTypes';
import { ResourceLookupService } from '@/services/resourceLookupService';

export const useDataLoader = (loadAll: boolean = false) => {
  const [allData, setAllData] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    const startTime = Date.now();
    console.log('🚀 Iniciando carregamento de dados...');

    try {
      const promises = [];
      
      // Fetch videos
      promises.push(
        supabase.functions.invoke('fetch-videos', {
          body: { 
            page: 1, 
            limit: loadAll ? 1000 : 12
          }
        }).then(response => {
          if (response.error) throw response.error;
          const data = response.data;
          if (data?.success && data?.videos) {
            // Save type mapping for videos
            if (data.typeMapping) {
              ResourceLookupService.batchSaveTypeMapping(data.typeMapping);
            }
            return { type: 'videos', data: data.videos };
          }
          return { type: 'videos', data: [] };
        })
      );

      // Fetch books
      promises.push(
        supabase.functions.invoke('fetch-books', {
          body: { 
            page: 1, 
            limit: loadAll ? 1000 : 12
          }
        }).then(response => {
          if (response.error) throw response.error;
          const data = response.data;
          if (data?.success && data?.books) {
            // Save type mapping for books
            if (data.typeMapping) {
              ResourceLookupService.batchSaveTypeMapping(data.typeMapping);
            }
            return { type: 'books', data: data.books };
          }
          return { type: 'books', data: [] };
        })
      );

      // Fetch podcasts
      promises.push(
        supabase.functions.invoke('fetch-podcasts', {
          body: { 
            page: 1, 
            limit: loadAll ? 1000 : 12
          }
        }).then(response => {
          if (response.error) throw response.error;
          const data = response.data;
          if (data?.success && data?.podcasts) {
            // Save type mapping for podcasts
            if (data.typeMapping) {
              ResourceLookupService.batchSaveTypeMapping(data.typeMapping);
            }
            return { type: 'podcasts', data: data.podcasts };
          }
          return { type: 'podcasts', data: [] };
        })
      );

      const results = await Promise.allSettled(promises);
      const allItems: SearchResult[] = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const items = result.value.data;
          allItems.push(...items);
          console.log(`✅ ${result.value.type} carregados: ${items.length} itens`);
        } else {
          const types = ['videos', 'books', 'podcasts'];
          console.error(`❌ Erro ao carregar ${types[index]}:`, result.reason);
        }
      });

      setAllData(allItems);
      
      const loadTime = Date.now() - startTime;
      console.log(`🎉 Carregamento concluído: ${allItems.length} itens em ${loadTime}ms`);
      
      // Log cache statistics
      const cacheStats = ResourceLookupService.getCacheStats();
      console.log('📊 Cache Stats:', cacheStats);
      
    } catch (error) {
      console.error('❌ Erro durante carregamento:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [loadAll, loading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { allData, loading, error, loadData };
};
