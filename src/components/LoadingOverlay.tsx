
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isVisible: boolean;
  variant?: 'grid' | 'list';
  count?: number;
}

const LoadingOverlay = ({ isVisible, variant = 'grid', count = 6 }: LoadingOverlayProps) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-lg">
      <div className="p-4">
        <div className="flex items-center justify-center mb-4">
          <div className="text-sm text-gray-600 font-medium">Atualizando resultados...</div>
        </div>
        
        {variant === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="flex gap-4 p-4 border rounded-lg">
                <Skeleton className="h-20 w-20 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
