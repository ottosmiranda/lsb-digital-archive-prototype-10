
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

  // Effect for fetching fallback resource data
  useEffect(() => {
    const fetchResource = () => {
      setTimeout(() => {
        const resourceId = parseInt(id || '1');
        const resourceType = resourceId % 3 === 0 ? 'podcast' : resourceId % 2 === 0 ? 'titulo' : 'video';
        
        let mockResource: Resource;

        if (resourceType === 'video') {
          mockResource = {
            id: resourceId,
            title: 'Introdução à Libras - Curso Completo',
            type: 'video',
            author: 'Prof. Maria Silva',
            duration: '25:30',
            thumbnail: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80',
            description: 'Curso básico de Língua Brasileira de Sinais para iniciantes.',
            fullDescription: 'Este curso completo de Língua Brasileira de Sinais (Libras) foi desenvolvido especialmente para iniciantes que desejam aprender a se comunicar com a comunidade surda. O curso aborda desde os conceitos básicos até conversações mais complexas, incluindo vocabulário essencial, gramática e aspectos culturais da comunidade surda brasileira.',
            year: 2023,
            subject: 'Educação',
            language: 'Português',
            tags: ['Libras', 'Educação Inclusiva', 'Comunicação', 'Acessibilidade']
          };
        } else if (resourceType === 'titulo') {
          mockResource = {
            id: resourceId,
            title: 'Fundamentos da Educação Inclusiva',
            type: 'titulo',
            author: 'Dr. João Santos',
            pages: 280,
            thumbnail: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=600&q=80',
            description: 'Guia completo sobre práticas de educação inclusiva no Brasil.',
            fullDescription: 'Este livro oferece uma visão abrangente sobre os fundamentos da educação inclusiva, apresentando teorias, práticas e metodologias para criar ambientes educacionais acessíveis e inclusivos. Aborda desde a legislação brasileira até estratégias práticas para professores e gestores educacionais.',
            year: 2022,
            subject: 'Educação',
            language: 'Português',
            isbn: '978-85-7522-123-4',
            publisher: 'Editora Educação',
            edition: '2ª edição',
            tableOfContents: [
              'Capítulo 1: História da Educação Inclusiva',
              'Capítulo 2: Marco Legal e Normativo',
              'Capítulo 3: Metodologias Inclusivas',
              'Capítulo 4: Tecnologias Assistivas',
              'Capítulo 5: Formação de Professores'
            ],
            tags: ['Educação Inclusiva', 'Metodologia', 'Acessibilidade', 'Formação']
          };
        } else {
          mockResource = {
            id: resourceId,
            title: 'Podcast Inclusão e Tecnologia',
            type: 'podcast',
            author: 'Ana Costa',
            duration: '45:00',
            episodes: 24,
            thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
            description: 'Discussões sobre tecnologia assistiva e inclusão digital.',
            fullDescription: 'Um podcast semanal que explora as intersecções entre tecnologia e inclusão, apresentando entrevistas com especialistas, discussões sobre inovações em tecnologia assistiva e histórias inspiradoras de pessoas que usam tecnologia para superar barreiras.',
            year: 2023,
            subject: 'Tecnologia',
            language: 'Português',
            transcript: true,
            tags: ['Tecnologia Assistiva', 'Inclusão Digital', 'Inovação', 'Entrevistas']
          };
        }

        setResource(mockResource);
        setResourceLoading(false);
      }, 500);
    };

    fetchResource();
  }, [id]);

  // Find podcast by id (fix to cast episodes as number)
  const podcastResult = allData.find((r) => {
    if (r.type !== "podcast") return false;
    if (String(r.id) === id) return true;
    const routeId = parseInt(id || '0');
    if (routeId > 0) {
      const podcastsOnly = allData.filter(item => item.type === "podcast");
      const podcastIndex = routeId - 1;
      if (podcastIndex >= 0 && podcastIndex < podcastsOnly.length) {
        return r === podcastsOnly[podcastIndex];
      }
    }
    return false;
  }) || null;

  // Convert podcastResult to Resource if needed
  const podcast: Resource | null = podcastResult
    ? {
        ...podcastResult,
        episodes: podcastResult.episodes
          ? Number(
              typeof podcastResult.episodes === "string"
                ? podcastResult.episodes.replace(/\D/g, "") // extract only numbers
                : podcastResult.episodes
            ) || undefined
          : undefined,
      }
    : null;

  // Loading skeletons
  if (loading) return <><Navigation /><LoadingSkeleton /></>;
  if (resourceLoading) return <><Navigation /><LoadingSkeleton /></>;
  if (!resource) return <><Navigation /><ResourceNotFound /></>;

  // If podcast detected (either from real data OR mock data with type 'podcast')
  if ((podcast && podcast.type === 'podcast') || resource.type === 'podcast') {
    const podcastToRender = podcast || resource;
    return <PodcastDetailView podcast={podcastToRender} />;
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
