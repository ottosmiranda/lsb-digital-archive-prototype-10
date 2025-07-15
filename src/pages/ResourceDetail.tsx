
import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  
  // ✅ FASE 3: Extrair tipo dos search params (vem da navegação otimizada)
  const typeFromUrl = searchParams.get('tipo');
  
  const { resource, loading, error, retrying } = useResourceById(id, typeFromUrl || undefined);

  // Scroll to top when component mounts or when resource changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id, resource]);

  console.group('🎯 RESOURCE DETAIL DEBUG (NAVEGAÇÃO OTIMIZADA COM TIPO)');
  console.log('📋 URL ID:', id);
  console.log('📋 Type from search params:', typeFromUrl);
  console.log('📋 Resource found:', resource ? { id: resource.id, type: resource.type, title: resource.title.substring(0, 50) + '...' } : 'null');
  console.log('📋 Loading:', loading);
  console.log('📋 Retrying:', retrying);
  console.log('📋 Error:', error);
  console.log('📋 Optimized lookup:', typeFromUrl ? 'YES (single API call expected)' : 'NO (fallback to sequential)');
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
            <div className="py-4 md:py-8 pb-20 md:pb-[100px]">
              <div className="px-4 md:px-0">
                <ResourceBreadcrumb title={resource.title} />
                <BackButton />
              </div>

              {/* Mobile-first responsive grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 px-4 md:px-0">
                {/* Main Content - Full width on mobile, 2/3 on desktop */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                  <ResourceContent resource={resource} />
                  <MediaSection resource={resource} />
                </div>
                
                {/* Sidebar - Full width on mobile, 1/3 on desktop */}
                <div className="space-y-4 md:space-y-6">
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
