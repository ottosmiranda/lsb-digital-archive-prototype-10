
import { Skeleton } from '@/components/ui/skeleton';

const QuickAccessSkeleton = () => {
  return (
    <section className="py-16 md:py-24 bg-lsb-section">
      <div className="lsb-container">
        <div className="lsb-content">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-80 mx-auto" />
          </div>

          {/* Quick Access Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="text-center">
                <div className="relative mx-auto w-24 h-24 md:w-32 md:h-32 rounded-full mb-4">
                  <Skeleton className="w-full h-full rounded-full" />
                  <div className="absolute -top-2 -right-2">
                    <Skeleton className="h-6 w-8 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 mx-auto mb-1" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="text-center mt-12">
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuickAccessSkeleton;
