'use client';

/**
 * FSTIVO Web Vitals Reporter Component
 * Client-side component that collects and reports Core Web Vitals
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  collectWebVitals,
  reportToAnalytics,
  reportToConsole,
  WebVitalsData,
  Metric,
} from '@/lib/performance/web-vitals';

// =====================================================
// TYPES
// =====================================================

interface WebVitalsReporterProps {
  children?: React.ReactNode;
  analyticsEnabled?: boolean;
  consoleReporting?: boolean;
}

// =====================================================
// COMPONENT
// =====================================================

/**
 * Web Vitals Reporter Component
 *
 * Place this component in your root layout to automatically
 * collect and report Core Web Vitals.
 *
 * @example
 * ```tsx
 * <WebVitalsReporter analyticsEnabled={true} />
 * ```
 */
export function WebVitalsReporter({
  children,
  analyticsEnabled = process.env.NODE_ENV === 'production',
  consoleReporting = process.env.NODE_ENV === 'development',
}: WebVitalsReporterProps) {
  const pathname = usePathname();
  const [metrics, setMetrics] = useState<WebVitalsData>({
    cls: null,
    fid: null,
    fcp: null,
    lcp: null,
    ttfb: null,
  });

  useEffect(() => {
    let isMounted = true;

    // Collect metrics on page load
    const cleanup = collectWebVitals(
      (metric: Metric) => {
        if (!isMounted) return;

        setMetrics((prev) => ({
          ...prev,
          [metric.name.toLowerCase()]: metric,
        }));

        // Report to analytics
        if (analyticsEnabled) {
          reportToAnalytics(metric);
        }

        // Report to console in development
        if (consoleReporting) {
          reportToConsole(metric);
        }
      },
      true // Report all changes
    );

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [analyticsEnabled, consoleReporting]);

  // Reset metrics on route change
  useEffect(() => {
    setMetrics({
      cls: null,
      fid: null,
      fcp: null,
      lcp: null,
      ttfb: null,
    });
  }, [pathname]);

  return <>{children}</>;
}

// =====================================================
// DEV OVERLAY COMPONENT
// =====================================================

interface DevOverlayProps {
  metrics: WebVitalsData;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Development-only overlay showing Web Vitals
 */
export function WebVitalsDevOverlay({
  metrics,
  position = 'bottom-right',
}: DevOverlayProps) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const positionStyles = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const formatValue = (metric: Metric | null): string => {
    if (!metric) return '-';
    return `${metric.value.toFixed(2)} ms`;
  };

  const getRatingColor = (metric: Metric | null): string => {
    if (!metric) return 'text-gray-400';

    const rating = metric.rating;
    if (rating === 'good') return 'text-green-500';
    if (rating === 'needs-improvement') return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div
      className={`fixed ${positionStyles[position]} z-50 bg-gray-900/95 text-white p-4 rounded-lg shadow-xl font-mono text-xs backdrop-blur-sm`}
    >
      <div className="font-bold mb-2 text-sm">Core Web Vitals</div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span>LCP:</span>
          <span className={getRatingColor(metrics.lcp)}>{formatValue(metrics.lcp)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>FID:</span>
          <span className={getRatingColor(metrics.fid)}>{formatValue(metrics.fid)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>CLS:</span>
          <span className={getRatingColor(metrics.cls)}>{formatValue(metrics.cls)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>FCP:</span>
          <span className={getRatingColor(metrics.fcp)}>{formatValue(metrics.fcp)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>TTFB:</span>
          <span className={getRatingColor(metrics.ttfb)}>{formatValue(metrics.ttfb)}</span>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// SCORE BADGE COMPONENT
// =====================================================

interface ScoreBadgeProps {
  metrics: WebVitalsData;
  showLabel?: boolean;
}

/**
 * Display performance score badge
 */
export function PerformanceScoreBadge({ metrics, showLabel = true }: ScoreBadgeProps) {
  const { getPerformanceScore } = require('@/lib/performance/web-vitals');
  const score = getPerformanceScore(metrics);

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Fast';
    if (score >= 50) return 'Moderate';
    return 'Slow';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</div>
      {showLabel && (
        <div className="text-sm text-gray-600">/{getScoreLabel(score)}</div>
      )}
    </div>
  );
}

// =====================================================
// METRICS TABLE COMPONENT
// =====================================================

interface MetricsTableProps {
  metrics: WebVitalsData;
}

/**
 * Display metrics in a table format
 */
export function MetricsTable({ metrics }: MetricsTableProps) {
  const getRatingBadge = (rating: string): React.ReactNode => {
    const styles = {
      good: 'bg-green-100 text-green-800',
      'needs-improvement': 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[rating as keyof typeof styles] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {rating.replace('-', ' ').toUpperCase()}
      </span>
    );
  };

  const metricRows = [
    { name: 'LCP', label: 'Largest Contentful Paint', metric: metrics.lcp, threshold: '2.5s' },
    { name: 'FID', label: 'First Input Delay', metric: metrics.fid, threshold: '100ms' },
    { name: 'CLS', label: 'Cumulative Layout Shift', metric: metrics.cls, threshold: '0.1' },
    { name: 'FCP', label: 'First Contentful Paint', metric: metrics.fcp, threshold: '1.8s' },
    { name: 'TTFB', label: 'Time to First Byte', metric: metrics.ttfb, threshold: '800ms' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Metric
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Value
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Threshold
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Rating
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {metricRows.map((row) => (
            <tr key={row.name}>
              <td className="px-4 py-2 text-sm font-medium text-gray-900">{row.label}</td>
              <td className="px-4 py-2 text-sm text-gray-600">
                {row.metric ? `${row.metric.value.toFixed(2)} ms` : '-'}
              </td>
              <td className="px-4 py-2 text-sm text-gray-600">{row.threshold}</td>
              <td className="px-4 py-2">
                {row.metric ? getRatingBadge(row.metric.rating) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =====================================================
// HOOK
// =====================================================

/**
 * Hook to use Web Vitals in components
 */
export function useWebVitals() {
  const [metrics, setMetrics] = useState<WebVitalsData>({
    cls: null,
    fid: null,
    fcp: null,
    lcp: null,
    ttfb: null,
  });

  useEffect(() => {
    const cleanup = collectWebVitals((metric) => {
      setMetrics((prev) => ({
        ...prev,
        [metric.name.toLowerCase()]: metric,
      }));
    });

    return cleanup;
  }, []);

  return metrics;
}

// =====================================================
// EXPORTS
// =====================================================

export default WebVitalsReporter;
