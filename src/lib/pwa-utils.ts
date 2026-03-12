"use client";

import { logger } from '@/lib/logger';

// =====================================================
// PWA UTILITIES FOR FSTIVO
// =====================================================

// Features: Service Worker, Push Notifications, Offline Support
// =====================================================

/**
 * Register the service worker
 */
export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          logger.info('[PWA] SW registered:', registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update available
                  showUpdateNotification();
                }
              });
            }
          });
        })
        .catch((error) => {
          logger.error('[PWA] SW registration failed:', error);
        });
    });
  }
}

/**
 * Request notification permission from user
 */
export function requestNotificationPermission(): void {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        logger.info('[PWA] Notification permission granted');
        // Subscribe to push notifications
        subscribeToPushNotifications().catch(logger.error);
      } else {
        logger.warn('[PWA] Notification permission denied');
      }
    });
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Convert VAPID key from base64 string to Uint8Array
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      logger.warn('[PWA] VAPID public key not configured');
      return null;
    }

    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey as any
    });

    // Send subscription to server
    const response = await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    if (response.ok) {
      logger.info('[PWA] Push subscription saved');
      return subscription;
    } else {
      throw new Error('Failed to save subscription');
    }
  } catch (error) {
    logger.error('[PWA] Push subscription failed:', error);
    return null;
  }
}

/**
 * Show update notification to user
 */
export function showUpdateNotification(): void {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification('Update Available', {
      body: 'A new version of FSTIVO is available. Refresh to update.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'fstivo-update'
    });
  }
}

/**
 * Cache ticket data for offline access
 */
export async function cacheTicketOffline(ticketData: any): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    const cache = await caches.open('cached-tickets');
    const response = new Response(JSON.stringify(ticketData), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(`/tickets/${ticketData.id}`, response);
    logger.info('[PWA] Ticket cached:', ticketData.id);
  } catch (error) {
    logger.error('[PWA] Failed to cache ticket:', error);
  }
}

/**
 * Get cached ticket data
 */
export async function getCachedTicket(ticketId: string): Promise<any | null> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return null;
  }

  try {
    const cache = await caches.open('cached-tickets');
    const response = await cache.match(`/tickets/${ticketId}`);
    if (response) {
      return await response.json();
    }
    return null;
  } catch (error) {
    logger.error('[PWA] Failed to get cached ticket:', error);
    return null;
  }
}

/**
 * Save registration data for offline sync
 */
export async function saveOfflineRegistration(registrationData: any): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    const cache = await caches.open('offline-registrations');
    const response = new Response(JSON.stringify(registrationData), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(`/registration/${Date.now()}`, response);
    logger.info('[PWA] Registration saved for offline sync');

    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype as any)) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sync-registrations');
      logger.info('[PWA] Background sync registered');
    }
  } catch (error) {
    logger.error('[PWA] Failed to save offline registration:', error);
  }
}

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Listen for online/offline status changes
 */
export function onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Get current push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    logger.error('[PWA] Failed to get push subscription:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      logger.info('[PWA] Unsubscribed from push notifications');
      return true;
    }

    return false;
  } catch (error) {
    logger.error('[PWA] Failed to unsubscribe:', error);
    return false;
  }
}

/**
 * Clear all cached data
 */
export async function clearAllCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    logger.info('[PWA] All caches cleared');
  } catch (error) {
    logger.error('[PWA] Failed to clear caches:', error);
  }
}

/**
 * Pre-cache specific URLs
 */
export async function precacheUrls(urls: string[]): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Send message to service worker to cache URLs
    registration.active?.postMessage({
      type: 'CACHE_URLS',
      urls
    });

    logger.info('[PWA] Precaching URLs:', urls);
  } catch (error) {
    logger.error('[PWA] Failed to precache URLs:', error);
  }
}

/**
 * Check if app is installed as PWA
 */
export function isPwaInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for standalone mode (iOS)
  const isIOSStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Check for standalone mode (Android)
  const isAndroidStandalone = (window.navigator as any).standalone === true;

  return isIOSStandalone || isAndroidStandalone;
}

/**
 * Get install prompt event (for showing custom install UI)
 */
let deferredPrompt: Event | null = null;

export function captureInstallPrompt(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    logger.info('[PWA] Install prompt captured');
  });
}

/**
 * Show the install prompt
 */
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    logger.warn('[PWA] No install prompt available');
    return false;
  }

  try {
    // Show the install prompt
    (deferredPrompt as any).prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await (deferredPrompt as any).userChoice;
    // The deferredPrompt can only be used once
    deferredPrompt = null;

    if (outcome === 'accepted') {
      logger.info('[PWA] User accepted the install prompt');
      return true;
    } else {
      logger.info('[PWA] User dismissed the install prompt');
      return false;
    }
  } catch (error) {
    logger.error('[PWA] Failed to show install prompt:', error);
    return false;
  }
}

/**
 * Check if install prompt is available
 */
export function isInstallPromptAvailable(): boolean {
  return deferredPrompt !== null;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Convert base64 string to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  // Use globalThis.atob where available to avoid referencing window in non-browser contexts
  const atobFn = (globalThis as any).atob;
  if (typeof atobFn !== 'function') {
    throw new Error('atob is not available in this environment');
  }

  const rawData = atobFn(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// =====================================================
// REACT HOOK
// =====================================================

import { useEffect, useState } from 'react';

/**
 * React hook for PWA functionality
 */
export function usePwa() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Listen for online/offline events
    const cleanup = onOnlineStatusChange((online) => {
      setIsOnline(online);
    });

    // Check if installed
    setIsInstalled(isPwaInstalled());

    // Capture install prompt
    captureInstallPrompt();

    // Check if install prompt is available
    setCanInstall(isInstallPromptAvailable());

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      logger.info('[PWA] App was installed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      cleanup();
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    const success = await showInstallPrompt();
    if (success) {
      setCanInstall(false);
    }
    return success;
  };

  return {
    isOnline,
    isInstalled,
    canInstall,
    updateAvailable,
    install,
    requestNotificationPermission,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    clearCache: clearAllCaches
  };
}
