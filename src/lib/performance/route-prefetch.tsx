'use client';

/**
 * FSTIVO Route Prefetching
 * Intelligent route prefetching on hover and idle
 */

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

// =====================================================
// TYPES
// =====================================================

interface PrefetchConfig {
  threshold?: number;
  priority?: boolean;
}

// =====================================================
// PREFETCH HOOKS
// =====================================================

export function usePrefetchOnHover(href: string, config: PrefetchConfig = {}) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { threshold = 200, priority = false } = config;

  const onMouseEnter = useCallback(() => {
    if (priority) {
      router.prefetch(href);
      return;
    }
    timeoutRef.current = setTimeout(() => {
      router.prefetch(href);
    }, threshold);
  }, [href, router, threshold, priority]);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { onMouseEnter, onMouseLeave };
}

export function usePrefetchOnIdle(href: string) {
  const router = useRouter();

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const callbackId = (window as any).requestIdleCallback(() => {
        router.prefetch(href);
      });
      return () => {
        (window as any).cancelIdleCallback(callbackId);
      };
    } else {
      const timeoutId = setTimeout(() => {
        router.prefetch(href);
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [href, router]);
}

export function usePrefetchMultiple(hrefs: string[]) {
  const router = useRouter();

  useEffect(() => {
    if (hrefs.length > 0) {
      router.prefetch(hrefs[0]);
    }

    if ('requestIdleCallback' in window) {
      const callbackId = (window as any).requestIdleCallback(() => {
        hrefs.slice(1).forEach((href) => {
          router.prefetch(href);
        });
      });
      return () => {
        (window as any).cancelIdleCallback(callbackId);
      };
    } else {
      const timeoutId = setTimeout(() => {
        hrefs.slice(1).forEach((href) => {
          router.prefetch(href);
        });
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [hrefs, router]);
}

export function usePrefetchDashboard() {
  usePrefetchMultiple(['/dashboard', '/dashboard/events', '/dashboard/analytics']);
}

export function usePrefetchEventRoutes(eventId: string) {
  usePrefetchMultiple([
    `/events/${eventId}`,
    `/events/${eventId}/tickets`,
    `/events/${eventId}/analytics`,
  ]);
}

export function usePrefetchSettings() {
  usePrefetchMultiple(['/settings', '/settings/profile', '/settings/notifications']);
}

// =====================================================
// LINK COMPONENT WITH PREFETCH
// =====================================================

interface PrefetchLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetchOnHover?: boolean;
  prefetchDelay?: number;
  prefetchImmediately?: boolean;
}

export function PrefetchLink({
  href,
  children,
  className,
  prefetchOnHover = true,
  prefetchDelay = 200,
  prefetchImmediately = false,
}: PrefetchLinkProps) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push(href);
  };

  const handleMouseEnter = () => {
    if (!prefetchOnHover) return;
    if (prefetchImmediately) {
      router.prefetch(href);
      return;
    }
    timeoutRef.current = setTimeout(() => {
      router.prefetch(href);
    }, prefetchDelay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </a>
  );
}

// =====================================================
// PREDICTIVE PREFETCHING
// =====================================================

export function usePredictivePrefetch(currentPath: string) {
  const router = useRouter();

  useEffect(() => {
    const patterns: Record<string, string[]> = {
      '/events': ['/events/create', '/dashboard'],
      '/events/[id]': ['/events/[id]/tickets', '/events/[id]/register'],
      '/dashboard': ['/dashboard/events', '/dashboard/analytics', '/dashboard/tickets'],
      '/dashboard/events': ['/events/create'],
      '/dashboard/analytics': ['/dashboard/events'],
      '/settings': ['/settings/profile', '/settings/notifications'],
    };
    const matchingPattern = Object.keys(patterns).find((pattern) => {
      const regex = new RegExp('^' + pattern.replace(/\[.*?\]/g, '[^/]+') + '$');
      return regex.test(currentPath);
    });

    let cleanup: (() => void) | undefined;

    if (matchingPattern) {
      const routesToPrefetch = patterns[matchingPattern];

      if ('requestIdleCallback' in window) {
        const callbackId = (window as any).requestIdleCallback(() => {
          routesToPrefetch.forEach((r) => {
            const match = currentPath.match(matchingPattern.replace(/\[.*?\]/g, '([^/]+)'));
            if (match) {
              let prefetchRoute = routesToPrefetch[0];
              prefetchRoute = prefetchRoute.replace(/\[.*?\]/, match[1]);
              router.prefetch(prefetchRoute);
            }
          });
        });
        cleanup = () => {
          (window as any).cancelIdleCallback(callbackId);
        };
      } else {
        const timeoutId = setTimeout(() => {
          routesToPrefetch.forEach((r) => {
            const match = currentPath.match(matchingPattern.replace(/\[.*?\]/g, '([^/]+)'));
            if (match) {
              let prefetchRoute = routesToPrefetch[0];
              prefetchRoute = prefetchRoute.replace(/\[.*?\]/, match[1]);
              router.prefetch(prefetchRoute);
            }
          });
        }, 1200);

        cleanup = () => clearTimeout(timeoutId);
      }
    }

    return cleanup;
  }, [currentPath, router]);
}

// =====================================================
// VIEWPORT-BASED PREFETCHING
// =====================================================

export function useViewportPrefetch(
  href: string,
  elementRef: React.RefObject<HTMLElement>
) {
  const router = useRouter();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasPrefetched.current) {
            router.prefetch(href);
            hasPrefetched.current = true;
          }
        });
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [href, router, elementRef]);
}

// =====================================================
// PREFETCH MANAGER
// =====================================================

class PrefetchManager {
  private prefetched = new Set<string>();
  private queue: string[] = [];
  private isProcessing = false;

  enqueue(href: string, priority: boolean = false) {
    if (this.prefetched.has(href)) return;
    if (priority) {
      this.queue.unshift(href);
    } else {
      this.queue.push(href);
    }
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const href = this.queue.shift();
      if (!href || this.prefetched.has(href)) continue;
      this.prefetched.add(href);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  hasPrefetched(href: string): boolean {
    return this.prefetched.has(href);
  }

  clear() {
    this.prefetched.clear();
    this.queue = [];
  }
}

export const prefetchManager = new PrefetchManager();

// =====================================================
// EXPORTS
// =====================================================

export default {
  usePrefetchOnHover,
  usePrefetchOnIdle,
  usePrefetchMultiple,
  usePrefetchDashboard,
  usePrefetchEventRoutes,
  usePrefetchSettings,
  usePredictivePrefetch,
  useViewportPrefetch,
  PrefetchLink,
  prefetchManager,
};
