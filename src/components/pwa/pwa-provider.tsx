'use client';

// =====================================================
// PWA PROVIDER COMPONENT
// =====================================================
// Registers service worker and handles PWA functionality
// =====================================================

import { useEffect, ReactNode } from 'react';
import { registerServiceWorker } from '@/lib/pwa-utils';

interface PwaProviderProps {
  children: ReactNode;
}

export function PwaProvider({ children }: PwaProviderProps) {
  useEffect(() => {
    // Register service worker only in production and when supported
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      registerServiceWorker();
    }
  }, []);

  return <>{children}</>;
}
