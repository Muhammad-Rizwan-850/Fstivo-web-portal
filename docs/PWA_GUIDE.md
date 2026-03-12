# Progressive Web App (PWA) Guide

## Overview

FSTIVO now includes Progressive Web App (PWA) capabilities, providing users with an app-like experience including offline functionality, push notifications, and installability.

## Features

### 1. Service Worker
The service worker (`/public/sw.js`) provides:
- **Cache-first strategy**: Assets are served from cache for faster loading
- **Offline support**: Cached content remains available offline
- **Background sync**: Offline actions (registrations, tickets) sync when connection is restored
- **Push notifications**: Real-time updates even when the app is closed
- **Automatic updates**: Checks for and applies app updates seamlessly

### 2. PWA Manifest
The manifest file (`/public/manifest.json`) defines:
- App name, description, and branding
- Icons for various screen sizes
- Display mode (standalone app-like experience)
- Theme colors
- Shortcuts for quick access to key features
- Screenshots for installation prompts

### 3. Offline Functionality
- Offline fallback page at `/offline`
- Cached tickets for offline access
- Offline registration queue with background sync
- Automatic retry when connection is restored

### 4. Push Notifications
- VAPID-based push notifications
- Permission request handling
- Subscription management
- In-app notification support

## Setup Instructions

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# VAPID Keys for Push Notifications
# Generate these using: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### 2. Generate VAPID Keys

Install web-push and generate keys:

```bash
npm install web-push --save-dev
npx web-push generate-vapid-keys
```

Copy the generated keys to your `.env.local` file.

### 3. Service Worker Registration

The service worker is automatically registered in your app. The registration code is in `/lib/pwa-utils.ts`:

```typescript
import { registerServiceWorker } from '@/lib/pwa-utils'

// Call this in your app initialization
registerServiceWorker()
```

### 4. Add to Root Layout

In your `/src/app/layout.tsx`, add the PWA utilities:

```typescript
import { registerServiceWorker, onOnlineStatusChange } from '@/lib/pwa-utils'

export default function RootLayout({ children }) {
  useEffect(() => {
    registerServiceWorker()

    // Optional: Listen for online/offline changes
    onOnlineStatusChange((isOnline) => {
      console.log('Online status:', isOnline)
    })
  }, [])

  return <html>{children}</html>
}
```

### 5. Create App Icons

Create the following icon sizes in `/public/icons/`:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`
- `badge-72x72.png`

## Usage

### Caching Tickets Offline

```typescript
import { cacheTicketOffline } from '@/lib/pwa-utils'

// After user registers for an event
await cacheTicketOffline(ticketData)
```

### Saving Offline Registrations

```typescript
import { saveOfflineRegistration } from '@/lib/pwa-utils'

// User tries to register while offline
await saveOfflineRegistration(registrationData)

// The service worker will sync this when online
```

### Checking Online Status

```typescript
import { isOnline, onOnlineStatusChange } from '@/lib/pwa-utils'

// Check current status
if (isOnline()) {
  // Proceed with online operation
}

// Listen for changes
onOnlineStatusChange((isOnline) => {
  if (isOnline) {
    // Connection restored, sync data
  } else {
    // Show offline UI
  }
})
```

### Requesting Notification Permission

```typescript
import { requestNotificationPermission } from '@/lib/pwa-utils'

// Request permission (usually triggered by user action)
requestNotificationPermission()
```

### Subscribing to Push Notifications

```typescript
import { subscribeToPushNotifications } from '@/lib/pwa-utils'

// Subscribe user to push notifications
const subscription = await subscribeToPushNotifications()
```

## Push Notification API

### Subscribe Endpoint

**POST** `/api/push/subscribe`

Subscribe a user to push notifications.

```typescript
// Called automatically by subscribeToPushNotifications()
await fetch('/api/push/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(subscription)
})
```

### Unsubscribe Endpoint

**POST** `/api/push/unsubscribe`

Unsubscribe a user from push notifications.

```typescript
await fetch('/api/push/unsubscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ endpoint: subscription.endpoint })
})
```

## Background Sync

The service worker supports background sync for offline actions:

### Sync Events

1. **sync-registrations**: Syncs offline event registrations
2. **sync-tickets**: Syncs offline ticket bookings

### Implementing Background Sync

```javascript
// In sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-registrations') {
    event.waitUntil(syncRegistrations())
  }
})

