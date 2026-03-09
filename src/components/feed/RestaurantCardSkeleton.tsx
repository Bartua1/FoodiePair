import { Skeleton, SkeletonCircle } from '../ui/Skeleton';

export function RestaurantCardSkeleton() {
  return (
    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden flex flex-col">
      {/* Photo Section Skeleton */}
      <div className="w-full aspect-video bg-slate-100 animate-pulse relative">
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
           <SkeletonCircle size={32} />
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-8 w-16 rounded-xl" />
        </div>

        <Skeleton className="h-4 w-1/3" />

        <div className="flex items-center gap-2">
          <SkeletonCircle size={16} />
          <Skeleton className="h-3 w-1/2" />
        </div>

        <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}
