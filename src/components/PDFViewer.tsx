
import React, { useState, useCallback } from 'react';
import { pdfjs } from 'react-pdf';
import { Card, CardContent } from '@/components/ui/card';
import { PDFControls } from './PDFViewer/PDFControls';
import { PDFContent } from './PDFViewer/PDFContent';
import { PDFFallback } from './PDFViewer/PDFFallback';
import { logPDFEvent } from '@/utils/pdfUtils';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker with multiple fallback sources
const setupWorker = () => {
  const sources = [
    `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
    `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
  ];
  
  pdfjs.GlobalWorkerOptions.workerSrc = sources[0];
  logPDFEvent('PDF Worker configured', { workerSrc: sources[0] });
};

setupWorker();

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
    logPDFEvent('PDF load failed', { error: error.message, url: pdfUrl, stack: error.stack });
    console.error('📄 PDF Worker Error Details:', {
      message: error.message,
      stack: error.stack,
      pdfUrl,
      workerSrc: pdfjs.GlobalWorkerOptions.workerSrc
    });
    setLoading(false);
    setError('Erro ao carregar PDF. Tente as opções abaixo.');
    setFallbackMode(true);
  }, [pdfUrl]);

  // Event handlers
  const handlePageChange = (page: number) => setPageNumber(page);
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleToggleFullscreen = () => setIsFullscreen(prev => !prev);

  const handleDownload = () => {
    logPDFEvent('Downloading PDF', { url: pdfUrl });
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title}.pdf`;
    link.target = '_blank';
    link.click();
  };

  const handleOpenInNewTab = () => {
    logPDFEvent('Opening PDF in new tab', { url: pdfUrl });
    window.open(pdfUrl, '_blank');
  };

  const handleRetry = () => {
    logPDFEvent('Retrying PDF load');
    setLoading(true);
    setError(null);
    setFallbackMode(false);
    setPageNumber(1);
  };

  const handleFallbackLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleFallbackError = () => {
    setError('Visualização não disponível. Use as opções de download.');
  };

  return (
    <Card className={`mb-6 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <CardContent className="p-0">
        <PDFControls
          fallbackMode={fallbackMode}
          numPages={numPages}
          pageNumber={pageNumber}
          scale={scale}
          isFullscreen={isFullscreen}
          error={error}
          onPageChange={handlePageChange}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onToggleFullscreen={handleToggleFullscreen}
          onDownload={handleDownload}
          onOpenInNewTab={handleOpenInNewTab}
          onRetry={handleRetry}
        />

        {error && !fallbackMode ? (
          <PDFFallback
            pdfUrl={pdfUrl}
            title={title}
            isFullscreen={isFullscreen}
            fallbackMode={false}
            error={error}
            onDownload={handleDownload}
            onOpenInNewTab={handleOpenInNewTab}
            onRetry={handleRetry}
            onFallbackLoad={handleFallbackLoad}
            onFallbackError={handleFallbackError}
          />
        ) : fallbackMode ? (
          <PDFFallback
            pdfUrl={pdfUrl}
            title={title}
            isFullscreen={isFullscreen}
            fallbackMode={true}
            error={error}
            onDownload={handleDownload}
            onOpenInNewTab={handleOpenInNewTab}
            onRetry={handleRetry}
            onFallbackLoad={handleFallbackLoad}
            onFallbackError={handleFallbackError}
          />
        ) : (
          <PDFContent
            pdfUrl={pdfUrl}
            pageNumber={pageNumber}
            scale={scale}
            isFullscreen={isFullscreen}
            loading={loading}
            onDocumentLoadSuccess={onDocumentLoadSuccess}
            onDocumentLoadError={onDocumentLoadError}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default PDFViewer;
