
import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
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
    loading: apiLoading, 
    error: apiError, 
    suggestions,
    retry 
  } = useResourceById(id);
  
  const [resource, setResource] = useState<Resource | null>(null);
  const [isSearchingViaAPI, setIsSearchingViaAPI] = useState(false);

  // Scroll to top when component mounts or when resource changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, resource]);

  // Lógica de busca escalonada: local → API
  useEffect(() => {
    const findResource = () => {
      if (!id) return;

      console.group('🔍 RESOURCE DETAIL SEARCH');
      console.log('🎯 Target ID:', id);

      // FASE 1: Buscar nos dados pré-carregados
      if (allData && allData.length > 0) {
        console.log('📊 Checking pre-loaded data:', allData.length, 'items');
        
        // Busca direta por ID
        let foundResource = allData.find(item => String(item.id) === id);
        
        if (!foundResource) {
          // Busca por originalId para vídeos
          foundResource = allData.find(item => 
            item.type === 'video' && (item as any).originalId === id
          );
        }

        if (!foundResource) {
          // Busca numérica inteligente
          const numericId = parseInt(id || '0');
          if (numericId >= 1000) {
            const videos = allData.filter(item => item.type === 'video');
            const videoMatches = videos
              .map(v => ({ video: v, distance: Math.abs(v.id - numericId) }))
              .sort((a, b) => a.distance - b.distance);
            
            if (videoMatches.length > 0 && videoMatches[0].distance < 1000) {
              foundResource = videoMatches[0].video;
            }
          }
        }

        if (foundResource) {
          console.log('✅ Found in pre-loaded data:', foundResource.title);
          
          // Converter para formato Resource
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

          setResource(convertedResource);
          setIsSearchingViaAPI(false);
          console.groupEnd();
          return;
        }
      }

      // FASE 2: Não encontrado nos dados pré-carregados
      console.log('❌ Not found in pre-loaded data, will search via API');
      setIsSearchingViaAPI(true);
      console.groupEnd();
    };

    // Só buscar localmente se não estamos carregando dados e não temos resource da API ainda
    if (!dataLoaderLoading && !apiResource && !apiLoading) {
      findResource();
    }
  }, [id, allData, dataLoaderLoading, apiResource, apiLoading]);

  // Atualizar resource quando a API retorna resultado
  useEffect(() => {
    if (apiResource) {
      console.log('✅ Resource found via API:', apiResource.title);
      setResource(apiResource);
      setIsSearchingViaAPI(false);
    }
  }, [apiResource]);

  // Estados de loading
  const isLoading = dataLoaderLoading || (isSearchingViaAPI && apiLoading);
  const isSearchingAPI = isSearchingViaAPI && apiLoading;

  // Loading skeletons
  if (isLoading && !isSearchingAPI) {
    return (
      <>
        <Navigation />
        <LoadingSkeleton />
      </>
    );
  }

  // Estado de busca na API
  if (isSearchingAPI) {
    return (
      <>
        <Navigation />
        <LoadingSearchState searchingId={id} />
      </>
    );
  }

  // Recurso não encontrado
  if (!resource && (apiError || (!apiLoading && isSearchingViaAPI))) {
    return (
      <>
        <Navigation />
        <ResourceNotFound 
          requestedId={id}
          suggestions={suggestions}
          onRetry={retry}
        />
      </>
    );
  }

  // Sem resource disponível
  if (!resource) {
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
