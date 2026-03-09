import { cn } from "../../lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200 dark:bg-zinc-800 rounded-md",
        className
      )}
      style={style}
    />
  );
}

export function SkeletonCircle({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Skeleton
      className={cn("rounded-full", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className="space-y-2 w-full">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4 w-full",
            i === lines - 1 && lines > 1 ? "w-2/3" : "w-full",
            className
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonRect({ className }: { className?: string }) {
  return <Skeleton className={cn("h-24 w-full rounded-2xl", className)} />;
}
