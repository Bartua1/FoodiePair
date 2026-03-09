import { Skeleton, SkeletonCircle, SkeletonRect } from '../ui/Skeleton';

export function RestaurantDetailSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden">
      {/* Header Skeleton */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-4 sticky top-0 bg-white z-10">
        <SkeletonCircle size={40} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="flex gap-2">
          <SkeletonCircle size={32} />
          <SkeletonCircle size={32} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-32">
        {/* Hero Carousel Skeleton */}
        <SkeletonRect className="aspect-video" />

        {/* Map Section Skeleton */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <SkeletonCircle size={16} />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <SkeletonRect className="h-48" />
        </div>

        {/* Comparative Ratings Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center gap-2">
              <SkeletonCircle size={48} />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex items-center justify-center">
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <SkeletonCircle size={48} />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <SkeletonRect className="h-32" />
        </div>

        {/* Comments Section Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <SkeletonCircle size={32} />
                <Skeleton className="h-10 flex-1 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
