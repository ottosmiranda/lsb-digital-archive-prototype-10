
import { Skeleton } from '@/components/ui/skeleton';

const MostAccessedSkeleton = () => {
  return (
    <section className="py-16 md:py-24 bg-lsb-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-48 mx-auto mb-4" />
          <Skeleton className="h-1 w-24 mx-auto rounded-full" />
        </div>

        {/* Carousel Skeleton */}
        <div className="relative">
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4">
                <div className="border-0 shadow-lg rounded-lg overflow-hidden">
                  <div className="p-0">
                    <div className="relative">
                      <Skeleton className="w-full h-40" />
                      <div className="absolute top-3 left-3">
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </div>
                    </div>
                    <div className="p-3 space-y-3">
                      <Skeleton className="h-4 w-16 rounded-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-8 w-full rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MostAccessedSkeleton;
