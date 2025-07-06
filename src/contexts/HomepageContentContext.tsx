
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SearchResult } from '@/types/searchTypes';
import { newApiService } from '@/services/newApiService';

interface HomepageContent {
  videos: SearchResult[];
  books: SearchResult[];
  podcasts: SearchResult[];
}

interface HomepageContentContextType {
  content: HomepageContent;
  loading: boolean;
  error: string | null;
  retry: () => void;
  isUsingFallback: boolean;
}

const HomepageContentContext = createContext<HomepageContentContextType | undefined>(undefined);

export const useHomepageContentContext = () => {
  const context = useContext(HomepageContentContext);
  if (context === undefined) {
    throw new Error('useHomepageContentContext must be used within a HomepageContentProvider');
  }
  return context;
};

interface HomepageContentProviderProps {
  children: React.ReactNode;
}

// Mock/fallback data for when API fails
const FALLBACK_DATA: HomepageContent = {
  videos: [
    {
      id: 1001,
      originalId: 'fallback-video-1',
      title: 'Introdução ao Empreendedorismo Digital',
      author: 'Link Business School',
      year: 2024,
      description: 'Conteúdo introdutório sobre empreendedorismo no ambiente digital.',
      subject: 'Empreendedorismo',
      type: 'video',
      thumbnail: '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
      duration: '25m',
      embedUrl: '#'
    },
    {
      id: 1002,
      originalId: 'fallback-video-2',
      title: 'Estratégias de Marketing Digital',
      author: 'Link Business School',
      year: 2024,
      description: 'Aprenda as principais estratégias de marketing no ambiente digital.',
      subject: 'Marketing',
      type: 'video',
      thumbnail: '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
      duration: '30m',
      embedUrl: '#'
    }
  ],
  books: [
    {
      id: 2001,
      originalId: 'fallback-book-1',
      title: 'Fundamentos da Administração Moderna',
      author: 'Link Business School',
      year: 2024,
      description: 'Um guia completo sobre os princípios fundamentais da administração.',
      subject: 'Administração',
      type: 'titulo',
      thumbnail: '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
      pages: 250,
      pdfUrl: '#'
    },
    {
      id: 2002,
      originalId: 'fallback-book-2',
      title: 'Gestão Financeira para Pequenas Empresas',
      author: 'Link Business School',
      year: 2024,
      description: 'Estratégias de gestão financeira adaptadas para pequenos negócios.',
      subject: 'Finanças',
      type: 'titulo',
      thumbnail: '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
      pages: 180,
      pdfUrl: '#'
    }
  ],
  podcasts: [
    {
      id: 3001,
      originalId: 'fallback-podcast-1',
      title: 'Business Talks - Inovação no Mercado',
      author: 'Link Business School',
      year: 2024,
      description: 'Discussões sobre inovação e tendências do mercado empresarial.',
      subject: 'Negócios',
      type: 'podcast',
      thumbnail: '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
      duration: '45m',
      embedUrl: '#'
    },
    {
      id: 3002,
      originalId: 'fallback-podcast-2',
      title: 'Liderança e Gestão de Equipes',
      author: 'Link Business School',
      year: 2024,
      description: 'Como desenvolver habilidades de liderança e gerir equipes eficazes.',
      subject: 'Liderança',
      type: 'podcast',
      thumbnail: '/lovable-uploads/640f6a76-34b5-4386-a737-06a75b47393f.png',
      duration: '38m',
      embedUrl: '#'
    }
  ]
};

export const HomepageContentProvider: React.FC<HomepageContentProviderProps> = ({ children }) => {
  const [content, setContent] = useState<HomepageContent>({
    videos: [],
    books: [],
    podcasts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  console.group('🏠 HomepageContentProvider - Constructor');
  console.log('📊 Provider initialized at:', new Date().toISOString());
  console.log('🔄 Initial state:', { loading, error, isUsingFallback });
  console.groupEnd();

  const loadContent = async () => {
    console.group('🚀 HomepageContentProvider - loadContent');
    console.log('⏰ Load started at:', new Date().toISOString());
    console.log('🔄 Setting loading to true');
    
    setLoading(true);
    setError(null);
    setIsUsingFallback(false);

    try {
      console.log('📡 Calling newApiService.fetchHomepageContent()...');
      const homepageContent = await newApiService.fetchHomepageContent();
      
      console.log('✅ API Response received:', {
        videos: homepageContent.videos.length,
        books: homepageContent.books.length,
        podcasts: homepageContent.podcasts.length,
        totalItems: homepageContent.videos.length + homepageContent.books.length + homepageContent.podcasts.length
      });

      // If API returns empty data, use fallback
      const totalItems = homepageContent.videos.length + homepageContent.books.length + homepageContent.podcasts.length;
      if (totalItems === 0) {
        console.warn('⚠️ API returned empty data, using fallback');
        setContent(FALLBACK_DATA);
        setIsUsingFallback(true);
      } else {
        setContent(homepageContent);
        console.log('✅ Content set successfully from API');
      }
      
    } catch (err) {
      console.error('❌ API Error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace'
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load content';
      setError(errorMessage);
      
      console.log('🔄 Using fallback data due to API error');
      setContent(FALLBACK_DATA);
      setIsUsingFallback(true);
      
    } finally {
      console.log('🔄 Setting loading to false');
      setLoading(false);
      console.log('⏰ Load completed at:', new Date().toISOString());
      console.groupEnd();
    }
  };

  useEffect(() => {
    console.log('🎯 useEffect triggered - Starting content load');
    loadContent();
  }, []);

  const retry = () => {
    console.log('🔄 Retry requested by user');
    loadContent();
  };

  // Log context value changes
  useEffect(() => {
    console.log('📊 Context state updated:', {
      loading,
      error,
      isUsingFallback,
      contentSummary: {
        videos: content.videos.length,
        books: content.books.length,
        podcasts: content.podcasts.length
      }
    });
  }, [loading, error, isUsingFallback, content]);

  return (
    <HomepageContentContext.Provider
      value={{
        content,
        loading,
        error,
        retry,
        isUsingFallback
      }}
    >
      {children}
    </HomepageContentContext.Provider>
  );
};
