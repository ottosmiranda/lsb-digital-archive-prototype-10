import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
import { useToast } from '@/hooks/use-toast';

const ResourceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
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

      console.group('🔍 ENHANCED RESOURCE SEARCH WITH SMART REDIRECT - ID: ' + id);
      console.log('🎯 TARGET ID:', id, 'Type:', typeof id);
      console.log('📊 Total available data:', allData.length, 'items');

      const isNumericId = !isNaN(Number(id));
      console.log('🔢 Target ID is numeric:', isNumericId);

      // Análise detalhada por tipo
      const byType = allData.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      console.log('📈 Data breakdown by type:');
      Object.entries(byType).forEach(([type, items]) => {
        console.log(`  ${type}: ${items.length} items`);
        
        // Mostrar amostras de IDs para cada tipo - SAFE FOR ALL TYPES
        const sampleIds = items.slice(0, 3).map(item => ({
          id: item.id,
          originalId: (item as any).originalId,
          idType: typeof item.id,
          title: item.title.substring(0, 30) + '...'
        }));
        console.log(`  ${type} ID samples:`, sampleIds);
      });

      // BUSCA APRIMORADA: Múltiplas estratégias de busca
      console.log('🔍 Starting comprehensive search...');
      let foundResource: any = null;
      let searchMethod = '';

      // ESTRATÉGIA 1: Busca direta por ID
      foundResource = allData.find(item => String(item.id) === id);
      if (foundResource) {
        searchMethod = 'Direct ID match';
        console.log('✅ FOUND by direct ID:', foundResource.id, foundResource.type, foundResource.title);
      }

      // ESTRATÉGIA 2: Busca por originalId (para vídeos transformados)
      if (!foundResource) {
        foundResource = allData.find(item => 
          (item as any).originalId && String((item as any).originalId) === id
        );
        if (foundResource) {
          searchMethod = 'OriginalId match';
          console.log('✅ FOUND by originalId:', (foundResource as any).originalId, foundResource.type, foundResource.title);
        }
      }

      // ESTRATÉGIA 3: Busca numérica flexível (para IDs transformados)
      if (!foundResource && isNumericId) {
        const numericId = parseInt(id || '0');
        foundResource = allData.find(item => 
          typeof item.id === 'number' && item.id === numericId
        );
        if (foundResource) {
          searchMethod = 'Numeric ID match';
          console.log('✅ FOUND by numeric conversion:', foundResource.id, foundResource.type, foundResource.title);
        }
      }

      // ESTRATÉGIA 4: Redirecionamento inteligente por tipo
      if (!foundResource && isNumericId) {
        console.log('🧠 Attempting smart redirect for numeric ID:', id);
        
        // Procurar em vídeos primeiro (mais comum para IDs numéricos)
        const videoMatch = allData.find(item => 
          item.type === 'video' && (
            String(item.id) === id || 
            String((item as any).originalId) === id ||
            (typeof item.id === 'number' && item.id === parseInt(id))
          )
        );
        
        if (videoMatch) {
          foundResource = videoMatch;
          searchMethod = 'Smart redirect to video';
          console.log('🎯 SMART REDIRECT: Found video for numeric ID');
          
          toast({
            title: "Recurso encontrado!",
            description: `Redirecionando para o vídeo "${foundResource.title.substring(0, 50)}..."`,
            duration: 3000,
          });
          
          setTimeout(() => {
            navigate(`/recurso/${foundResource.id}`, { replace: true });
          }, 1000);
          return;
        }

        // Se não encontrou vídeo, tentar livros
        const bookMatch = allData.find(item => 
          item.type === 'titulo' && (
            String(item.id) === id || 
            (typeof item.id === 'number' && item.id === parseInt(id))
          )
        );
        
        if (bookMatch) {
          foundResource = bookMatch;
          searchMethod = 'Smart redirect to book';
          console.log('🎯 SMART REDIRECT: Found book for numeric ID');
          
          toast({
            title: "Recurso encontrado!",
            description: `Redirecionando para o livro "${foundResource.title.substring(0, 50)}..."`,
            duration: 3000,
          });
          
          setTimeout(() => {
            navigate(`/recurso/${foundResource.id}`, { replace: true });
          }, 1000);
          return;
        }
      }

      // Debug aprimorado
      const debugData = {
        targetId: id,
        targetIdType: typeof id,
        isNumeric: isNumericId,
        totalItems: allData.length,
        searchMethod: searchMethod || 'No match found',
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
          title: foundResource.title,
          method: searchMethod
        } : {
          found: false,
          reason: `ID ${id} (${isNumericId ? 'numeric' : 'text'}) not found using any search method`
        }
      };

      console.log('📊 COMPLETE SEARCH DEBUG:', debugData);
      setDebugInfo(debugData);

      if (foundResource) {
        console.log('🎉 RESOURCE FOUND via', searchMethod, {
          id: foundResource.id,
          originalId: (foundResource as any).originalId,
          type: foundResource.type,
          title: foundResource.title
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
        console.log('💀 RESOURCE NOT FOUND after comprehensive search');
        setResource(null);
      }
      
      console.groupEnd();
      setResourceLoading(false);
    };

    if (!loading) {
      findResource();
    }
  }, [id, allData, loading, navigate, toast]);

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
          {/* Sidebar */}
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
