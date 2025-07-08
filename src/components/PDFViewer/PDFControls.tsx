
import React from 'react';
import { Download, Maximize2, Minimize2, RefreshCw, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface PDFControlsProps {
  fallbackMode: boolean;
  numPages: number;
  pageNumber: number;
  scale: number;
  isFullscreen: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen: () => void;
  onDownload: () => void;
  onOpenInNewTab: () => void;
  onRetry: () => void;
}

export const PDFControls = ({
  fallbackMode,
  numPages,
  pageNumber,
  scale,
  isFullscreen,
  error,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
  onDownload,
  onRetry
}: PDFControlsProps) => {
  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-gray-50">
      <div className="flex items-center space-x-3">
        <Badge variant="outline" className="text-xs">
          {fallbackMode ? 'Visualizador do Livro' : 'React PDF'}
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
            <Button onClick={onZoomOut} size="sm" variant="outline" title="Diminuir zoom">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 px-2">{Math.round(scale * 100)}%</span>
            <Button onClick={onZoomIn} size="sm" variant="outline" title="Aumentar zoom">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Action buttons - removed the "open in new tab" button */}
        <Button onClick={onDownload} size="sm" variant="outline" title="Baixar PDF">
          <Download className="h-4 w-4" />
        </Button>
        {error && !fallbackMode && (
          <Button onClick={onRetry} size="sm" variant="outline" title="Tentar novamente">
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        <Button onClick={onToggleFullscreen} size="sm" variant="outline" title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};
