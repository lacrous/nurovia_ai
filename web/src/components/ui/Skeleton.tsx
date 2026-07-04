import { type HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  circle?: boolean;
}

export function Skeleton({ circle, className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-muted/60 ${circle ? "rounded-full" : "rounded-md"} ${className}`}
      {...props}
    />
  );
}
