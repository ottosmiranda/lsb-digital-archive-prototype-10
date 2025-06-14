import { useState, useEffect } from 'react';
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

interface Resource {
  id: number;
  title: string;
  type: 'video' | 'titulo' | 'podcast';
  author: string;
  duration?: string;
  pages?: number;
  episodes?: number;
  thumbnail?: string;
  description: string;
  year: number;
  subject: string;
  fullDescription?: string;
  isbn?: string;
  publisher?: string;
  edition?: string;
  language?: string;
  tags?: string[];
  tableOfContents?: string[];
  transcript?: boolean;
}

const ResourceDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  // ALL HOOKS MUST BE CALLED AT THE TOP - BEFORE ANY CONDITIONAL LOGIC
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

  // NOW WE CAN DO CONDITIONAL LOGIC AFTER ALL HOOKS ARE CALLED
  
  // Find podcast by id (use type and id for precise matching, use "id" from route)
  const podcast =
    allData.find(
      (r) =>
        (r.type === "podcast") &&
        (r.id === Number(id) ||
          String(r.id) === id || // sometimes id might be string
          // Could be strings in the JSON keys, so allow for "pod001" style too:
          String(r.id).toLowerCase() === id?.toLowerCase()
        )
    ) || null;

  // If loading, show a skeleton as before
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="aspect-video bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If podcast detected (type: podcast) and there is a matching podcast in the data
  if (podcast && podcast.type === 'podcast') {
    // Custom podcast details UI
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-4xl mx-auto py-8 px-4 md:px-8">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Início</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/buscar">Buscar</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{podcast.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Back link */}
          <Link to="/buscar" className="inline-flex items-center text-lsb-primary mb-6 hover:text-lsb-primary/80">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos resultados
          </Link>

          {/* HERO */}
          <PodcastDetailHero
            cover={podcast.thumbnail}
            title={podcast.title}
            publisher={podcast.author}
            episodeCount={
              // fallback: try to parse episode count from duration, or set 1 if unknown
              podcast.duration?.match(/(\d+)/) ? Number(podcast.duration.match(/(\d+)/)?.[1]) : 1
            }
            year={podcast.year}
            categories={podcast.subject ? [podcast.subject] : []}
            description={podcast.description}
          />

          {/* Episodes List */}
          <PodcastEpisodeList
            total={
              podcast.duration?.match(/(\d+)/)
                ? Number(podcast.duration.match(/(\d+)/)?.[1])
                : 1
            }
            podcastTitle={podcast.title}
          />
        </div>
        <Footer />
      </div>
    );
  }

  if (resourceLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="aspect-video bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Recurso não encontrado</h1>
            <Link to="/buscar">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar à busca
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Vídeo';
      case 'titulo': return 'Livro';
      case 'podcast': return 'Podcast';
      default: return 'Recurso';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800';
      case 'titulo': return 'bg-blue-100 text-blue-800';
      case 'podcast': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderMediaSection = () => {
    if (resource.type === 'video') {
      return (
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <img
                src={resource.thumbnail}
                alt={resource.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button size="lg" className="bg-white/90 text-black hover:bg-white">
                  <Play className="h-6 w-6 mr-2" />
                  Reproduzir
                </Button>
              </div>
              {resource.duration && (
                <div className="absolute bottom-4 right-4 bg-black/80 text-white text-sm px-2 py-1 rounded">
                  <Clock className="inline h-3 w-3 mr-1" />
                  {resource.duration}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (resource.type === 'titulo') {
      return (
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden max-w-md mx-auto">
              <img
                src={resource.thumbnail}
                alt={resource.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <div className="text-white text-sm">
                  <BookOpen className="inline h-3 w-3 mr-1" />
                  {resource.pages} páginas
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (resource.type === 'podcast') {
      return (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src={resource.thumbnail}
                  alt={resource.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                    <Play className="h-5 w-5 mr-2" />
                    Ouvir Agora
                  </Button>
                  <div className="text-sm text-gray-600">
                    <Volume2 className="inline h-3 w-3 mr-1" />
                    {resource.episodes} episódios
                  </div>
                </div>
                <div className="bg-gray-100 rounded-full h-2 mb-2">
                  <div className="bg-purple-600 h-2 rounded-full w-1/3"></div>
                </div>
                <div className="text-sm text-gray-600">15:23 / {resource.duration}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  const renderActionButtons = () => {
    if (resource.type === 'video') {
      return (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Button className="w-full bg-red-600 hover:bg-red-700">
              <Play className="h-4 w-4 mr-2" />
              Assistir Agora
            </Button>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" className="w-full">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (resource.type === 'titulo') {
      return (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <BookOpen className="h-4 w-4 mr-2" />
              Ler Online
            </Button>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" className="w-full">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (resource.type === 'podcast') {
      return (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <Headphones className="h-4 w-4 mr-2" />
              Ouvir Agora
            </Button>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Episódios
            </Button>
            {resource.transcript && (
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Ver Transcrição
              </Button>
            )}
            <Button variant="outline" className="w-full">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </CardContent>
        </Card>
      );
    }
  };

  const renderResourceInfo = () => (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3">Informações do Recurso</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-gray-600">Autor:</span>
            <span className="ml-1 font-medium">{resource.author}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-gray-600">Ano:</span>
            <span className="ml-1 font-medium">{resource.year}</span>
          </div>
          <div className="flex items-center">
            <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-gray-600">Assunto:</span>
            <span className="ml-1 font-medium">{resource.subject}</span>
          </div>
          
          {resource.type === 'video' && resource.duration && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-gray-600">Duração:</span>
              <span className="ml-1 font-medium">{resource.duration}</span>
            </div>
          )}
          
          {resource.type === 'titulo' && (
            <>
              {resource.pages && (
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">Páginas:</span>
                  <span className="ml-1 font-medium">{resource.pages}</span>
                </div>
              )}
              {resource.isbn && (
                <div className="flex items-center">
                  <span className="text-gray-600">ISBN:</span>
                  <span className="ml-1 font-medium">{resource.isbn}</span>
                </div>
              )}
              {resource.publisher && (
                <div className="flex items-center">
                  <span className="text-gray-600">Editora:</span>
                  <span className="ml-1 font-medium">{resource.publisher}</span>
                </div>
              )}
              {resource.edition && (
                <div className="flex items-center">
                  <span className="text-gray-600">Edição:</span>
                  <span className="ml-1 font-medium">{resource.edition}</span>
                </div>
              )}
            </>
          )}
          
          {resource.type === 'podcast' && (
            <>
              {resource.episodes && (
                <div className="flex items-center">
                  <Headphones className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">Episódios:</span>
                  <span className="ml-1 font-medium">{resource.episodes}</span>
                </div>
              )}
              {resource.transcript && (
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">Transcrição:</span>
                  <span className="ml-1 font-medium">Disponível</span>
                </div>
              )}
            </>
          )}
          
          {resource.language && (
            <div className="flex items-center">
              <span className="text-gray-600">Idioma:</span>
              <span className="ml-1 font-medium">{resource.language}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Início</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/buscar">Buscar</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{resource.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back Button */}
        <Link to="/buscar" className="inline-flex items-center text-lsb-primary hover:text-lsb-primary/80 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos resultados
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Media Section */}
            {renderMediaSection()}

            {/* Title and Description */}
            <div className="space-y-4">
              <div>
                <Badge className={`${getTypeBadgeColor(resource.type)} mb-2`}>
                  {resource.type === 'video' && <Play className="h-3 w-3 mr-1" />}
                  {resource.type === 'titulo' && <BookOpen className="h-3 w-3 mr-1" />}
                  {resource.type === 'podcast' && <Headphones className="h-3 w-3 mr-1" />}
                  {getTypeLabel(resource.type)}
                </Badge>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{resource.title}</h1>
                <p className="text-lg text-gray-600">{resource.description}</p>
              </div>

              {resource.fullDescription && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Descrição Completa</h2>
                  <p className="text-gray-700 leading-relaxed">{resource.fullDescription}</p>
                </div>
              )}

              {resource.type === 'titulo' && resource.tableOfContents && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Sumário</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {resource.tableOfContents.map((chapter, index) => (
                      <li key={index}>{chapter}</li>
                    ))}
                  </ul>
                </div>
              )}

              {resource.tags && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons */}
            {renderActionButtons()}

            {/* Resource Info */}
            {renderResourceInfo()}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ResourceDetail;
