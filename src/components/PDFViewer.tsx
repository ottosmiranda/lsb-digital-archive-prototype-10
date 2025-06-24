
import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

// Configure PDF.js worker to use the installed version
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
}

const PDFViewer = ({ pdfUrl, title }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create proxied PDF URL using our Edge Function
  const getProxiedPdfUrl = useCallback(() => {
    const baseUrl = `https://acnympbxfptajtxvmkqn.supabase.co/functions/v1/proxy-pdf`;
    const encodedUrl = encodeURIComponent(pdfUrl);
    return `${baseUrl}?url=${encodedUrl}`;
  }, [pdfUrl]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('✅ PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('❌ PDF load error:', error);
    console.log('📄 Original PDF URL:', pdfUrl);
    console.log('🔄 Proxied PDF URL:', getProxiedPdfUrl());
    setError('Erro ao carregar o PDF. O arquivo pode não estar disponível no momento.');
    setLoading(false);
  }, [pdfUrl, getProxiedPdfUrl]);

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages, prev + 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(2.0, prev + 0.2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const downloadPDF = () => {
    // Use the original URL for download
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title}.pdf`;
    link.target = '_blank';
    link.click();
  };

  if (error) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <div className="text-red-600 mb-4">
            <p className="font-semibold">Erro ao carregar PDF</p>
            <p className="text-sm">{error}</p>
            <p className="text-xs text-gray-500 mt-2">
              URL: {pdfUrl}
            </p>
          </div>
          <div className="space-x-2">
            <Button onClick={downloadPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
            <Button 
              onClick={() => window.open(pdfUrl, '_blank')} 
              variant="outline"
            >
              Abrir em nova aba
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const proxiedUrl = getProxiedPdfUrl();

  return (
    <Card className={`mb-6 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <CardContent className="p-0">
        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-2">
            <Button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1 || loading}
              size="sm"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {loading ? '...' : `${pageNumber} de ${numPages}`}
            </span>
            <Button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages || loading}
              size="sm"
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={zoomOut} size="sm" variant="outline" disabled={loading}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
            <Button onClick={zoomIn} size="sm" variant="outline" disabled={loading}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button onClick={downloadPDF} size="sm" variant="outline">
              <Download className="h-4 w-4" />
            </Button>
            <Button onClick={toggleFullscreen} size="sm" variant="outline">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* PDF Display */}
        <div className={`overflow-auto ${isFullscreen ? 'h-screen' : 'max-h-96'} flex justify-center bg-gray-100`}>
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Carregando PDF...</p>
              </div>
            </div>
          )}
          
          <Document
            file={proxiedUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
            error=""
            className="flex justify-center"
            options={{
              cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
              cMapPacked: true,
            }}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-lg"
              loading=""
              error=""
            />
          </Document>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFViewer;
