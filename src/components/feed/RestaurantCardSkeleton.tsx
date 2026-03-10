import { Skeleton, SkeletonCircle } from '../ui/Skeleton';

export function RestaurantCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm rounded-3xl overflow-hidden flex flex-col transition-all">
      {/* Photo Section Skeleton */}
      <div className="w-full aspect-[4/5] bg-slate-100 dark:bg-zinc-800 animate-pulse relative">
        <div className="absolute top-3 right-3 z-20">
          <SkeletonCircle size={32} />
        </div>

        {/* Avatars skeleton */}
        <div className="absolute -bottom-4 left-3 flex -space-x-2 z-10">
          <SkeletonCircle size={32} className="border-[2.5px] border-white dark:border-zinc-900 shadow-sm" />
          <SkeletonCircle size={32} className="border-[2.5px] border-white dark:border-zinc-900 shadow-sm" />
        </div>
      </div>

      <div className="p-4 pt-6 flex-1 flex flex-col space-y-3">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-8 rounded-lg" />
        </div>

        <Skeleton className="h-4 w-1/3" />

        <div className="flex items-center gap-2 mt-auto pt-2">
          <SkeletonCircle size={16} />
          <Skeleton className="h-3 w-3/4" />
        </div>

        <div className="mt-1 pl-[18px]">
          <Skeleton className="h-2 w-20" />
        </div>
      </div>

      <div className="px-4 pb-4">
        <Skeleton className="w-full h-[44px] rounded-xl" />
      </div>
    </div>
  );
}
