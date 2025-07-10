
import { Skeleton } from '@/components/ui/skeleton';

const ExternalResourcesSkeleton = () => {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-lsb-section to-white">
      <div className="lsb-container">
        <div className="lsb-content">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-80 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>

          {/* Carousel Skeleton */}
          <div className="px-4">
            <div className="w-full">
              <div className="flex gap-4 py-4 overflow-hidden" style={{ marginLeft: '-1rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 xl:w-1/4" style={{ paddingLeft: '1rem' }}>
                    <div className="shadow-lg rounded-lg overflow-hidden h-full mx-2">
                      <div className="p-4 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <Skeleton className="w-10 h-10 rounded-lg" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-20 rounded-full mb-2" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full mb-2" />
                          <Skeleton className="h-4 w-32 mb-3" />
                        </div>
                        
                        <Skeleton className="h-8 w-full rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExternalResourcesSkeleton;
