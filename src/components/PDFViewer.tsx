
import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Maximize2, Minimize2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
}

type ViewerStrategy = 'iframe' | 'pdfjs' | 'download';

const PDFViewer = ({ pdfUrl, title }: PDFViewerProps) => {
  const [strategy, setStrategy] = useState<ViewerStrategy>('iframe');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);

  // Check browser PDF support
  const checkPDFSupport = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = userAgent.includes('chrome');
    const isFirefox = userAgent.includes('firefox');
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    const isEdge = userAgent.includes('edge');
    
    return isChrome || isFirefox || isSafari || isEdge;
  }, []);

  // Enhanced PDF URL with viewer parameters
  const getEnhancedPdfUrl = useCallback(() => {
    const baseUrl = pdfUrl;
    const params = new URLSearchParams();
    
    // Add PDF viewer parameters for better display
    params.set('toolbar', '1');
    params.set('navpanes', '1');
    params.set('scrollbar', '1');
    params.set('view', 'FitH');
    
    return `${baseUrl}#${params.toString()}`;
  }, [pdfUrl]);

  // Handle iframe load success
  const handleIframeLoad = useCallback(() => {
    console.log('✅ PDF iframe loaded successfully');
    setIframeLoaded(true);
    setLoading(false);
    setError(null);
  }, []);

  // Handle iframe load error
  const handleIframeError = useCallback(() => {
    console.error('❌ PDF iframe failed to load, trying PDF.js fallback');
    setError('Erro ao carregar PDF via iframe');
    
    if (strategy === 'iframe') {
      console.log('🔄 Switching to PDF.js strategy');
      setStrategy('pdfjs');
      setLoading(true);
    } else if (strategy === 'pdfjs') {
      console.log('🔄 All strategies failed, showing download option');
      setStrategy('download');
      setLoading(false);
    }
  }, [strategy]);

  // Initialize viewer
  useEffect(() => {
    console.log('🔄 Initializing PDF viewer with strategy:', strategy);
    console.log('📄 PDF URL:', pdfUrl);
    
    setLoading(true);
    setError(null);
    setIframeLoaded(false);

    // Check if browser supports PDF viewing
    if (!checkPDFSupport() && strategy === 'iframe') {
      console.warn('⚠️ Browser may not support PDF viewing, switching to download');
      setStrategy('download');
      setLoading(false);
      return;
    }

    // Set timeout for loading state
    const timeout = setTimeout(() => {
      if (loading && strategy === 'iframe') {
        console.warn('⚠️ PDF taking too long to load, trying fallback');
        handleIframeError();
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeout);
  }, [strategy, pdfUrl, loading, checkPDFSupport, handleIframeError]);

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const downloadPDF = () => {
    console.log('📥 Downloading PDF:', pdfUrl);
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title}.pdf`;
    link.target = '_blank';
    link.click();
  };

  const openInNewTab = () => {
    console.log('🔗 Opening PDF in new tab:', pdfUrl);
    window.open(pdfUrl, '_blank');
  };

  // Render based on current strategy
  const renderViewer = () => {
    switch (strategy) {
      case 'iframe':
        return (
          <div className={`overflow-hidden ${isFullscreen ? 'h-screen' : 'h-96'} bg-gray-100 relative`}>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Carregando PDF...</p>
                  <p className="text-xs text-gray-500 mt-1">Estratégia: Iframe nativo</p>
                </div>
              </div>
            )}
            <iframe
              src={getEnhancedPdfUrl()}
              title={title}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{ display: iframeLoaded ? 'block' : 'none' }}
            />
          </div>
        );

      case 'pdfjs':
        return (
          <div className={`overflow-hidden ${isFullscreen ? 'h-screen' : 'h-96'} bg-gray-100 relative`}>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Carregando PDF...</p>
                  <p className="text-xs text-gray-500 mt-1">Estratégia: PDF.js via CDN</p>
                </div>
              </div>
            )}
            <iframe
              src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`}
              title={title}
              className="w-full h-full border-0"
              onLoad={() => {
                console.log('✅ PDF.js viewer loaded successfully');
                setLoading(false);
                setError(null);
              }}
              onError={handleIframeError}
            />
          </div>
        );

      case 'download':
        return (
          <div className={`${isFullscreen ? 'h-screen' : 'h-96'} flex items-center justify-center bg-gray-50`}>
            <div className="text-center p-8">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Visualização não disponível
              </h3>
              <p className="text-gray-600 mb-6">
                O PDF não pôde ser carregado no navegador. Use as opções abaixo para acessar o arquivo.
              </p>
              <div className="space-x-3">
                <Button onClick={downloadPDF} variant="default">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button onClick={openInNewTab} variant="outline">
                  Abrir em nova aba
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={`mb-6 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <CardContent className="p-0">
        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-xs">
              {strategy === 'iframe' && 'Visualizador Nativo'}
              {strategy === 'pdfjs' && 'PDF.js'}
              {strategy === 'download' && 'Download Apenas'}
            </Badge>
            {error && (
              <Badge variant="destructive" className="text-xs">
                Erro de Carregamento
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={downloadPDF} size="sm" variant="outline">
              <Download className="h-4 w-4" />
            </Button>
            <Button onClick={openInNewTab} size="sm" variant="outline">
              Abrir em nova aba
            </Button>
            <Button onClick={toggleFullscreen} size="sm" variant="outline">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* PDF Display */}
        {renderViewer()}
      </CardContent>
    </Card>
  );
};

export default PDFViewer;
