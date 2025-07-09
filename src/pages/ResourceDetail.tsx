
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import LoadingSkeleton from '@/components/ResourceDetail/LoadingSkeleton';
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
  const { id } = useParams<{ id: string }>();
  const { resource, loading, error, foundVia } = useResourceById(id);

  // Scroll to top when component mounts or when resource changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, resource]);

  // Debug info
  useEffect(() => {
    if (resource && foundVia) {
      console.log(`🎯 Recurso carregado via: ${foundVia.toUpperCase()}`, {
        id: resource.id,
        title: resource.title.substring(0, 50) + '...',
        type: resource.type
      });
    }
  }, [resource, foundVia]);

  // Loading state
  if (loading) {
    return (
      <>
        <Navigation />
        <LoadingSkeleton />
      </>
    );
  }

  // Error or not found state
  if (error || !resource) {
    return (
      <>
        <Navigation />
        <ResourceNotFound />
      </>
    );
  }

  // If podcast detected, use specialized view
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
