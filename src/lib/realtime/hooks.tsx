/**
 * Real-time React Hooks for Fstivo Platform
 * Live updates for events, registrations, and check-ins
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useEventSubscription, useRegistrationsSubscription, useCheckInSubscription, useMyRegistrationsSubscription, usePaymentStatusSubscription } from './subscriptions'
import type { RealtimeEvent } from './subscriptions'
import { logger } from '@/lib/logger';

// ============================================================================
// LIVE DATA HOOKS
// ============================================================================

/**
 * Hook for live registration count
 * @param eventId - Event ID to watch
 */
export function useLiveRegistrationCount(eventId: string) {
  const [count, setCount] = useState<number>(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const handleChange = useCallback((payload: RealtimeEvent) => {
    if (payload.eventType === 'INSERT') {
      setCount((prev) => prev + 1)
      setLastUpdate(new Date())
    } else if (payload.eventType === 'DELETE') {
      setCount((prev) => Math.max(0, prev - 1))
      setLastUpdate(new Date())
    }
  }, [])

  const { status } = useRegistrationsSubscription(eventId, handleChange)

  // Initial fetch
  useEffect(() => {
    if (eventId && status === 'connected') {
      // Fetch initial count
      fetch(`/api/events/${eventId}/registrations-count`)
        .then((res) => res.json())
        .then((data) => {
          if (data.count !== undefined) {
            setCount(data.count)
          }
        })
        .catch((err) => {
          logger.error('[Realtime] Failed to fetch initial count:', err)
        })
    }
  }, [eventId, status])

  return { count, lastUpdate, status }
}

/**
 * Hook for live check-in count
 * @param eventId - Event ID to watch
 */
export function useLiveCheckInCount(eventId: string) {
  const [count, setCount] = useState<number>(0)
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null)
  const [recentCheckIns, setRecentCheckIns] = useState<Array<{
    id: string
    name: string
    time: Date
  }>>([])

  const handleChange = useCallback((payload: RealtimeEvent) => {
    if (payload.new && payload.old) {
      const newRec = payload.new as Record<string, unknown>
      const oldRec = payload.old as Record<string, unknown>
      if (newRec.checked_in_at && !oldRec.checked_in_at) {
        // New check-in
        const user = newRec.user as Record<string, unknown> | undefined
        const attendeeName = (user?.full_name as string) || 'Attendee'

        setCount((prev) => prev + 1)
        setLastCheckIn(new Date())
        setRecentCheckIns((prev) => [
          {
            id: newRec.id as string,
            name: attendeeName,
            time: new Date(newRec.checked_in_at as string | number),
          },
          ...prev,
        ].slice(0, 10)) // Keep last 10
      }
    }
  }, [])

  const { status } = useCheckInSubscription(eventId, handleChange)

  // Initial fetch
  useEffect(() => {
    if (eventId && status === 'connected') {
      fetch(`/api/events/${eventId}/stats`)
        .then((res) => res.json())
        .then((data) => {
          if (data.stats?.total_checked_in !== undefined) {
            setCount(data.stats.total_checked_in)
          }
        })
        .catch((err) => {
          logger.error('[Realtime] Failed to fetch initial check-in count:', err)
        })
    }
  }, [eventId, status])

  return { count, lastCheckIn, recentCheckIns, status }
}

/**
 * Hook for live event data updates
 * @param eventId - Event ID to watch
 */
export function useLiveEvent(eventId: string | null) {
  const [event, setEvent] = useState<any>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleChange = useCallback((payload: RealtimeEvent) => {
    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
      setEvent(payload.new)
      setIsUpdating(true)
      setTimeout(() => setIsUpdating(false), 500) // Flash effect
    } else if (payload.eventType === 'DELETE') {
      setEvent(null)
    }
  }, [])

  const { status } = useEventSubscription(eventId, handleChange, { enabled: !!eventId })

  // Initial fetch
  useEffect(() => {
    if (eventId && status === 'connected') {
      fetch(`/api/events/${eventId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.event) {
            setEvent(data.event)
          }
        })
        .catch((err) => {
          logger.error('[Realtime] Failed to fetch initial event:', err)
        })
    }
  }, [eventId, status])

  return { event, isUpdating, status }
}

/**
 * Hook for live payment status
 * @param registrationId - Registration ID to watch
 */
export function useLivePaymentStatus(registrationId: string) {
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const handleChange = useCallback((payload: RealtimeEvent) => {
    if (payload.new && payload.old) {
      const newRec = payload.new as Record<string, unknown>
      const oldRec = payload.old as Record<string, unknown>
      if (newRec.payment_status !== oldRec.payment_status) {
        setPaymentStatus((newRec.payment_status as string) || null)
        setLastUpdate(new Date())
      }
    }
  }, [])

  const { status } = usePaymentStatusSubscription(registrationId, handleChange, {
    enabled: !!registrationId
  })

  // Initial fetch
  useEffect(() => {
    if (registrationId && status === 'connected') {
      fetch(`/api/registrations/${registrationId}/payment`)
        .then((res) => res.json())
        .then((data) => {
          if (data.payment?.payment_status) {
            setPaymentStatus(data.payment.payment_status)
          }
        })
        .catch((err) => {
          logger.error('[Realtime] Failed to fetch initial payment status:', err)
        })
    }
  }, [registrationId, status])

  return { paymentStatus, lastUpdate, status }
}

/**
 * Hook for live user registrations
 * @param userId - User ID to watch (defaults to current user)
 */
export function useLiveMyRegistrations(userId: string | null = null) {
  const [registrations, setRegistrations] = useState<any[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const handleChange = useCallback((payload: RealtimeEvent) => {
    if (payload.eventType === 'INSERT' && payload.new) {
      setRegistrations((prev) => [payload.new, ...prev])
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      const newRec = payload.new as Record<string, unknown>
      setRegistrations((prev) =>
        prev.map((reg) =>
          (reg as Record<string, unknown>).id === newRec.id ? newRec : reg
        )
      )
    } else if (payload.eventType === 'DELETE' && payload.old) {
      const oldRec = payload.old as Record<string, unknown>
      setRegistrations((prev) => prev.filter((reg) => (reg as Record<string, unknown>).id !== oldRec.id))
    }
  }, [])

  // Get current user if userId not provided
  useEffect(() => {
    async function getCurrentUser() {
      if (!userId) {
        const { createClient } = await import('@/lib/auth/client')
        const supabase = createClient()
        if (!supabase) return null
        const { data: { user } } = await supabase.auth.getUser()
        return user?.id || null
      }
      return userId
    }

    let currentUserId = userId
    if (!userId) {
      getCurrentUser().then((id) => {
        if (id) currentUserId = id
      })
    }
  }, [userId])

  const { status } = useMyRegistrationsSubscription(userId || '', handleChange, {
    enabled: !!userId
  })

  // Initial fetch
  useEffect(() => {
    if (userId && status === 'connected') {
      fetch(`/api/registrations?user_id=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.registrations) {
            setRegistrations(data.registrations)
            setIsInitialLoad(false)
          }
        })
        .catch((err) => {
          logger.error('[Realtime] Failed to fetch my registrations:', err)
          setIsInitialLoad(false)
        })
    }
  }, [userId, status])

  return { registrations, isInitialLoad, status }
}

