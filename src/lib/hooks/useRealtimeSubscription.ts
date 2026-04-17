/**
 * Real-time Subscription Hooks
 * Subscribe to database changes in real-time
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type SubscriptionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface UseRealtimeSubscriptionOptions {
  table: string
  filter?: string
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE'
  enabled?: boolean
}

export interface UseRealtimeSubscriptionReturn {
  status: SubscriptionStatus
  error: Error | null
}

/**
 * Core real-time subscription hook
 */
export const useRealtimeSubscription = (
  options: UseRealtimeSubscriptionOptions,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
): UseRealtimeSubscriptionReturn => {
  const [status, setStatus] = useState<SubscriptionStatus>('connecting')
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!supabase) {
      setStatus('error')
      setError(new Error('Supabase not configured'))
      return
    }

    if (options.enabled === false) {
      return
    }

    setStatus('connecting')
    setError(null)

    // Create unique channel name
    const channelName = `${options.table}-${options.filter || 'all'}-${Date.now()}`

    // Create channel
    const channel = supabase.channel(channelName)

    // Subscribe to changes
    const subscription = channel.on(
      'postgres_changes' as any,
      {
        event: options.event || '*',
        schema: 'public',
        table: options.table,
        filter: options.filter,
      },
      (payload: RealtimePostgresChangesPayload<any>) => {
        setStatus('connected')
        callback(payload)
      }
    )

    // Subscribe to channel
    subscription.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        setStatus('connected')
      } else if (status === 'CHANNEL_ERROR') {
        setStatus('error')
        setError(new Error('Channel error'))
      } else if (status === 'TIMED_OUT') {
        setStatus('error')
        setError(new Error('Connection timeout'))
      }
    })

    channelRef.current = channel

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase?.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setStatus('disconnected')
    }
  }, [options.table, options.filter, options.event, options.enabled, callback])

  return { status, error }
}

/**
 * Subscribe to registrations changes for an event
 */
export const useRegistrationsRealtime = (
  eventId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void,
  enabled = true
) => {
  return useRealtimeSubscription(
    {
      table: 'registrations',
      filter: `event_id=eq.${eventId}`,
      enabled,
    },
    callback
  )
}

/**
 * Subscribe to all registrations (for dashboard)
 */
export const useAllRegistrationsRealtime = (
  callback: (payload: RealtimePostgresChangesPayload<any>) => void,
  enabled = true
) => {
  return useRealtimeSubscription(
    {
      table: 'registrations',
      enabled,
    },
    callback
  )
}

/**
 * Subscribe to event changes
 */
export const useEventsRealtime = (
  callback: (payload: RealtimePostgresChangesPayload<any>) => void,
  enabled = true
) => {
  return useRealtimeSubscription(
    {
      table: 'events',
      enabled,
    },
    callback
  )
}

/**
 * Subscribe to volunteer activity changes
 */
export const useVolunteerActivitiesRealtime = (
  volunteerId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void,
  enabled = true
) => {
  return useRealtimeSubscription(
    {
      table: 'volunteer_activities',
      filter: `volunteer_id=eq.${volunteerId}`,
      enabled,
    },
    callback
  )
}

/**
 * Subscribe to payment status changes
 */
export const usePaymentsRealtime = (
  callback: (payload: RealtimePostgresChangesPayload<any>) => void,
  enabled = true
) => {
  return useRealtimeSubscription(
    {
      table: 'payments',
      enabled,
    },
    callback
  )
}

/**
 * Subscribe to job posting changes
 */
export const useJobsRealtime = (
  callback: (payload: RealtimePostgresChangesPayload<any>) => void,
  enabled = true
) => {
  return useRealtimeSubscription(
    {
      table: 'job_postings',
      enabled,
    },
    callback
  )
}

/**
 * Multi-table subscription hook
 */
export const useMultiTableSubscription = (
  tables: string[],
  callback: (payload: RealtimePostgresChangesPayload<any>) => void,
  enabled = true
) => {
  const [statuses, setStatuses] = useState<Record<string, SubscriptionStatus>>({})
  const [errors, setErrors] = useState<Record<string, Error | null>>({})

  useEffect(() => {
    if (!supabase || !enabled) {
      return
    }

    const channels: RealtimeChannel[] = []

    tables.forEach((table) => {
      const channel = supabase!.channel(`${table}-multi-${Date.now()}`)

      channel.on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          setStatuses((prev) => ({ ...prev, [table]: 'connected' }))
          callback(payload)
        }
      )

      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setStatuses((prev) => ({ ...prev, [table]: 'connected' }))
        } else if (status === 'CHANNEL_ERROR') {
          setStatuses((prev) => ({ ...prev, [table]: 'error' }))
          setErrors((prev) => ({ ...prev, [table]: new Error('Channel error') }))
        }
      })

      channels.push(channel)
    })

    return () => {
      channels.forEach((channel) => supabase?.removeChannel(channel))
    }
  }, [tables, enabled, callback])

  return { statuses, errors }
}

/**
 * Hook to track real-time connection status
 */
export const useConnectionStatus = (): SubscriptionStatus => {
  const [status, setStatus] = useState<SubscriptionStatus>('connecting')

  useEffect(() => {
    if (!supabase) {
      setStatus('error')
      return
    }

    // Test connection with a simple channel
    const channel = supabase.channel('connection-test')

    channel
      .subscribe((s: string) => {
        if (s === 'SUBSCRIBED') {
          setStatus('connected')
          // Cleanup test channel
          supabase?.removeChannel(channel)
        }
      })

    // Timeout check
    const timeout = setTimeout(() => {
      if (status === 'connecting') {
        setStatus('error')
      }
    }, 5000)

    return () => {
      clearTimeout(timeout)
    }
  }, [status])

  return status
}
