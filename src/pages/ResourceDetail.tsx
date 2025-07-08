
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
import { useResourceById } from '@/hooks/useResourceById';
import LoadingSkeleton from '@/components/ResourceDetail/LoadingSkeleton';
import LoadingSearchState from '@/components/ResourceDetail/LoadingSearchState';
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
  const { allData, loading: dataLoaderLoading } = useDataLoader();
  const { 
    resource: apiResource, 
    suggestions, 
    loading: apiSearchLoading, 
    error: apiError,
    retrySearch,
    searchAttempted 
  } = useResourceById(id);
  
  const [resource, setResource] = useState<Resource | null>(null);
  const [resourceLoading, setResourceLoading] = useState(true);
  const [searchPhase, setSearchPhase] = useState<'local' | 'api' | 'complete'>('local');

  // Scroll to top when component mounts or when resource changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, resource]);

  // FASE 1: Busca local (dados já carregados)
  useEffect(() => {
    const findResourceLocally = () => {
      if (!allData || allData.length === 0 || !id) {
        console.log('📊 Dados locais não disponíveis ainda');
        return null;
      }

      console.group('🔍 BUSCA LOCAL - ID:', id);
      console.log('📊 Total de dados locais:', allData.length);

      // PHASE 1: Direct ID match
      let foundResource = allData.find(item => String(item.id) === id);
      
      if (foundResource) {
        console.log('✅ Encontrado por ID direto local');
      } else {
        // PHASE 2: originalId match para videos
        foundResource = allData.find(item => 
          item.type === 'video' && (item as any).originalId === id
        );
        
        if (foundResource) {
          console.log('✅ Encontrado por originalId local');
        } else {
          // PHASE 3: busca numérica aproximada
          const numericId = parseInt(id);
          if (!isNaN(numericId)) {
            const videos = allData.filter(item => item.type === 'video');
            const videoMatches = videos
              .map(v => ({ 
                video: v, 
                distance: Math.abs(v.id - numericId) 
              }))
              .sort((a, b) => a.distance - b.distance);
            
            if (videoMatches.length > 0 && videoMatches[0].distance < 1000) {
              foundResource = videoMatches[0].video;
              console.log('✅ Encontrado por proximidade local');
            }
          }
        }
      }

      if (foundResource) {
        // Converter SearchResult para Resource
        const convertedResource: Resource = {
          id: typeof foundResource.id === 'string' ? parseInt(id) : foundResource.id,
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
          tags: foundResource.subject ? [foundResource.subject] : undefined,
          language: (foundResource as any).language,
          documentType: (foundResource as any).documentType,
          categories: (foundResource as any).categories
        };

        console.log('🎉 Recurso encontrado localmente:', convertedResource.title);
        console.groupEnd();
        return convertedResource;
      }

      console.log('❌ Recurso não encontrado localmente');
      console.groupEnd();
      return null;
    };

    if (!dataLoaderLoading && id) {
      const localResource = findResourceLocally();
      if (localResource) {
        setResource(localResource);
        setResourceLoading(false);
        setSearchPhase('complete');
        console.log('✅ Usando recurso encontrado localmente');
      } else {
        // Não encontrado localmente, partir para busca na API
        setSearchPhase('api');
        console.log('🌐 Iniciando busca na API...');
      }
    }
  }, [id, allData, dataLoaderLoading]);

  // FASE 2: Busca na API (quando não encontrado localmente)
  useEffect(() => {
    if (searchPhase === 'api' && apiResource) {
      setResource(apiResource);
      setResourceLoading(false);
      setSearchPhase('complete');
      console.log('✅ Recurso encontrado via API:', apiResource.title);
    } else if (searchPhase === 'api' && searchAttempted && !apiSearchLoading && !apiResource) {
      // Busca na API foi concluída mas não encontrou o recurso
      setResourceLoading(false);
      setSearchPhase('complete');
      console.log('❌ Recurso não encontrado nem localmente nem na API');
    }
  }, [searchPhase, apiResource, searchAttempted, apiSearchLoading]);

  // Estados de loading
  if (dataLoaderLoading) {
    return (
      <>
        <Navigation />
        <LoadingSkeleton />
      </>
    );
  }

  if (searchPhase === 'api' && apiSearchLoading && id) {
    return (
      <>
        <Navigation />
        <LoadingSearchState resourceId={id} />
      </>
    );
  }

  // Recurso não encontrado
  if (searchPhase === 'complete' && !resource) {
    return (
      <>
        <Navigation />
        <ResourceNotFound 
          resourceId={id}
          suggestions={suggestions}
          onRetry={retrySearch}
          loading={apiSearchLoading}
        />
      </>
    );
  }

  // Loading enquanto ainda está processando
  if (resourceLoading || !resource) {
    return (
      <>
        <Navigation />
        <LoadingSkeleton />
      </>
    );
  }

  // Se podcast detectado
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
            <ResourceContent resource={resource} />
            <MediaSection resource={resource} />
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
