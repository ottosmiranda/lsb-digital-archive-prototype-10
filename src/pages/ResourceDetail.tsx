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

      console.group('🔍 RESOURCE SEARCH DEBUG');
      console.log('🎯 Target ID:', id);
      console.log('📊 Total available data:', allData.length, 'items');

      // Enhanced debugging - show all video IDs
      const videos = allData.filter(item => item.type === 'video');
      console.log('🎬 Available videos:', videos.length);
      console.log('🎬 Video ID samples:', videos.slice(0, 10).map(v => ({
        id: v.id,
        originalId: v.originalId,
        title: v.title.substring(0, 40) + '...'
      })));

      // PHASE 1: Direct ID match (most reliable)
      console.log('🔍 Phase 1: Searching by exact ID match...');
      let foundResource = allData.find(item => String(item.id) === id);
      
      if (foundResource) {
        console.log('✅ Phase 1 SUCCESS: Found by exact ID', {
          id: foundResource.id,
          type: foundResource.type,
          title: foundResource.title
        });
      } else {
        console.log('❌ Phase 1 FAILED: No exact ID match');
        
        // PHASE 2: originalId match for videos (UUID from API)
        console.log('🔍 Phase 2: Searching by originalId for videos...');
        foundResource = allData.find(item => 
          item.type === 'video' && (item as any).originalId === id
        );
        
        if (foundResource) {
          console.log('✅ Phase 2 SUCCESS: Found by originalId', {
            id: foundResource.id,
            originalId: (foundResource as any).originalId,
            type: foundResource.type,
            title: foundResource.title
          });
        } else {
          console.log('❌ Phase 2 FAILED: No originalId match');
          
          // PHASE 3: Smart numerical ID matching
          console.log('🔍 Phase 3: Smart numerical ID matching...');
          const numericId = parseInt(id || '0');
          
          if (numericId >= 1000) {
            // Look for videos with closest ID match
            const videoMatches = videos
              .map(v => ({ 
                video: v, 
                distance: Math.abs(v.id - numericId) 
              }))
              .sort((a, b) => a.distance - b.distance);
            
            if (videoMatches.length > 0 && videoMatches[0].distance < 1000) {
              foundResource = videoMatches[0].video;
              console.log('✅ Phase 3 SUCCESS: Found closest video match', {
                targetId: numericId,
                foundId: foundResource.id,
                distance: videoMatches[0].distance,
                title: foundResource.title
              });
            } else {
              console.log('❌ Phase 3 FAILED: No close video match');
            }
          }
        }
      }

      if (foundResource) {
        console.log('🎉 FINAL RESULT: Resource found!', {
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
          tags: foundResource.subject ? [foundResource.subject] : undefined,
          language: (foundResource as any).language,
          documentType: (foundResource as any).documentType,
          categories: (foundResource as any).categories
        };

        console.log('🔄 Final converted resource:', {
          id: convertedResource.id,
          type: convertedResource.type,
          hasEmbedUrl: !!convertedResource.embedUrl,
          embedUrl: convertedResource.embedUrl?.substring(0, 50) + '...'
        });
        setResource(convertedResource);
      } else {
        console.log('💀 TOTAL FAILURE: Resource not found for ID:', id);
        console.log('🔍 Available ID ranges:', {
          videos: videos.length > 0 ? {
            minId: Math.min(...videos.map(v => v.id)),
            maxId: Math.max(...videos.map(v => v.id)),
            sampleIds: videos.slice(0, 5).map(v => v.id)
          } : 'No videos',
          allTypes: {
            minId: Math.min(...allData.map(v => v.id)),
            maxId: Math.max(...allData.map(v => v.id))
          }
        });
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
  if (!resource) return <><Navigation /><ResourceNotFound /></>;

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
          {/* Main Content - Ordem alterada: ResourceContent primeiro, MediaSection depois */}
          <div className="lg:col-span-2">
            <ResourceContent resource={resource} />
            <MediaSection resource={resource} />
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
