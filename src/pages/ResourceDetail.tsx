
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { resource, loading, error, retrying, invalidId } = useResourceById(id);

  // Scroll to top when component mounts or when resource changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, resource]);

  // Redirect invalid IDs after a delay to show user-friendly message
  useEffect(() => {
    if (invalidId && !loading) {
      console.log('🚫 ID inválido detectado, redirecionando em 3 segundos...');
      const redirectTimer = setTimeout(() => {
        console.log('🔄 Redirecionando para página de busca...');
        navigate('/buscar', { replace: true });
      }, 3000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [invalidId, loading, navigate]);

  console.group('🎯 RESOURCE DETAIL DEBUG (COM VALIDAÇÃO)');
  console.log('📋 URL ID:', id);
  console.log('📋 Resource found:', resource ? { id: resource.id, type: resource.type, title: resource.title.substring(0, 50) + '...' } : 'null');
  console.log('📋 Loading:', loading);
  console.log('📋 Retrying:', retrying);
  console.log('📋 Error:', error);
  console.log('📋 Invalid ID:', invalidId);
  console.groupEnd();

  // Enhanced loading with retry states
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
  }
  
  // Resource not found - with context about invalid ID
  if (!resource || error || invalidId) {
    return (
      <>
        <Navigation />
        <ResourceNotFound />
      </>
    );
  }

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
