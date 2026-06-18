import { cn } from "../../lib/utils";

interface SkeletonProps {
  className?: string;
  key?: any;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn("animate-pulse rounded-[inherit] bg-white/5", className)} />
);
