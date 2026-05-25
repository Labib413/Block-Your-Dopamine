import React from "react";
import { cn } from "../../lib/utils";

interface SkeletonProps {
  className?: string;
  key?: React.Key;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn("animate-pulse rounded-[inherit] bg-white/5", className)} />
);
