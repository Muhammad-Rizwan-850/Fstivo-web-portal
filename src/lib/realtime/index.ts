/**
 * Real-time Subscriptions Module
 * Exports all real-time hooks and subscriptions
 */

// ============================================================================
// TYPES
// ============================================================================
export type { RealtimeEvent, SubscriptionStatus, SubscriptionOptions } from './subscriptions'

// ============================================================================
// SUBSCRIPTION HOOKS
// ============================================================================
export {
  useEventSubscription,
  useRegistrationsSubscription,
  useCheckInSubscription,
  useMyRegistrationsSubscription,
  usePaymentStatusSubscription,
  broadcastToEventChannel,
  getActiveSubscriptionsCount,
} from './subscriptions'

// ============================================================================
// LIVE DATA HOOKS
// ============================================================================
export {
  useLiveRegistrationCount,
  useLiveCheckInCount,
  useLiveEvent,
  useLivePaymentStatus,
  useLiveMyRegistrations,
  useMultiSubscription,
  usePresence,
  useRealtimeNotifications,
} from './hooks'
