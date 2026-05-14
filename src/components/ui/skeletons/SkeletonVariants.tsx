import { cn } from "../../../lib/utils";

interface SkeletonProps {
  className?: string;
}

const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn("animate-pulse rounded-[16px] bg-white/5", className)} />
);

export const StatsSkeleton = () => (
  <div className="flex gap-4">
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
);

export const ChartSkeleton = () => (
  <Skeleton className="h-64 w-full" />
);

export const ProgressSkeleton = () => (
  <div className="flex items-center gap-4">
    <Skeleton className="h-16 w-16 rounded-full" />
    <Skeleton className="h-4 flex-1" />
  </div>
);

export const ListSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
);
