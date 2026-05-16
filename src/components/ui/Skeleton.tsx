import { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  key?: any;
}

export const Skeleton = ({ className, ...props }: SkeletonProps) => (
  <div
    className={cn("animate-pulse rounded-[inherit] bg-white/5", className)}
    {...props}
  />
);
