
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, Download, Share2, Clock, User, Calendar, BookOpen, Headphones, FileText, Volume2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import PodcastDetailHero from "@/components/PodcastDetailHero";
import PodcastEpisodeList from "@/components/PodcastEpisodeList";
import { useDataLoader } from '@/hooks/useDataLoader';
import LoadingSkeleton from '@/components/ResourceDetail/LoadingSkeleton';
import ResourceNotFound from '@/components/ResourceDetail/ResourceNotFound';
import ResourceBreadcrumb from '@/components/ResourceDetail/ResourceBreadcrumb';
import BackButton from '@/components/ResourceDetail/BackButton';
import MediaSection from '@/components/ResourceDetail/MediaSection';
import ActionButtons from '@/components/ResourceDetail/ActionButtons';
import ResourceInfo from '@/components/ResourceDetail/ResourceInfo';
import ResourceContent from '@/components/ResourceDetail/ResourceContent';
import PodcastDetailView from '@/components/ResourceDetail/PodcastDetailView';
import { Resource } from '@/types/resourceTypes';

const ResourceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { allData, loading } = useDataLoader();
  const [resource, setResource] = useState<Resource | null>(null);
  const [resourceLoading, setResourceLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Scroll to top when component mounts or when resource changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, resource]);

  useEffect(() => {
    const findResource = () => {
      if (!allData || allData.length === 0) {
        console.log('📊 No data available yet');
        setResourceLoading(false);
        return;
      }

      console.group('🔍 ENHANCED RESOURCE SEARCH DEBUG');
      console.log('🎯 TARGET ID:', id, 'Type:', typeof id);
      console.log('📊 Total available data:', allData.length, 'items');

      // Análise detalhada por tipo
      const byType = allData.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      console.log('📈 Data breakdown by type:');
      Object.entries(byType).forEach(([type, items]) => {
        console.log(`  ${type}: ${items.length} items`);
        
        // Mostrar amostras de IDs para cada tipo
        const sampleIds = items.slice(0, 5).map(item => ({
          id: item.id,
          originalId: (item as any).originalId,
          idType: typeof item.id,
          title: item.title.substring(0, 30) + '...'
        }));
        console.log(`  ${type} ID samples:`, sampleIds);
      });

      // Verificar se o ID target é numérico
      const isNumericId = !isNaN(Number(id));
      console.log('🔢 Target ID is numeric:', isNumericId);

      // FASE 1: Busca exata por ID
      console.log('🔍 PHASE 1: Exact ID match search...');
      let foundResource = allData.find(item => String(item.id) === id);
      
      if (foundResource) {
        console.log('✅ PHASE 1 SUCCESS: Found by exact ID', {
          id: foundResource.id,
          type: foundResource.type,
          title: foundResource.title
        });
      } else {
        console.log('❌ PHASE 1 FAILED: No exact ID match');
        
        // FASE 2: Busca por originalId (para videos e podcasts)
        console.log('🔍 PHASE 2: OriginalId search for videos and podcasts...');
        foundResource = allData.find(item => 
          (item.type === 'video' || item.type === 'podcast') && (item as any).originalId === id
        );
        
        if (foundResource) {
          console.log('✅ PHASE 2 SUCCESS: Found by originalId', {
            id: foundResource.id,
            originalId: (foundResource as any).originalId,
            type: foundResource.type,
            title: foundResource.title
          });
        } else {
          console.log('❌ PHASE 2 FAILED: No originalId match');
          
          // FASE 3: Análise de compatibilidade de ID
          console.log('🔍 PHASE 3: ID compatibility analysis...');
          
          if (isNumericId) {
            const numericId = parseInt(id || '0');
            console.log('🔢 Searching for numeric ID:', numericId);
            
            // Buscar em todos os tipos com IDs numéricos
            const numericMatches = allData.filter(item => 
              typeof item.id === 'number' && item.id === numericId
            );
            
            if (numericMatches.length > 0) {
              foundResource = numericMatches[0];
              console.log('✅ PHASE 3 SUCCESS: Found numeric match', foundResource);
            } else {
              // Verificar se existe ID próximo (para videos)
              const videos = allData.filter(item => item.type === 'video' && typeof item.id === 'number');
              if (videos.length > 0) {
                const videoMatches = videos
                  .map(v => ({ 
                    video: v, 
                    distance: Math.abs((v.id as number) - numericId) 
                  }))
                  .sort((a, b) => a.distance - b.distance);
                
                console.log('🎬 Closest video matches:', videoMatches.slice(0, 3));
                
                if (videoMatches[0].distance < 100) {
                  foundResource = videoMatches[0].video;
                  console.log('✅ PHASE 3 SUCCESS: Found close video match', {
                    targetId: numericId,
                    foundId: foundResource.id,
                    distance: videoMatches[0].distance
                  });
                }
              }
            }
          }
        }
      }

      // Debug final e estatísticas
      const debugData = {
        targetId: id,
        targetIdType: typeof id,
        isNumeric: isNumericId,
        totalItems: allData.length,
        typeBreakdown: Object.fromEntries(
          Object.entries(byType).map(([type, items]) => [
            type, 
            {
              count: items.length,
              idTypes: [...new Set(items.map(i => typeof i.id))],
              sampleIds: items.slice(0, 3).map(i => ({
                id: i.id,
                originalId: (i as any).originalId
              }))
            }
          ])
        ),
        searchResult: foundResource ? {
          found: true,
          id: foundResource.id,
          originalId: (foundResource as any).originalId,
          type: foundResource.type,
          title: foundResource.title
        } : {
          found: false,
          reason: 'No matching resource found with any search strategy'
        }
      };

      console.log('📊 FINAL DEBUG DATA:', debugData);
      setDebugInfo(debugData);

      if (foundResource) {
        console.log('🎉 RESOURCE FOUND!', {
          id: foundResource.id,
          originalId: (foundResource as any).originalId,
          type: foundResource.type,
          title: foundResource.title,
          hasEmbedUrl: !!(foundResource as any).embedUrl,
          hasThumbnail: !!foundResource.thumbnail
        });
        
        // Convert SearchResult to Resource format
        const convertedResource: Resource = {
          id: typeof foundResource.id === 'string' ? parseInt(id || '0') : foundResource.id,
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
          tags: foundResource.subject ? [foundResource.subject] : undefined
        };

        setResource(convertedResource);
      } else {
        console.log('💀 RESOURCE NOT FOUND - Full analysis completed');
        console.log('🔍 Available resources summary:');
        
        // Mostrar alguns recursos disponíveis como sugestão
        const suggestions = allData.slice(0, 5).map(item => ({
          id: item.id,
          originalId: (item as any).originalId,
          type: item.type,
          title: item.title.substring(0, 40) + '...'
        }));
        console.log('💡 Available resources (samples):', suggestions);
        
        setResource(null);
      }
      
      console.groupEnd();
      setResourceLoading(false);
    };

    if (!loading) {
      findResource();
    }
  }, [id, allData, loading]);

  // Loading skeletons
  if (loading || resourceLoading) return <><Navigation /><LoadingSkeleton /></>;
  if (!resource) return <><Navigation /><ResourceNotFound targetId={id} debugInfo={debugInfo} /></>;

  // If podcast detected
  if (resource.type === 'podcast') {
    return <PodcastDetailView podcast={resource} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-[100px]">
        <ResourceBreadcrumb title={resource.title} />
        <BackButton />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <MediaSection resource={resource} />
            <ResourceContent resource={resource} />
          </div>
          {/* Sidebar - Reordenado: ResourceInfo primeiro, ActionButtons depois */}
          <div className="space-y-6">
            <ResourceInfo resource={resource} />
            <ActionButtons resource={resource} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResourceDetail;
