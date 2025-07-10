
import { Skeleton } from '@/components/ui/skeleton';

const RecentAdditionsSkeleton = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="lsb-container">
        <div className="lsb-content">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-80 mx-auto" />
          </div>

          {/* Recent Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-lg border p-6">
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-12 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <Skeleton className="w-20 h-20 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center">
            <Skeleton className="h-12 w-48 mx-auto rounded" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecentAdditionsSkeleton;