/**
 * Hook for multiple real-time subscriptions
 * Useful for dashboards that need multiple live data sources
 */
export function useMultiSubscription(subscriptions: Array<{
  type: 'event' | 'registrations' | 'checkins' | 'payment'
  id: string
  callback: (payload: RealtimeEvent) => void
}>) {
  const [statuses, setStatuses] = useState<Record<string, 'connecting' | 'connected' | 'disconnected' | 'error'>>({})

  // Use individual hooks for each subscription
  const subscriptionsArray = subscriptions.map((sub) => {
    const hook =
      sub.type === 'event'
        ? useEventSubscription
        : sub.type === 'registrations'
        ? useRegistrationsSubscription
        : sub.type === 'checkins'
        ? useCheckInSubscription
        : usePaymentStatusSubscription

    const { status } = hook(sub.id, sub.callback)

    return { id: sub.id, status }
  })

  // Update statuses
  useEffect(() => {
    const newStatuses: Record<string, 'connecting' | 'connected' | 'disconnected' | 'error'> = {}
    subscriptionsArray.forEach(({ id, status }) => {
      newStatuses[id] = status
    })
    setStatuses(newStatuses)
  }, [subscriptionsArray])

  const allConnected = Object.values(statuses).every((s) => s === 'connected')
  const anyConnected = Object.values(statuses).some((s) => s === 'connected')

  return {
    statuses,
    allConnected,
    anyConnected,
    totalSubscriptions: subscriptions.length,
    connectedCount: Object.values(statuses).filter((s) => s === 'connected').length,
  }
}

/**
 * Hook for presence tracking (user online/offline status)
 * @param channel - Channel name for presence
 */
export function usePresence(channel: string) {
  const [presence, setPresence] = useState<Record<string, any>>({})
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    let isSubscribed = true

    const setupPresence = async (): Promise<(() => void) | undefined> => {
      try {
        const { createClient } = await import('@/lib/auth/client')
        const supabase = createClient()
        if (!supabase) return

        const presenceChannel = supabase.channel(channel)

        // Subscribe to presence
        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            if (!isSubscribed) return
            const state = presenceChannel.presenceState()
            setPresence(state)
            setOnlineCount(Object.keys(state).length)
          })
          .subscribe()

        // Set own presence
        presenceChannel.on('presence', { event: 'join' }, async () => {
          // Track current user's presence
        })

        return () => {
          supabase.removeChannel(presenceChannel)
        }
      } catch (error) {
        logger.error('[Realtime] Failed to setup presence:', error)
        return undefined
      }
    }

    const cleanup = setupPresence()

    return () => {
      isSubscribed = false
      cleanup?.then((fn) => fn?.())
    }
  }, [channel])

  return { presence, onlineCount }
}

/**
 * Hook for real-time notifications
 * @param userId - User ID to receive notifications for
 */
export function useRealtimeNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: string
    message: string
    data: any
    createdAt: Date
    read: boolean
  }>>([])

  useEffect(() => {
    // This would integrate with a notifications system
    // For now, it's a placeholder for future implementation
    const channel = new BroadcastChannel(`notifications:${userId}`)

    const handleMessage = (event: MessageEvent) => {
      const notification = JSON.parse(event.data)
      setNotifications((prev) => [notification, ...prev].slice(0, 50))
    }

    channel.addEventListener('message', handleMessage)

    return () => {
      channel.removeEventListener('message', handleMessage)
    }
  }, [userId])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    )
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    unreadCount: notifications.filter((n) => !n.read).length,
  }
}
