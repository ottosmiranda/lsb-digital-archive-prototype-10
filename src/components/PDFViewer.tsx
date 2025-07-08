
import React, { useState, useCallback, useEffect } from 'react';
import { Download, Maximize2, Minimize2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buildProxyPDFUrl, logPDFEvent } from '@/utils/pdfUtils';

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
}

type ViewerStrategy = 'proxy' | 'google-docs' | 'direct' | 'download';

const PDFViewer = ({ pdfUrl, title }: PDFViewerProps) => {
  const [strategy, setStrategy] = useState<ViewerStrategy>('proxy');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get the appropriate URL based on strategy
  const getPDFUrl = useCallback(() => {
    switch (strategy) {
      case 'proxy':
        return buildProxyPDFUrl(pdfUrl);
      case 'google-docs':
        return `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
      case 'direct':
        return pdfUrl;
      default:
        return pdfUrl;
    }
  }, [strategy, pdfUrl]);

  // Handle iframe load success
  const handleIframeLoad = useCallback(() => {
    logPDFEvent('PDF loaded successfully', { strategy, url: getPDFUrl() });
    setLoading(false);
    setError(null);
  }, [strategy, getPDFUrl]);

  // Handle iframe load error
  const handleIframeError = useCallback(() => {
    logPDFEvent('PDF load failed', { strategy, url: getPDFUrl() });
    
    if (strategy === 'proxy') {
      logPDFEvent('Switching to Google Docs viewer fallback');
      setStrategy('google-docs');
      setLoading(true);
      setError(null);
    } else if (strategy === 'google-docs') {
      logPDFEvent('Switching to direct PDF fallback');
      setStrategy('direct');
      setLoading(true);
      setError(null);
    } else if (strategy === 'direct') {
      logPDFEvent('All strategies failed, showing download option');
      setStrategy('download');
      setLoading(false);
      setError('Não foi possível carregar o PDF no navegador');
    }
  }, [strategy, getPDFUrl]);

  // Initialize viewer
  useEffect(() => {
    logPDFEvent('Initializing PDF viewer', { 
      strategy, 
      originalUrl: pdfUrl,
      viewerUrl: getPDFUrl()
    });
    
    setLoading(true);
    setError(null);

    // Set timeout for loading state
    const timeout = setTimeout(() => {
      if (loading && strategy !== 'download') {
        logPDFEvent('PDF loading timeout', { strategy });
        handleIframeError();
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeout);
  }, [strategy, pdfUrl, getPDFUrl, loading, handleIframeError]);

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const downloadPDF = () => {
    logPDFEvent('Downloading PDF', { url: pdfUrl });
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title}.pdf`;
    link.target = '_blank';
    link.click();
  };

  const openInNewTab = () => {
    logPDFEvent('Opening PDF in new tab', { url: pdfUrl });
    window.open(pdfUrl, '_blank');
  };

  const retryLoading = () => {
    logPDFEvent('Retrying PDF load', { strategy });
    setLoading(true);
    setError(null);
    // Reset to proxy strategy
    setStrategy('proxy');
  };

  // Render based on current strategy
  const renderViewer = () => {
    if (strategy === 'download') {
      return (
        <div className={`${isFullscreen ? 'h-screen' : 'h-[500px]'} flex items-center justify-center bg-gray-50`}>
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
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir em nova aba
              </Button>
              <Button onClick={retryLoading} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`overflow-hidden ${isFullscreen ? 'h-screen' : 'h-[500px]'} bg-gray-100 relative`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Carregando PDF...</p>
              <p className="text-xs text-gray-500 mt-1">
                Estratégia: {strategy === 'proxy' ? 'Proxy Supabase' : 
                            strategy === 'google-docs' ? 'Google Docs Viewer' : 
                            'Acesso Direto'}
              </p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
            <div className="text-center p-4">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <Button onClick={retryLoading} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </div>
        )}
        <iframe
          key={`${strategy}-${Date.now()}`}
          src={getPDFUrl()}
          title={title}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{ display: loading ? 'none' : 'block' }}
        />
      </div>
    );
  };

  const getStrategyLabel = () => {
    switch (strategy) {
      case 'proxy': return 'Proxy Supabase';
      case 'google-docs': return 'Google Docs Viewer';
      case 'direct': return 'Acesso Direto';
      case 'download': return 'Download Apenas';
      default: return strategy;
    }
  };

  return (
    <Card className={`mb-6 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <CardContent className="p-0">
        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-xs">
              {getStrategyLabel()}
            </Badge>
            {error && (
              <Badge variant="destructive" className="text-xs">
                Erro de Carregamento
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={downloadPDF} size="sm" variant="outline" title="Baixar PDF">
              <Download className="h-4 w-4" />
            </Button>
            <Button onClick={openInNewTab} size="sm" variant="outline" title="Abrir em nova aba">
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button onClick={toggleFullscreen} size="sm" variant="outline" title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
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
