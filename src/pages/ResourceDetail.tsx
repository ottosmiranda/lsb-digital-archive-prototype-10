
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import EnhancedLoadingSkeleton from '@/components/ResourceDetail/EnhancedLoadingSkeleton';
import ResourceNotFound from '@/components/ResourceDetail/ResourceNotFound';
import ResourceBreadcrumb from '@/components/ResourceDetail/ResourceBreadcrumb';
import BackButton from '@/components/ResourceDetail/BackButton';
import MediaSection from '@/components/ResourceDetail/MediaSection';
import ActionButtons from '@/components/ResourceDetail/ActionButtons';
import ResourceInfo from '@/components/ResourceDetail/ResourceInfo';
import ResourceContent from '@/components/ResourceDetail/ResourceContent';
import PodcastDetailView from '@/components/ResourceDetail/PodcastDetailView';
import { useResourceById } from '@/hooks/useResourceById';

const ResourceDetail = () => {
  const { id, type } = useParams<{ id: string; type?: string }>();
  const { resource, loading, error, retrying } = useResourceById(id, type);

  // Scroll to top when component mounts or when resource changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, resource]);

  console.group('🎯 RESOURCE DETAIL DEBUG (NAVEGAÇÃO COM TIPO)');
  console.log('📋 URL ID:', id);
  console.log('📋 URL Type:', type);
  console.log('📋 Resource found:', resource ? { id: resource.id, type: resource.type, title: resource.title.substring(0, 50) + '...' } : 'null');
  console.log('📋 Loading:', loading);
  console.log('📋 Retrying:', retrying);
  console.log('📋 Error:', error);
  console.groupEnd();

  if (loading) {
    const loadingMessage = retrying 
      ? 'Aguardando dados serem carregados...' 
      : 'Carregando recurso...';
      
    return (
      <>
        <Navigation />
        <EnhancedLoadingSkeleton retrying={retrying} message={loadingMessage} />
      </>
    );
  } else if (!resource && error && !retrying) {
    return (
      <>
        <Navigation />
        <ResourceNotFound />
      </>
    );
  } else if (resource) {
    // If podcast detected
    if (resource.type === 'podcast') {
      return <PodcastDetailView podcast={resource} />;
    }

    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="lsb-container">
          <div className="lsb-content">
            <div className="py-8 pb-[100px]">
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
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return null;
};

export default ResourceDetail;