async function syncRegistrations() {
  const cache = await caches.open('offline-registrations')
  const requests = await cache.keys()

  for (const request of requests) {
    const response = await cache.match(request)
    const data = await response.json()

    try {
      await fetch('/api/events/register', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      await cache.delete(request)
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }
}
```

## Cache Management

### View Cached Content

```typescript
// Check what's cached
const cacheNames = await caches.keys()
console.log('Caches:', cacheNames)
```

### Clear All Caches

```typescript
import { clearAllCaches } from '@/lib/pwa-utils'

await clearAllCaches()
```

### Manual Cache Refresh

```typescript
// Force update specific cache
await caches.delete('workbox-precache-v2')
window.location.reload()
```

## Testing PWA Functionality

### 1. Test Offline Mode

1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Navigate the app
5. Verify offline page appears for uncached content

### 2. Test Service Worker

1. Open DevTools
2. Go to Application tab
3. Check "Service Workers" section
4. Verify service worker is active and running

### 3. Test Push Notifications

1. Open DevTools
2. Go to Application tab → Notifications
3. Add a test notification
4. Verify it appears

### 4. Test Installation

1. Open DevTools
2. Go to Application tab → Manifest
3. Verify manifest is loaded
4. Check for "Add to Home Screen" prompt

### 5. Test Background Sync

1. Go offline
2. Register for an event
3. Go online
4. Verify registration syncs automatically

## Lighthouse PWA Audit

Run Lighthouse to verify PWA compliance:

1. Open DevTools
2. Go to Lighthouse tab
3. Select "Progressive Web App" category
4. Click "Analyze page load"

Target scores:
- **PWA Optimized**: 100
- **Installable**: Yes
- **Works Offline**: Yes
- **Background Sync**: Yes

## Troubleshooting

### Service Worker Not Updating

```bash
# Clear all service workers
# In DevTools → Application → Service Workers
# Click "Unregister" for all service workers
# Then reload the page
```

### Push Notifications Not Working

1. Check VAPID keys are correct
2. Verify notification permission is granted
3. Check browser console for errors
4. Ensure service worker is active

### Offline Page Not Showing

1. Verify `/offline` page exists
2. Check service worker cache strategy
3. Ensure offline fallback is configured

### Cache Not Updating

```typescript
// Clear cache and reload
await clearAllCaches()
window.location.reload()
```

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | ⚠️* | ✅ |
| Background Sync | ✅ | ❌ | ❌ | ✅ |
| Installability | ✅ | ✅ | ⚠️** | ✅ |

*Safari has limited push notification support
**Safari requires HTTPS and specific meta tags

## Best Practices

### 1. Cache Strategy
- Use cache-first for static assets
- Use network-first for API calls
- Implement stale-while-revalidate for dynamic content

### 2. Update Management
- Show update notification when new version is available
- Allow user to choose when to update
- Skip waiting for immediate critical updates

### 3. Storage Management
- Implement cache size limits
- Clean up old caches periodically
- Handle quota exceeded errors gracefully

### 4. User Experience
- Always show online/offline status
- Provide clear offline messaging
- Queue actions for background sync
- Restore state when back online

### 5. Security
- Use HTTPS for production
- Validate push notification payloads
- Sanitize cached data
- Implement proper authentication

## Performance Optimization

### 1. Preload Critical Assets

```html
<link rel="preload" href="/manifest.json" as="fetch" crossorigin>
<link rel="preload" href="/sw.js" as="script">
```

### 2. Optimize Service Worker

```javascript
// Limit cache size
const MAX_CACHE_SIZE = 50

async function limitCacheSize(cacheName) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()

  if (keys.length > MAX_CACHE_SIZE) {
    await cache.delete(keys[0])
  }
}
```

### 3. Reduce Update Frequency

```javascript
// Check for updates every 24 hours instead of on every load
const UPDATE_INTERVAL = 24 * 60 * 60 * 1000

if (Date.now() - lastUpdateCheck > UPDATE_INTERVAL) {
  registration.update()
}
```

## Resources

- [PWA Best Practices](https://web.dev/pwa/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Web Push Protocol](https://tools.ietf.org/html/draft-ietf-webpush-protocol)

## Support

For issues or questions about PWA functionality, please refer to:
- `/lib/pwa-utils.ts` - PWA utility functions
- `/public/sw.js` - Service worker implementation
- `/public/manifest.json` - PWA manifest configuration
