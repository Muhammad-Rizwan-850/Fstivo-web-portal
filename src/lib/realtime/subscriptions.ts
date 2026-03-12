/**
 * Real-time Subscriptions using Supabase Realtime
 * Live updates for events, registrations, and check-ins
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/auth/client'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type RealtimeEvent<T = Record<string, unknown>> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  old: T | null
  new: T | null
}

export type SubscriptionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface SubscriptionOptions {
  enabled?: boolean
  onError?: (error: Error) => void
}

// ============================================================================
// REALTIME HOOKS
// ============================================================================

/**
 * Subscribe to event changes
 * @param eventId - Event ID to subscribe to (or null for all events)
 * @param callback - Callback function when event changes
 * @param options - Subscription options
 */
export function useEventSubscription(
  eventId: string | null,
  callback: (payload: RealtimeEvent) => void,
  options: SubscriptionOptions = {}
) {
  const { enabled = true, onError } = options
  const [status, setStatus] = useState<SubscriptionStatus>('disconnected')
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) return

    let channel: RealtimeChannel | null = null
    let isSubscribed = true
    let supabaseClient: ReturnType<typeof createClient> | null = null

    const setupSubscription = async () => {
      try {
        supabaseClient = createClient()
        if (!supabaseClient) {
          setStatus('error')
          onError?.(new Error('Supabase client not configured'))
          return
        }
        setStatus('connecting')

        // Create channel name
        const channelName = eventId
          ? `event:${eventId}`
          : 'events'

        channel = supabaseClient
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'events',
              filter: eventId ? `id=eq.${eventId}` : undefined,
            },
            (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
              if (isSubscribed) {
                callback({
                  eventType: payload.eventType,
                  table: payload.table,
                  schema: payload.schema,
                  old: payload.old,
                  new: payload.new,
                })
              }
            }
          )
          .subscribe((subscriptionStatus: string) => {
            if (!isSubscribed) return

            if (subscriptionStatus === 'SUBSCRIBED') {
              setStatus('connected')
            } else if (subscriptionStatus === 'CHANNEL_ERROR' || subscriptionStatus === 'TIMED_OUT') {
              setStatus('error')
            } else if (subscriptionStatus === 'CLOSED') {
              setStatus('disconnected')
            }
          })

        channelRef.current = channel
      } catch (error) {
        logger.error('[Realtime] Failed to setup event subscription:', error)
        setStatus('error')
        onError?.(error as Error)
      }
    }

    setupSubscription()

    // Cleanup
    return () => {
      isSubscribed = false
      if (channel && supabaseClient) {
        supabaseClient.removeChannel(channel)
      }
      channelRef.current = null
      setStatus('disconnected')
    }
  }, [eventId, enabled, onError])

  return { status }
}

/**
 * Subscribe to registration changes for an event
 * @param eventId - Event ID to watch registrations for
 * @param callback - Callback when registration changes
 * @param options - Subscription options
 */
export function useRegistrationsSubscription(
  eventId: string,
  callback: (payload: RealtimeEvent) => void,
  options: SubscriptionOptions = {}
) {
  const { enabled = true, onError } = options
  const [status, setStatus] = useState<SubscriptionStatus>('disconnected')
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled || !eventId) return

    let channel: RealtimeChannel | null = null
    let isSubscribed = true
    let supabaseClient: ReturnType<typeof createClient> | null = null

    const setupSubscription = async () => {
      try {
        supabaseClient = createClient()
        if (!supabaseClient) {
          setStatus('error')
          onError?.(new Error('Supabase client not configured'))
          return
        }
        setStatus('connecting')

        channel = supabaseClient
          .channel(`event:${eventId}:registrations`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'registrations',
              filter: `event_id=eq.${eventId}`,
            },
            (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
              if (isSubscribed) {
                callback({
                  eventType: payload.eventType,
                  table: payload.table,
                  schema: payload.schema,
                  old: payload.old,
                  new: payload.new,
                })
              }
            }
          )
          .subscribe((subscriptionStatus: string) => {
            if (!isSubscribed) return

            if (subscriptionStatus === 'SUBSCRIBED') {
              setStatus('connected')
            } else if (subscriptionStatus === 'CHANNEL_ERROR' || subscriptionStatus === 'TIMED_OUT') {
              setStatus('error')
            } else if (subscriptionStatus === 'CLOSED') {
              setStatus('disconnected')
            }
          })

        channelRef.current = channel
      } catch (error) {
        logger.error('[Realtime] Failed to setup registrations subscription:', error)
        setStatus('error')
        onError?.(error as Error)
      }
    }

    setupSubscription()

    return () => {
      isSubscribed = false
      if (channel && supabaseClient) {
        supabaseClient.removeChannel(channel)
      }
      channelRef.current = null
      setStatus('disconnected')
    }
  }, [eventId, enabled, onError])

  return { status }
}

