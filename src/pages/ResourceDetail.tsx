
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
import InvalidIdDetector from '@/components/ResourceDetail/InvalidIdDetector';
import { useResourceById } from '@/hooks/useResourceById';
import { idValidationService } from '@/services/idValidationService';

const ResourceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { resource, loading, error, retrying } = useResourceById(id);

  // Scroll to top when component mounts or when resource changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, resource]);

  console.group('🎯 RESOURCE DETAIL DEBUG (WITH ID VALIDATION)');
  console.log('📋 URL ID:', id);
  console.log('📋 Resource found:', resource ? { id: resource.id, type: resource.type, title: resource.title.substring(0, 50) + '...' } : 'null');
  console.log('📋 Loading:', loading);
  console.log('📋 Retrying:', retrying);
  console.log('📋 Error:', error);
  
  // ✅ NOVA VALIDAÇÃO: Log do resultado da validação de ID
  if (id) {
    const validation = idValidationService.validateId(id);
    console.log('📋 ID Validation:', validation);
  }
  
  console.groupEnd();

  const handleInvalidId = (invalidId: string, reason: string) => {
    console.log('🚨 Invalid ID detected in ResourceDetail:', { invalidId, reason });
    // O InvalidIdDetector já cuida do redirecionamento
  };

  // ✅ NOVA FUNCIONALIDADE: Detector de ID inválido
  return (
    <>
      <InvalidIdDetector onInvalidId={handleInvalidId} />
      
      {/* Enhanced loading with retry states */}
      {loading && (
        <>
          <Navigation />
          <EnhancedLoadingSkeleton 
            retrying={retrying} 
            message={retrying ? 'Aguardando dados serem carregados...' : 'Carregando recurso...'} 
          />
        </>
      )}
      
      {/* Resource not found - but provide more context */}
      {!loading && (!resource || error) && (
        <>
          <Navigation />
          <ResourceNotFound />
        </>
      )}

      {/* If podcast detected */}
      {!loading && resource && resource.type === 'podcast' && (
        <PodcastDetailView podcast={resource} />
      )}

      {/* Normal resource display */}
      {!loading && resource && resource.type !== 'podcast' && (
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
      )}
    </>
  );
};

export default ResourceDetail;
