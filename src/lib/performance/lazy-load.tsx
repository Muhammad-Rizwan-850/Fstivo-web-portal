'use client';

import React, { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function lazyLoad<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <Skeleton className="h-64 w-full" />
) {
  const LazyComponent = lazy(factory);

  return function LazyLoadedComponent(props: any) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Usage examples
export const LazyChart = lazyLoad(
  () => import('@/components/charts/analytics-chart' as any),
  <div className="h-64 animate-pulse bg-gray-200 rounded" />
);

export const LazyEditor = lazyLoad(
  () => import('@/components/editor/rich-text-editor' as any),
  <Skeleton className="h-96 w-full" />
);

export const LazyMap = lazyLoad(
  () => import('@/components/maps/event-map' as any),
  <Skeleton className="h-80 w-full" />
);
