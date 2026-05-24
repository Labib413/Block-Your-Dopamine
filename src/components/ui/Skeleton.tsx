import React from "react";
import { cn } from "../../lib/utils";

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("animate-pulse rounded-[inherit] bg-white/5", className)} {...props} />
);