/**
 * Subscribe to check-in updates for an event
 * @param eventId - Event ID to watch check-ins for
 * @param callback - Callback when attendee checks in
 * @param options - Subscription options
 */
export function useCheckInSubscription(
  eventId: string,
  callback: (payload: RealtimeEvent) => void,
  options: SubscriptionOptions = {}
) {
  const { enabled = true, onError } = options
  const [status, setStatus] = useState<SubscriptionStatus>('disconnected')
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled || !eventId) return

    let channel: RealtimeChannel | null = null
    let isSubscribed = true
    let supabaseClient: ReturnType<typeof createClient> | null = null

    const setupSubscription = async () => {
      try {
        supabaseClient = createClient()
        if (!supabaseClient) {
          setStatus('error')
          onError?.(new Error('Supabase client not configured'))
          return
        }
        setStatus('connecting')

        channel = supabaseClient
          .channel(`event:${eventId}:checkins`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'registrations',
              filter: `event_id=eq.${eventId}`,
            },
            (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
              // Only trigger on check-in updates
              const newRec = payload.new as Record<string, unknown> | null
              const oldRec = payload.old as Record<string, unknown> | null
              if (isSubscribed && newRec?.checked_in_at !== oldRec?.checked_in_at) {
                callback({
                  eventType: payload.eventType,
                  table: payload.table,
                  schema: payload.schema,
                  old: payload.old,
                  new: payload.new,
                })
              }
            }
          )
          .subscribe((subscriptionStatus: string) => {
            if (!isSubscribed) return

            if (subscriptionStatus === 'SUBSCRIBED') {
              setStatus('connected')
            } else if (subscriptionStatus === 'CHANNEL_ERROR' || subscriptionStatus === 'TIMED_OUT') {
              setStatus('error')
            } else if (subscriptionStatus === 'CLOSED') {
              setStatus('disconnected')
            }
          })

        channelRef.current = channel
      } catch (error) {
        logger.error('[Realtime] Failed to setup check-in subscription:', error)
        setStatus('error')
        onError?.(error as Error)
      }
    }

    setupSubscription()

    return () => {
      isSubscribed = false
      if (channel && supabaseClient) {
        supabaseClient.removeChannel(channel)
      }
      channelRef.current = null
      setStatus('disconnected')
    }
  }, [eventId, enabled, onError])

  return { status }
}

/**
 * Subscribe to user's own registrations
 * @param userId - User ID to watch registrations for
 * @param callback - Callback when user's registration changes
 * @param options - Subscription options
 */
export function useMyRegistrationsSubscription(
  userId: string | null,
  callback: (payload: RealtimeEvent) => void,
  options: SubscriptionOptions = {}
) {
  const { enabled = true, onError } = options
  const [status, setStatus] = useState<SubscriptionStatus>('disconnected')
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled || !userId) return

    let channel: RealtimeChannel | null = null
    let isSubscribed = true
    let supabaseClient: ReturnType<typeof createClient> | null = null

    const setupSubscription = async () => {
      try {
        supabaseClient = createClient()
        if (!supabaseClient) {
          setStatus('error')
          onError?.(new Error('Supabase client not configured'))
          return
        }
        setStatus('connecting')

        channel = supabaseClient
          .channel(`user:${userId}:registrations`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'registrations',
              filter: `user_id=eq.${userId}`,
            },
            (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
              if (isSubscribed) {
                callback({
                  eventType: payload.eventType,
                  table: payload.table,
                  schema: payload.schema,
                  old: payload.old,
                  new: payload.new,
                })
              }
            }
          )
          .subscribe((subscriptionStatus: string) => {
            if (!isSubscribed) return

            if (subscriptionStatus === 'SUBSCRIBED') {
              setStatus('connected')
            } else if (subscriptionStatus === 'CHANNEL_ERROR' || subscriptionStatus === 'TIMED_OUT') {
              setStatus('error')
            } else if (subscriptionStatus === 'CLOSED') {
              setStatus('disconnected')
            }
          })

        channelRef.current = channel
      } catch (error) {
        logger.error('[Realtime] Failed to setup my registrations subscription:', error)
        setStatus('error')
        onError?.(error as Error)
      }
    }

    setupSubscription()

    return () => {
      isSubscribed = false
      if (channel && supabaseClient) {
        supabaseClient.removeChannel(channel)
      }
      channelRef.current = null
      setStatus('disconnected')
    }
  }, [userId, enabled, onError])

  return { status }
}

