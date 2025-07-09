
import { Skeleton } from "@/components/ui/skeleton";

interface EnhancedLoadingSkeletonProps {
  retrying?: boolean;
  message?: string;
}

const EnhancedLoadingSkeleton = ({ retrying, message }: EnhancedLoadingSkeletonProps) => (
  <div className="min-h-screen bg-white">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Loading message */}
      <div className="text-center mb-8">
        {retrying ? (
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">{message || 'Carregando recurso...'}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Carregando...</span>
          </div>
        )}
      </div>

      {/* Breadcrumb skeleton */}
      <div className="mb-6">
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Back button skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-40" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Title and description */}
          <div className="space-y-4 mb-8">
            <Skeleton className="h-6 w-20" /> {/* Badge */}
            <Skeleton className="h-8 w-3/4" /> {/* Title */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>

          {/* Media section */}
          <div className="mb-6">
            <Skeleton className="aspect-video rounded-lg" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resource info */}
          <div className="border rounded-lg p-4">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="border rounded-lg p-4">
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default EnhancedLoadingSkeleton;
