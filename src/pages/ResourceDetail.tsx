
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
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

const ResourceDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  // Usar APENAS o hook useResourceById para gerenciar toda a busca
  const { 
    resource, 
    loading, 
    error, 
    suggestions,
    searchAttempted,
    retry 
  } = useResourceById(id);

  // Scroll to top when component mounts or when resource changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, resource]);

  // Estados de loading
  if (loading && !searchAttempted) {
    return (
      <>
        <Navigation />
        <LoadingSkeleton />
      </>
    );
  }

  // Estado de busca na API
  if (loading && searchAttempted) {
    return (
      <>
        <Navigation />
        <LoadingSearchState searchingId={id} />
      </>
    );
  }

  // Recurso não encontrado
  if (error && !resource) {
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
