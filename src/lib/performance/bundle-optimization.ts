import { logger } from '@/lib/logger';
/**
 * FSTIVO Bundle Optimization
 * Tree-shakeable imports and dynamic loading utilities
 */

'use client';

// =====================================================
// DYNAMIC IMPORTS FOR HEAVY LIBRARIES
// =====================================================

export const loadChartLibrary = () => import('recharts');
export const loadD3Library = () => import('d3' as any);
export const loadDateFns = () => import('date-fns');
export const loadDayjs = () => import('dayjs');
export const loadReactHookForm = () => import('react-hook-form');
export const loadZod = () => import('zod');
export const loadTipTap = () => import('@tiptap/react' as any);
export const loadQuill = () => import('react-quill' as any);
export const loadLeaflet = () => import('leaflet');
export const loadMapbox = () => import('mapbox-gl' as any);
export const loadReactDropzone = () => import('react-dropzone');
export const loadUppy = () => import('@uppy/react' as any);
export const loadQRCode = () => import('qrcode');
export const loadReactQRCode = () => import('react-qr-code');
export const loadJSZip = () => import('jszip' as any);
export const loadPDFLib = () => import('pdf-lib' as any);

// =====================================================
// TREE-SHAKEABLE UTILITIES
// =====================================================

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function cloneDeep<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

export function isEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

export function orderBy<T>(
  arr: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

// =====================================================
// CODE SPLITTING UTILITIES
// =====================================================

export async function importChunk<T>(module: () => Promise<T>): Promise<T> {
  return module();
}

export async function importWithRetry<T>(
  importFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error as Error;
      logger.warn('Import attempt ' + (i + 1) + ' failed:', error);
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
}

export async function importWithTimeout<T>(
  importFn: () => Promise<T>,
  timeout: number = 5000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Import timeout')), timeout);
  });
  return Promise.race([importFn(), timeoutPromise]);
}

// =====================================================
// MODULE PRELOADING
// =====================================================

export function preloadOnIdle(importFn: () => Promise<any>): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      importFn().catch((error) => {
        logger.error('Failed to preload module:', error);
      });
    });
  } else {
    setTimeout(() => {
      importFn().catch((error) => {
        logger.error('Failed to preload module:', error);
      });
    }, 2000);
  }
}

export function createPreloadOnHover(
  importFn: () => Promise<any>,
  delay: number = 200
): {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
} {
  let timeoutId: NodeJS.Timeout | null = null;
  const onMouseEnter = () => {
    timeoutId = setTimeout(() => {
      importFn().catch((error) => {
        logger.error('Failed to preload module:', error);
      });
    }, delay);
  };
  const onMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  return { onMouseEnter, onMouseLeave };
}

// =====================================================
// CONDITIONAL LOADING
// =====================================================

export async function loadConditional<T>(
  condition: boolean,
  importFn: () => Promise<T>
): Promise<T | null> {
  if (!condition) return null;
  return importFn();
}

export async function loadFeatureFlagged<T>(
  featureFlag: string,
  importFn: () => Promise<T>
): Promise<T | null> {
  const isEnabled = process.env.NEXT_PUBLIC_FEATURE_FLAGS?.includes(featureFlag);
  if (!isEnabled) return null;
  return importFn();
}

// =====================================================
// BUNDLE SIZE MONITORING
// =====================================================

interface BundleSizeInfo {
  name: string;
  size: number;
  gzipSize: number;
}

export async function getBundleSize(): Promise<BundleSizeInfo[]> {
  if (process.env.NODE_ENV !== 'development') {
    return [];
  }
  return [
    { name: 'main', size: 0, gzipSize: 0 },
    { name: 'vendor', size: 0, gzipSize: 0 },
  ];
}

// =====================================================
// IMPORT OPTIMIZATION HINTS
// =====================================================

export const optimizationHints = {
  sideEffectsFree: [
    'src/lib/utils/**',
    'src/components/ui/**',
    'src/types/**',
  ],
  hasSideEffects: [
    'src/**/*.css',
    'src/**/*.scss',
  ],
  splitChunks: [
    'recharts',
    'd3',
    '@tiptap/react',
    'react-quill',
    'leaflet',
    'mapbox-gl',
    'react-dropzone',
    'qrcode',
  ],
};

// =====================================================
// EXPORTS
// =====================================================

export default {
  loadChartLibrary,
  loadD3Library,
  loadDateFns,
  loadDayjs,
  loadReactHookForm,
  loadZod,
  loadTipTap,
  loadQuill,
  loadLeaflet,
  loadMapbox,
  loadReactDropzone,
  loadUppy,
  loadQRCode,
  loadReactQRCode,
  loadJSZip,
  loadPDFLib,
  debounce,
  throttle,
  cloneDeep,
  isEmpty,
  isEqual,
  uniq,
  groupBy,
  orderBy,
  importChunk,
  importWithRetry,
  importWithTimeout,
  preloadOnIdle,
  createPreloadOnHover,
  loadConditional,
  loadFeatureFlagged,
  getBundleSize,
  optimizationHints,
};
