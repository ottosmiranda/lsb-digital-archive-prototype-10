
import { Skeleton } from '@/components/ui/skeleton';

const FeaturedMediaSkeleton = () => {
  return (
    <section className="py-16 md:py-24 bg-lsb-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-80 mx-auto" />
        </div>

        {/* Tabs Skeleton */}
        <div className="w-full">
          <div className="max-w-md mx-auto mb-8">
            <div className="grid grid-cols-2 gap-1 bg-gray-100 rounded-lg p-1">
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-10 rounded-md" />
            </div>
          </div>

          {/* Media Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-lg overflow-hidden shadow">
                <div className="p-0">
                  <div className="relative">
                    <Skeleton className="w-full aspect-video" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Skeleton className="w-12 h-12 rounded-full" />
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Skeleton className="h-5 w-12 rounded" />
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center">
            <Skeleton className="h-10 w-40 mx-auto rounded" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedMediaSkeleton;
