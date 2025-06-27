
import { Skeleton } from '@/components/ui/skeleton';

const MostAccessedSkeleton = () => {
  return (
    <section className="py-16 md:py-24 bg-lsb-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-48 mx-auto mb-4" />
          <Skeleton className="h-6 w-80 mx-auto" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <Skeleton className="h-4 w-4" />
                  </th>
                  <th className="px-6 py-3 text-left">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="px-6 py-3 text-left hidden md:table-cell">
                    <Skeleton className="h-4 w-12" />
                  </th>
                  <th className="px-6 py-3 text-left hidden lg:table-cell">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="px-6 py-3 text-right">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="px-6 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Array.from({ length: 10 }).map((_, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-48" />
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MostAccessedSkeleton;
