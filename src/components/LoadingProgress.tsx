import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface LoadingProgressProps {
  progress: number;
  loadingStates: {
    videos: boolean;
    books: boolean;
    podcasts: boolean;
  };
  showDetails?: boolean;
}

const LoadingProgress: React.FC<LoadingProgressProps> = ({ 
  progress, 
  loadingStates,
  showDetails = true 
}) => {
  const getStatusIcon = (isLoading: boolean) => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    }
    return <span className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</span>;
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium text-foreground">Carregando conteúdo</h3>
        <p className="text-sm text-muted-foreground">
          {Math.round(progress)}% concluído
        </p>
      </div>
      
      <Progress value={progress} className="w-full" />
      
      {showDetails && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Vídeos</span>
            {getStatusIcon(loadingStates.videos)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Livros</span>
            {getStatusIcon(loadingStates.books)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Podcasts</span>
            {getStatusIcon(loadingStates.podcasts)}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingProgress;