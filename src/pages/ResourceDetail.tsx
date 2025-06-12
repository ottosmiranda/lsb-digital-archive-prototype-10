
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, Download, Share2, Clock, User, Calendar, BookOpen } from 'lucide-react';
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

interface Resource {
  id: number;
  title: string;
  type: 'video' | 'titulo' | 'podcast';
  author: string;
  duration?: string;
  pages?: number;
  thumbnail?: string;
  description: string;
  year: number;
  subject: string;
  fullDescription?: string;
  isbn?: string;
  publisher?: string;
  language?: string;
  tags?: string[];
}

const ResourceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch resource details
    const fetchResource = () => {
      setTimeout(() => {
        const mockResource: Resource = {
          id: parseInt(id || '1'),
          title: 'Introdução à Libras - Curso Completo',
          type: 'video',
          author: 'Prof. Maria Silva',
          duration: '25:30',
          thumbnail: '/placeholder.svg',
          description: 'Curso básico de Língua Brasileira de Sinais para iniciantes.',
          fullDescription: 'Este curso completo de Língua Brasileira de Sinais (Libras) foi desenvolvido especialmente para iniciantes que desejam aprender a se comunicar com a comunidade surda. O curso aborda desde os conceitos básicos até conversações mais complexas, incluindo vocabulário essencial, gramática e aspectos culturais da comunidade surda brasileira.',
          year: 2023,
          subject: 'Educação',
          language: 'Português',
          tags: ['Libras', 'Educação Inclusiva', 'Comunicação', 'Acessibilidade']
        };
        setResource(mockResource);
        setLoading(false);
      }, 500);
    };

    fetchResource();
  }, [id]);

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
            {/* Media Preview */}
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <img
                    src={resource.thumbnail}
                    alt={resource.title}
                    className="w-full h-full object-cover"
                  />
                  {resource.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button size="lg" className="bg-white/90 text-black hover:bg-white">
                        <Play className="h-6 w-6 mr-2" />
                        Reproduzir
                      </Button>
                    </div>
                  )}
                  {resource.duration && (
                    <div className="absolute bottom-4 right-4 bg-black/80 text-white text-sm px-2 py-1 rounded">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {resource.duration}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Title and Description */}
            <div className="space-y-4">
              <div>
                <Badge className={`${getTypeBadgeColor(resource.type)} mb-2`}>
                  {resource.type === 'video' && <Play className="h-3 w-3 mr-1" />}
                  {resource.type === 'titulo' && <BookOpen className="h-3 w-3 mr-1" />}
                  {resource.type === 'podcast' && <Play className="h-3 w-3 mr-1" />}
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
            <Card>
              <CardContent className="p-4 space-y-3">
                <Button className="w-full bg-lsb-primary hover:bg-lsb-primary/90">
                  {resource.type === 'video' && (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Assistir Agora
                    </>
                  )}
                  {resource.type === 'titulo' && (
                    <>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Ler Agora
                    </>
                  )}
                  {resource.type === 'podcast' && (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Ouvir Agora
                    </>
                  )}
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

            {/* Resource Info */}
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
                  {resource.duration && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">Duração:</span>
                      <span className="ml-1 font-medium">{resource.duration}</span>
                    </div>
                  )}
                  {resource.pages && (
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-600">Páginas:</span>
                      <span className="ml-1 font-medium">{resource.pages}</span>
                    </div>
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
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ResourceDetail;
