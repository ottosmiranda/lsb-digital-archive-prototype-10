
import React from 'react';
import { AlertCircle, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFFallbackProps {
  pdfUrl: string;
  title: string;
  isFullscreen: boolean;
  fallbackMode: boolean;
  error: string | null;
  onDownload: () => void;
  onOpenInNewTab: () => void;
  onRetry: () => void;
  onFallbackLoad: () => void;
  onFallbackError: () => void;
}

export const PDFFallback = ({
  pdfUrl,
  title,
  isFullscreen,
  fallbackMode,
  error,
  onDownload,
  onOpenInNewTab,
  onRetry,
  onFallbackLoad,
  onFallbackError
}: PDFFallbackProps) => {
  if (fallbackMode) {
    return (
      <div className={`${isFullscreen ? 'h-screen' : 'h-[500px]'} overflow-hidden bg-gray-100 relative`}>
        <iframe
          src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
          title={title}
          className="w-full h-full border-0"
          onLoad={onFallbackLoad}
          onError={onFallbackError}
        />
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'h-screen' : 'h-[500px]'} flex items-center justify-center bg-gray-50`}>
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Visualização não disponível
        </h3>
        <p className="text-gray-600 mb-6">
          O PDF não pôde ser carregado. Use as opções abaixo para acessar o arquivo.
        </p>
        <div className="space-x-3">
          <Button onClick={onDownload} variant="default">
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
          <Button onClick={onOpenInNewTab} variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir em nova aba
          </Button>
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    </div>
  );
};
