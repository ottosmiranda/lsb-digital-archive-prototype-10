
import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Download, Maximize2, Minimize2, AlertCircle, RefreshCw, ExternalLink, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { logPDFEvent } from '@/utils/pdfUtils';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
}

const PDFViewer = ({ pdfUrl, title }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [fallbackMode, setFallbackMode] = useState<boolean>(false);

  // Handle document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    logPDFEvent('PDF loaded successfully', { pages: numPages, url: pdfUrl });
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, [pdfUrl]);

  // Handle document load error
  const onDocumentLoadError = useCallback((error: Error) => {
    logPDFEvent('PDF load failed', { error: error.message, url: pdfUrl });
    setLoading(false);
    setError('Não foi possível carregar o PDF');
    setFallbackMode(true);
  }, [pdfUrl]);

  // Handle page change
  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
    }
  };

  // Handle zoom
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

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
    logPDFEvent('Retrying PDF load');
    setLoading(true);
    setError(null);
    setFallbackMode(false);
    setPageNumber(1);
  };

  // Fallback viewer using Google Docs
  const renderFallbackViewer = () => {
    if (fallbackMode) {
      return (
        <div className={`${isFullscreen ? 'h-screen' : 'h-[600px]'} overflow-hidden bg-gray-100 relative`}>
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
            title={title}
            className="w-full h-full border-0"
            onLoad={() => {
              setLoading(false);
              setError(null);
            }}
            onError={() => {
              setError('Visualização não disponível. Use as opções de download.');
            }}
          />
        </div>
      );
    }

    return (
      <div className={`${isFullscreen ? 'h-screen' : 'h-[600px]'} flex items-center justify-center bg-gray-50`}>
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Visualização não disponível
          </h3>
          <p className="text-gray-600 mb-6">
            O PDF não pôde ser carregado. Use as opções abaixo para acessar o arquivo.
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
  };

  // Main PDF viewer
  const renderPDFViewer = () => {
    return (
      <div className={`${isFullscreen ? 'h-screen' : 'h-[600px]'} bg-gray-100 relative overflow-auto`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Carregando PDF...</p>
            </div>
          </div>
        )}
        
        <div className="flex justify-center p-4">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
            error=""
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              loading=""
              error=""
              className="shadow-lg"
            />
          </Document>
        </div>
      </div>
    );
  };

  return (
    <Card className={`mb-6 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <CardContent className="p-0">
        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-xs">
              {fallbackMode ? 'Google Docs Viewer' : 'React PDF'}
            </Badge>
            {numPages > 0 && !fallbackMode && (
              <Badge variant="secondary" className="text-xs">
                Página {pageNumber} de {numPages}
              </Badge>
            )}
            {error && !fallbackMode && (
              <Badge variant="destructive" className="text-xs">
                Erro de Carregamento
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Navigation Controls - only show for react-pdf mode */}
            {numPages > 0 && !fallbackMode && (
              <>
                <Button 
                  onClick={() => goToPage(pageNumber - 1)} 
                  size="sm" 
                  variant="outline" 
                  disabled={pageNumber <= 1}
                  title="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center space-x-1">
                  <Input
                    type="number"
                    min={1}
                    max={numPages}
                    value={pageNumber}
                    onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                    className="w-16 h-8 text-center text-sm"
                  />
                  <span className="text-sm text-gray-500">/ {numPages}</span>
                </div>
                
                <Button 
                  onClick={() => goToPage(pageNumber + 1)} 
                  size="sm" 
                  variant="outline" 
                  disabled={pageNumber >= numPages}
                  title="Próxima página"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                {/* Zoom Controls */}
                <Button onClick={zoomOut} size="sm" variant="outline" title="Diminuir zoom">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 px-2">{Math.round(scale * 100)}%</span>
                <Button onClick={zoomIn} size="sm" variant="outline" title="Aumentar zoom">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Action buttons */}
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
        {error && !fallbackMode ? renderFallbackViewer() : fallbackMode ? renderFallbackViewer() : renderPDFViewer()}
      </CardContent>
    </Card>
  );
};

export default PDFViewer;