/**
 * Subscribe to payment status updates
 * @param registrationId - Registration ID to watch
 * @param callback - Callback when payment status changes
 * @param options - Subscription options
 */
export function usePaymentStatusSubscription(
  registrationId: string,
  callback: (payload: RealtimeEvent) => void,
  options: SubscriptionOptions = {}
) {
  const { enabled = true, onError } = options
  const [status, setStatus] = useState<SubscriptionStatus>('disconnected')
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled || !registrationId) return

    let channel: RealtimeChannel | null = null
    let isSubscribed = true
    let supabaseClient: ReturnType<typeof createClient> | null = null

    const setupSubscription = async () => {
      try {
        supabaseClient = createClient()
        if (!supabaseClient) {
          setStatus('error')
          onError?.(new Error('Supabase client not configured'))
          return
        }
        setStatus('connecting')

        channel = supabaseClient
          .channel(`registration:${registrationId}:payment`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'registrations',
              filter: `id=eq.${registrationId}`,
            },
            (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
              // Only trigger on payment status changes
              const newRec = payload.new as Record<string, unknown> | null
              const oldRec = payload.old as Record<string, unknown> | null
              if (isSubscribed && newRec?.payment_status !== oldRec?.payment_status) {
                callback({
                  eventType: payload.eventType,
                  table: payload.table,
                  schema: payload.schema,
                  old: payload.old,
                  new: payload.new,
                })
              }
            }
          )
          .subscribe((subscriptionStatus: string) => {
            if (!isSubscribed) return

            if (subscriptionStatus === 'SUBSCRIBED') {
              setStatus('connected')
            } else if (subscriptionStatus === 'CHANNEL_ERROR' || subscriptionStatus === 'TIMED_OUT') {
              setStatus('error')
            } else if (subscriptionStatus === 'CLOSED') {
              setStatus('disconnected')
            }
          })

        channelRef.current = channel
      } catch (error) {
        logger.error('[Realtime] Failed to setup payment status subscription:', error)
        setStatus('error')
        onError?.(error as Error)
      }
    }

    setupSubscription()

    return () => {
      isSubscribed = false
      if (channel && supabaseClient) {
        supabaseClient.removeChannel(channel)
      }
      channelRef.current = null
      setStatus('disconnected')
    }
  }, [registrationId, enabled, onError])

  return { status }
}

/**
 * Broadcast message to all subscribers of an event
 * Can be used to trigger manual refreshes or notifications
 */
export async function broadcastToEventChannel(
  eventId: string,
  message: {
    type: 'refresh' | 'notification' | 'checkin'
    data: Record<string, unknown>
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return { success: false, error: 'Supabase client not configured' }
    }
    const channel = supabase.channel(`event:${eventId}`)

    // Send broadcast
    channel.send({
      type: 'broadcast',
      event: message.type,
      payload: message.data,
    })

    return { success: true }
  } catch (error) {
    logger.error('[Realtime] Failed to broadcast:', error)
    return { success: false, error: 'Failed to broadcast message' }
  }
}

/**
 * Get active subscriptions count for an event (admin/organizer only)
 */
export async function getActiveSubscriptionsCount(
  eventId: string
): Promise<{ count: number; error?: string }> {
  // Note: Supabase Realtime doesn't expose subscription count
  // This is a placeholder that could be implemented with custom tracking
  return { count: 0 }
}
