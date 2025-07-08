
import React from 'react';
import { Document, Page } from 'react-pdf';

interface PDFContentProps {
  pdfUrl: string;
  pageNumber: number;
  scale: number;
  isFullscreen: boolean;
  loading: boolean;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onDocumentLoadError: (error: Error) => void;
}

export const PDFContent = ({
  pdfUrl,
  pageNumber,
  scale,
  isFullscreen,
  loading,
  onDocumentLoadSuccess,
  onDocumentLoadError
}: PDFContentProps) => {
  return (
    <div className={`${isFullscreen ? 'h-screen' : 'h-[500px]'} bg-gray-100 relative overflow-auto`}>
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
