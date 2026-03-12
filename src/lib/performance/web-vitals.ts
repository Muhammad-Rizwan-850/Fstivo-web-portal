'use client';

/**
 * FSTIVO Web Vitals Tracking
 * Core Web Vitals monitoring and reporting
 */

import { Metric, onCLS, onFCP, onLCP, onTTFB } from 'web-vitals';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export type { Metric };

export interface WebVitalsData {
  cls: Metric | null;
  fid: Metric | null;
  fcp: Metric | null;
  lcp: Metric | null;
  ttfb: Metric | null;
}

export interface PerformanceEntry {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

// =====================================================
// WEB VITALS THRESHOLDS
// =====================================================

export const VITAL_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
} as const;

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = VITAL_THRESHOLDS[name as keyof typeof VITAL_THRESHOLDS];
  if (!threshold) return 'good';
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// =====================================================
// METRIC COLLECTION
// =====================================================

export function collectWebVitals(
  callback: (metric: Metric) => void,
  reportAllChanges?: boolean
): () => void {
  const unsubscribeFns: any[] = [];

  unsubscribeFns.push(onCLS(callback as any, reportAllChanges as any));
  unsubscribeFns.push(onFCP(callback as any, reportAllChanges as any));
  unsubscribeFns.push(onLCP(callback as any, reportAllChanges as any));
  unsubscribeFns.push(onTTFB(callback as any, reportAllChanges as any));

  return () => {
    unsubscribeFns.forEach((unsubscribe) => unsubscribe());
  };
}

// =====================================================
// METRIC TRANSFORMATION
// =====================================================

export function transformMetric(metric: Metric): PerformanceEntry {
  return {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    timestamp: metric.value,
  };
}

export function formatMetrics(metrics: WebVitalsData): PerformanceEntry[] {
  const entries: PerformanceEntry[] = [];
  Object.entries(metrics).forEach(([key, metric]) => {
    if (metric) {
      entries.push(transformMetric(metric));
    }
  });
  return entries;
}

// =====================================================
// PERFORMANCE RATING
// =====================================================

export function getOverallRating(metrics: WebVitalsData): 'good' | 'needs-improvement' | 'poor' {
  const entries = formatMetrics(metrics);
  if (entries.every((e) => e.rating === 'good')) {
    return 'good';
  }
  if (entries.some((e) => e.rating === 'poor')) {
    return 'poor';
  }
  return 'needs-improvement';
}

export function getPerformanceScore(metrics: WebVitalsData): number {
  const entries = formatMetrics(metrics);
  if (entries.length === 0) return 100;

  let totalScore = 0;
  entries.forEach((entry) => {
    const threshold = VITAL_THRESHOLDS[entry.name as keyof typeof VITAL_THRESHOLDS];
    if (!threshold) return;
    if (entry.rating === 'good') {
      totalScore += 100;
    } else if (entry.rating === 'needs-improvement') {
      const ratio = (entry.value - threshold.good) / (threshold.poor - threshold.good);
      totalScore += 99 - ratio * 49;
    } else {
      const ratio = Math.min((entry.value - threshold.poor) / threshold.poor, 1);
      totalScore += 49 - ratio * 49;
    }
  });
  return Math.round(totalScore / entries.length);
}

// =====================================================
// ANALYTICS REPORTING
// =====================================================

export function reportToAnalytics(metric: Metric): void {
  const entry = transformMetric(metric);

  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      value: metric.value,
      metric_rating: entry.rating,
      custom_map: {
        metric_value: 'value',
        metric_rating: 'rating',
      },
    });
  }

  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        rating: entry.rating,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
      keepalive: true,
    }).catch((error) => {
      logger.error('Failed to report metrics:', error);
    });
  }
}

export function reportToConsole(metric: Metric): void {
  if (process.env.NODE_ENV === 'development') {
    const entry = transformMetric(metric);
    const rating = entry.rating.toUpperCase();
    const colors = {
      GOOD: '\x1b[32m',
      'NEEDS-IMPROVEMENT': '\x1b[33m',
      POOR: '\x1b[31m',
    };
    const color = colors[rating as keyof typeof colors] || '\x1b[0m';
    const reset = '\x1b[0m';
    logger.info(
      color + '[Web Vitals]' + reset + ' ' + metric.name + ':',
      metric.value.toFixed(2) + 'ms',
      '(' + rating + ')'
    );
  }
}

// =====================================================
// PERFORMANCE OBSERVER
// =====================================================

export function observeLongTasks(callback: (entries: PerformanceEntry[]) => void): () => void {
  if (!('PerformanceObserver' in window)) {
    return () => {};
  }
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    callback(entries as any);
  });
  try {
    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    // Safari doesn't support longtask
  }
  return () => observer.disconnect();
}

export function observeLayoutShift(callback: (entries: PerformanceEntry[]) => void): () => void {
  if (!('PerformanceObserver' in window)) {
    return () => {};
  }
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    callback(entries as any);
  });
  try {
    observer.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    // Ignore if not supported
  }
  return () => observer.disconnect();
}

// =====================================================
// PERFORMANCE MARKS
// =====================================================

export function markPerformance(name: string): void {
  if ('performance' in window && 'mark' in performance) {
    performance.mark(name);
  }
}

export function measurePerformance(name: string, startMark: string, endMark: string): number {
  if ('performance' in window && 'measure' in performance) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      return measure ? measure.duration : 0;
    } catch (e) {
      logger.error('Failed to measure performance:', e);
    }
  }
  return 0;
}

export function getPerformanceMarks(): Record<string, number> {
  if (!('performance' in window) || !('getEntriesByType' in performance)) {
    return {};
  }
  const marks = performance.getEntriesByType('mark') as PerformanceMark[];
  return marks.reduce((acc, mark) => {
    acc[mark.name] = mark.startTime;
    return acc;
  }, {} as Record<string, number>);
}

// =====================================================
// NAVIGATION TIMING
// =====================================================

export function getNavigationTiming(): Record<string, number> {
  if (!('performance' in window) || !('getEntriesByType' in performance)) {
    return {};
  }
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!navigation) return {};
  return {
    dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcpConnection: navigation.connectEnd - navigation.connectStart,
    serverResponse: navigation.responseStart - navigation.requestStart,
    pageLoad: navigation.loadEventEnd - navigation.fetchStart,
    domProcessing: navigation.domComplete - navigation.domInteractive,
    ttfb: navigation.responseStart - navigation.fetchStart,
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
  };
}

// =====================================================
// RESOURCE TIMING
// =====================================================

export function getSlowResources(threshold: number = 1000): Array<{
  name: string;
  duration: number;
  transferSize: number;
}> {
  if (!('performance' in window) || !('getEntriesByType' in performance)) {
    return [];
  }
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  return resources
    .filter((r) => r.duration > threshold)
    .map((r) => ({
      name: r.name,
      duration: r.duration,
      transferSize: r.transferSize,
    }))
    .sort((a, b) => b.duration - a.duration);
}

// =====================================================
// EXPORTS
// =====================================================

export default {
  collectWebVitals,
  transformMetric,
  formatMetrics,
  getRating,
  getOverallRating,
  getPerformanceScore,
  reportToAnalytics,
  reportToConsole,
  observeLongTasks,
  observeLayoutShift,
  markPerformance,
  measurePerformance,
  getPerformanceMarks,
  getNavigationTiming,
  getSlowResources,
  VITAL_THRESHOLDS,
};
