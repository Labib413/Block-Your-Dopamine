import React from "react";
import { cn } from "../../lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  [key: string]: any;
}

export const Skeleton = ({ className, ...props }: SkeletonProps) => (
  <div className={cn("animate-pulse rounded-[inherit] bg-white/5", className)} {...props} />
);
