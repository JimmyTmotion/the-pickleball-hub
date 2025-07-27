import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div className={`animate-pulse bg-muted rounded ${className}`} />
);

export const HeroSkeleton = () => (
  <div className="mb-12">
    <Skeleton className="w-full h-64 md:h-80 lg:h-96 rounded-2xl" />
  </div>
);

export const FeatureCardsSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-3 mb-12">
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-6 bg-white rounded-lg shadow-sm border">
        <Skeleton className="w-12 h-12 mx-auto mb-4 rounded-full" />
        <Skeleton className="h-6 w-16 mx-auto mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>
    ))}
  </div>
);

export const ToolCardsSkeleton = () => (
  <div className="mb-12">
    <div className="text-center mb-8">
      <Skeleton className="h-8 w-48 mx-auto mb-4" />
      <Skeleton className="h-4 w-96 mx-auto" />
    </div>
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto mb-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-6 bg-white rounded-lg shadow-sm border">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-6" />
          <div className="space-y-3 mb-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-10 w-full rounded" />
        </div>
      ))}
    </div>
  </div>
);

export const EventsSkeleton = () => (
  <div className="mb-12">
    <div className="text-center mb-8">
      <Skeleton className="h-8 w-56 mx-auto mb-4" />
      <Skeleton className="h-4 w-80 mx-auto" />
    </div>
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-6 bg-white rounded-lg shadow-sm border">
          <div className="flex items-start gap-4">
            <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);