
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface InfiniteContentSkeletonProps {
  count?: number;
  variant?: 'grid' | 'list';
}

const InfiniteContentSkeleton = ({ count = 3, variant = 'grid' }: InfiniteContentSkeletonProps) => {
  if (variant === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Skeleton className="w-28 h-28 rounded flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                </div>
                <Skeleton className="w-20 h-10 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="p-0">
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-t-lg" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InfiniteContentSkeleton;
