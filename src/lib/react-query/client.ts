/**
 * React Query Configuration
 * Centralized query client with optimal defaults
 */

import { QueryClient } from '@tanstack/react-query'

/**
 * Create configured QueryClient instance
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in milliseconds after which data is considered stale
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Time in milliseconds that inactive data will remain in cache
      gcTime: 1000 * 60 * 30, // 30 minutes

      // Refetch on window focus
      refetchOnWindowFocus: false,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Number of retries on failure
      retry: 1,

      // Retry delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Throw errors by default (we'll handle them in components)
      throwOnError: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,

      // Don't throw errors by default
      throwOnError: false,
    },
  },
})

/**
 * Query keys factory
 * Centralize all query keys for easy invalidation
 */
export const queryKeys = {
  // Events
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.events.lists(), { filters }] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.events.details(), id] as const,
    bySlug: (slug: string) => [...queryKeys.events.details(), slug] as const,
  },

  // Registrations
  registrations: {
    all: ['registrations'] as const,
    lists: () => [...queryKeys.registrations.all, 'list'] as const,
    list: (eventId: string) => [...queryKeys.registrations.lists(), eventId] as const,
    details: () => [...queryKeys.registrations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.registrations.details(), id] as const,
    byTicketNumber: (ticketNumber: string) =>
      [...queryKeys.registrations.details(), ticketNumber] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // Volunteers
  volunteers: {
    all: ['volunteers'] as const,
    lists: () => [...queryKeys.volunteers.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.volunteers.lists(), { filters }] as const,
    details: () => [...queryKeys.volunteers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.volunteers.details(), id] as const,
    activities: (id: string) => [...queryKeys.volunteers.all, 'activity', id] as const,
  },

  // Certifications
  certifications: {
    all: ['certifications'] as const,
    lists: () => [...queryKeys.certifications.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.certifications.lists(), userId] as const,
    details: () => [...queryKeys.certifications.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.certifications.details(), id] as const,
  },

  // Jobs
  jobs: {
    all: ['jobs'] as const,
    lists: () => [...queryKeys.jobs.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.jobs.lists(), { filters }] as const,
    details: () => [...queryKeys.jobs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.jobs.details(), id] as const,
    bySlug: (slug: string) => [...queryKeys.jobs.details(), slug] as const,
  },

  // Corporate Partners
  corporatePartners: {
    all: ['corporate-partners'] as const,
    lists: () => [...queryKeys.corporatePartners.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.corporatePartners.lists(), { filters }] as const,
    details: () => [...queryKeys.corporatePartners.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.corporatePartners.details(), id] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    kpis: (range: string) => [...queryKeys.analytics.all, 'kpi', range] as const,
    university: () => [...queryKeys.analytics.all, 'university'] as const,
  },

  // Categories & Fields
  categories: {
    all: ['categories'] as const,
  },
  fields: {
    all: ['fields'] as const,
    byCategory: (categoryId: string) => [...queryKeys.fields.all, categoryId] as const,
  },

  // Organizations
  organizations: {
    all: ['organizations'] as const,
    lists: () => [...queryKeys.organizations.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.organizations.lists(), { filters }] as const,
    details: () => [...queryKeys.organizations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.organizations.details(), id] as const,
  },
}

/**
 * Invalidate multiple queries
 */
export const invalidateQueries = (keys: readonly any[][]) => {
  keys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: key })
  })
}

/**
 * Reset all queries
 */
export const resetAllQueries = () => {
  queryClient.resetQueries()
}

/**
 * Clear all queries from cache
 */
export const clearAllQueries = () => {
  queryClient.clear()
}

export default queryClient
