'use client';

/**
 * FSTIVO Lazy Loading Utilities
 * Dynamic imports for code splitting and lazy loading
 */

import { lazy, ComponentType, Suspense, ReactNode, useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
// Simple component replacements for missing UI library
const Box = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const Spinner = ({ size, ...props }: any) => <div {...props}>Loading...</div>;

// =====================================================
// LOADING COMPONENTS
// =====================================================

/**
 * Default loading spinner for lazy components
 */
export function DefaultLoadingFallback() {
  return (
    <Box
      display="flex"
      align="center"
      justify="center"
      style={{ height: '200px' }}
    >
      <Spinner size="3" />
    </Box>
  );
}

/**
 * Skeleton loader for event cards
 */
export function EventCardSkeleton() {
  return (
    <Box className="border rounded-lg p-4 space-y-3">
      <Box className="h-48 bg-gray-200 rounded animate-pulse" />
      <Box className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
      <Box className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
    </Box>
  );
}

/**
 * Skeleton loader for analytics
 */
export function AnalyticsSkeleton() {
  return (
    <Box className="space-y-4">
      <Box className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Box key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </Box>
      <Box className="h-96 bg-gray-200 rounded-lg animate-pulse" />
    </Box>
  );
}

// =====================================================
// LAZY COMPONENTS
// =====================================================

/**
 * Create a lazy-loaded component with loading fallback
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ReactNode
): ComponentType<P> {
  const LazyComponent = lazy(importFn);

  return function WrappedLazyComponent(props: P) {
    return (
      <Suspense fallback={fallback || <DefaultLoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// =====================================================
// HEAVY COMPONENT LAZY IMPORTS
// =====================================================

/**
 * Lazy load Event Calendar component
 * Usage: const EventCalendar = LazyComponents.EventCalendar;
 */
export const LazyComponents = {
  // Calendar components
  EventCalendar: createLazyComponent(
    () => import('@/components/features/events/event-calendar' as any),
    <DefaultLoadingFallback />
  ),

  // Analytics components
  DashboardAnalytics: createLazyComponent(
    () => import('@/components/features/analytics/dashboard-analytics' as any),
    <AnalyticsSkeleton />
  ),

  EventAnalytics: createLazyComponent(
    () => import('@/components/features/analytics/event-analytics' as any),
    <AnalyticsSkeleton />
  ),

  RevenueChart: createLazyComponent(
    () => import('@/components/features/analytics/revenue-chart' as any),
    <DefaultLoadingFallback />
  ),

  // Seating components
  SeatingChartEditor: createLazyComponent(
    () => import('@/components/features/seating/seating-chart-editor' as any),
    <DefaultLoadingFallback />
  ),

  SeatingChartViewer: createLazyComponent(
    () => import('@/components/features/seating/seating-chart-viewer' as any),
    <DefaultLoadingFallback />
  ),

  // Editor components
  RichTextEditor: createLazyComponent(
    () => import('@/components/features/editor/rich-text-editor' as any),
    <DefaultLoadingFallback />
  ),

  EventForm: createLazyComponent(
    () => import('@/components/features/events/event-form' as any),
    <DefaultLoadingFallback />
  ),

  // Check-in components
  QRScanner: createLazyComponent(
    () => import('@/components/features/checkin/qr-scanner' as any),
    <DefaultLoadingFallback />
  ),

  // Campaign components
  CampaignEditor: createLazyComponent(
    () => import('@/components/features/campaigns/campaign-editor' as any),
    <DefaultLoadingFallback />
  ),

  // Social components
  ChatInterface: createLazyComponent(
    () => import('@/components/features/social/chat-interface' as any),
    <DefaultLoadingFallback />
  ),

  // Map components
  EventMap: createLazyComponent(
    () => import('@/components/features/events/event-map' as any),
    <DefaultLoadingFallback />
  ),

  // Admin components
  AdminDashboard: createLazyComponent(
    () => import('@/components/features/admin/admin-dashboard' as any),
    <AnalyticsSkeleton />
  ),

  UserManagement: createLazyComponent(
    () => import('@/components/features/admin/user-management' as any),
    <DefaultLoadingFallback />
  ),
};

// =====================================================
// ROUTE-BASED LAZY LOADING
// =====================================================

/**
 * Lazy load pages for better code splitting
 */
export const LazyPages = {
  // Dashboard
  OrganizerDashboard: () => import('@/app/dashboard/organizer/page' as any),
  AttendeeDashboard: () => import('@/app/dashboard/attendee/page' as any),
  AdminDashboard: () => import('@/app/dashboard/admin/page' as any),

  // Events
  EventCreate: () => import('@/app/events/create/page' as any),
  EventEdit: (id: string) => import('@/app/events/[id]/edit/page' as any),

  // Analytics
  EventAnalytics: (id: string) => import('@/app/events/[id]/analytics/page' as any),

  // Settings
  Settings: () => import('@/app/settings/page' as any),
  ProfileSettings: () => import('@/app/settings/profile/page' as any),
  NotificationSettings: () => import('@/app/settings/notifications/page' as any),
};

// =====================================================
// CONDITIONAL LOADING
// =====================================================

/**
 * Load component only when condition is met
 */
export function useConditionalLazyLoad<T>(
  condition: boolean,
  importFn: () => Promise<{ default: T }>
): T | null {
  const [Component, setComponent] = useState<T | null>(null);

  useEffect(() => {
    if (condition && !Component) {
      importFn().then((mod) => {
        setComponent(mod.default);
      });
    }
  }, [condition, Component]);

  return Component;
}

// =====================================================
// PRELOADING
// =====================================================

/**
 * Preload a component before it's needed
 */
export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<any> }>
): void {
  // Start loading the component in the background
  importFn().catch((error) => {
    logger.error('Failed to preload component:', error);
  });
}

/**
 * Preload components on hover
 */
export function usePreloadOnHover(
  importFn: () => Promise<{ default: ComponentType<any> }>,
  delay: number = 200
): {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
} {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      preloadComponent(importFn);
    }, delay);
  };

  const onMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return { onMouseEnter, onMouseLeave };
}

// =====================================================
// PRIORITY LOADING
// =====================================================

/**
 * Load critical components immediately
 */
export function loadCriticalComponents(): void {
  // Preload dashboard components
  preloadComponent(() => import('@/components/features/analytics/dashboard-analytics' as any));
  preloadComponent(() => import('@/components/features/events/event-calendar' as any));
}

/**
 * Load secondary components when idle
 */
export function loadSecondaryComponents(): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      preloadComponent(() => import('@/components/features/analytics/event-analytics' as any));
      preloadComponent(() => import('@/components/features/editor/rich-text-editor' as any));
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      preloadComponent(() => import('@/components/features/analytics/event-analytics' as any));
      preloadComponent(() => import('@/components/features/editor/rich-text-editor' as any));
    }, 2000);
  }
}

// =====================================================
// EXPORTS
// =====================================================

export default {
  LazyComponents,
  LazyPages,
  createLazyComponent,
  preloadComponent,
  usePreloadOnHover,
  loadCriticalComponents,
  loadSecondaryComponents,
  DefaultLoadingFallback,
  EventCardSkeleton,
  AnalyticsSkeleton,
};
