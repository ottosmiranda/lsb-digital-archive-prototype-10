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

  useEffect(() => {
    const findResource = () => {
      if (!allData || allData.length === 0) {
        setResourceLoading(false);
        return;
      }

      console.log('Looking for resource with ID:', id);
      console.log('Available data:', allData.length, 'items');

      // First try to find by exact ID match
      let foundResource = allData.find(item => String(item.id) === id);

      // If not found by exact ID, try route-based mapping
      if (!foundResource) {
        const routeId = parseInt(id || '0');
        console.log('Trying route-based mapping for ID:', routeId);

        if (routeId >= 11 && routeId <= 20) {
          // Route IDs 11-20 should map to videos (aulas)
          const videos = allData.filter(item => item.type === 'video');
          console.log('Found videos:', videos.length);
          const videoIndex = routeId - 11; // 11 maps to index 0, 12 to index 1, etc.
          if (videoIndex >= 0 && videoIndex < videos.length) {
            foundResource = videos[videoIndex];
            console.log('Found video by route mapping:', foundResource.title);
          }
        } else if (routeId >= 1 && routeId <= 10) {
          // Route IDs 1-10 should map to podcasts
          const podcasts = allData.filter(item => item.type === 'podcast');
          const podcastIndex = routeId - 1;
          if (podcastIndex >= 0 && podcastIndex < podcasts.length) {
            foundResource = podcasts[podcastIndex];
          }
        }
      }

      if (foundResource) {
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
          pdfUrl: foundResource.pdfUrl, // Add pdfUrl from SearchResult
          fullDescription: foundResource.description, // Use description as fullDescription for now
          tags: foundResource.subject ? [foundResource.subject] : undefined
        };

        console.log('Setting converted resource:', convertedResource);
        setResource(convertedResource);
      } else {
        console.log('Resource not found');
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
