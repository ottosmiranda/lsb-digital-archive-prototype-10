
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
import { useProgressiveDataLoader } from '@/hooks/useProgressiveDataLoader';
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
  const { allData, loading, dataLoaded, loadData } = useProgressiveDataLoader();
  
  // Load data on mount
  useEffect(() => {
    if (!dataLoaded && !loading) {
      console.log('🔄 ResourceDetail: Loading data on mount');
      loadData();
    }
  }, [dataLoaded, loading, loadData]);
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

      console.log('🔍 Looking for resource with ID:', id);
      console.log('📊 Available data:', allData.length, 'items');

      // Log all available resources for debugging
      console.log('📋 Available resources:', allData.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        originalId: (item as any).originalId || 'N/A'
      })));

      // First try to find by exact ID match
      let foundResource = allData.find(item => String(item.id) === id);

      // If not found by exact ID, try to find by originalId for videos
      if (!foundResource) {
        console.log('🔍 Trying to find by originalId for videos...');
        foundResource = allData.find(item => 
          item.type === 'video' && (item as any).originalId === id
        );
      }

      // If still not found, try title-based search as fallback
      if (!foundResource) {
        console.log('🔍 Trying title-based search as fallback...');
        const searchId = parseInt(id || '0');
        
        if (searchId >= 1000) {
          // Look for videos with similar IDs
          const videos = allData.filter(item => item.type === 'video');
          console.log('🎬 Found videos:', videos.length);
          
          if (videos.length > 0) {
            // Try to find closest match or use first video as fallback
            foundResource = videos.find(v => v.id === searchId) || videos[0];
            if (foundResource) {
              console.log('🎯 Using video fallback:', foundResource.title);
            }
          }
        }
      }

      if (foundResource) {
        console.log('✅ Found resource:', foundResource.title, 'ID:', foundResource.id);
        
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
          embedUrl: foundResource.embedUrl,
          pdfUrl: foundResource.pdfUrl,
          fullDescription: foundResource.description,
          tags: foundResource.subject ? [foundResource.subject] : undefined
        };

        console.log('🔄 Setting converted resource:', convertedResource);
        setResource(convertedResource);
      } else {
        console.log('❌ Resource not found for ID:', id);
        setResource(null);
      }
      
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <ActionButtons resource={resource} />
            <ResourceInfo resource={resource} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResourceDetail;
