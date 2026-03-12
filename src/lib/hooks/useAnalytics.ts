/**
 * Analytics Hooks with React Query
 * Cached and optimized analytics data fetching
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query/client'
import {
  getAnalytics,
  getUniversityPerformance,
  getEvents,
  getRegistrations,
  getVolunteers,
  getJobPostings,
} from '@/lib/supabase/queries'

// ============================================================================
// ANALYTICS HOOKS
// ============================================================================

/**
 * Get KPI analytics for date range
 */
export const useAnalytics = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: queryKeys.analytics.kpis(`${startDate}-${endDate}`),
    queryFn: () => getAnalytics(startDate, endDate),
    enabled: !!(startDate && endDate),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  })
}

/**
 * Get university performance stats
 */
export const useUniversityPerformance = () => {
  return useQuery({
    queryKey: queryKeys.analytics.university(),
    queryFn: getUniversityPerformance,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
}

/**
 * Get dashboard summary
 */
export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const [analytics, events, volunteers, jobs] = await Promise.all([
        getAnalytics(thirtyDaysAgo.toISOString(), now.toISOString()),
        getEvents({ is_published: true, limit: 5 }),
        getVolunteers({ limit: 10 }),
        getJobPostings({ status: 'active', limit: 5 }),
      ])

      // Access data from query results
      const analyticsData = (analytics as any)?.data || analytics
      const eventsData = (events as any)?.data || events
      const volunteersData = (volunteers as any)?.data || volunteers
      const jobsData = (jobs as any)?.data || jobs

      return {
        analytics: analyticsData,
        recentEvents: Array.isArray(eventsData) ? eventsData.slice(0, 5) : [],
        topVolunteers: Array.isArray(volunteersData) ? volunteersData.slice(0, 10) : [],
        activeJobs: Array.isArray(jobsData) ? jobsData.slice(0, 5) : [],
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// ============================================================================
// EVENT ANALYTICS HOOKS
// ============================================================================

/**
 * Get event statistics
 */
export const useEventStats = (eventId: string) => {
  return useQuery({
    queryKey: ['event-stats', eventId],
    queryFn: async () => {
      const registrations = await getRegistrations(eventId)

      // Handle different possible return structures
      const registrationsData = (registrations as any)?.data || registrations
      const registrationsArray = Array.isArray(registrationsData) ? registrationsData : []

      if (registrationsArray.length === 0) {
        return {
          totalRegistrations: 0,
          checkedInCount: 0,
          pendingCount: 0,
          confirmedCount: 0,
          cancelledCount: 0,
          totalRevenue: 0,
        }
      }

      const checkedIn = registrationsArray.filter((r: any) => r.checked_in_at).length
      const pending = registrationsArray.filter((r: any) => r.status === 'pending').length
      const confirmed = registrationsArray.filter((r: any) => r.status === 'confirmed').length
      const cancelled = registrationsArray.filter((r: any) => r.status === 'cancelled').length
      const revenue = registrationsArray
        .filter((r: any) => r.payment_status === 'paid')
        .reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0)

      return {
        totalRegistrations: registrationsArray.length,
        checkedInCount: checkedIn,
        pendingCount: pending,
        confirmedCount: confirmed,
        cancelledCount: cancelled,
        totalRevenue: revenue,
      }
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Get events with analytics
 */
export const useEventsWithAnalytics = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.events.list(JSON.stringify(filters)),
    queryFn: () => getEvents(filters),
    staleTime: 1000 * 60 * 5,
  })
}

// ============================================================================
// VOLUNTEER ANALYTICS HOOKS
// ============================================================================

/**
 * Get volunteer leaderboard
 */
export const useVolunteerLeaderboard = (tier?: string, limit = 10) => {
  return useQuery({
    queryKey: ['volunteer-leaderboard', tier, limit],
    queryFn: () => getVolunteers({ tier, limit }),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Get volunteer stats by user ID
 */
export const useVolunteerStats = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.volunteers.detail(userId),
    queryFn: () => getVolunteers({ tier: undefined, limit: 10 }),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })
}

// ============================================================================
// JOB ANALYTICS HOOKS
// ============================================================================

/**
 * Get job analytics
 */
export const useJobAnalytics = () => {
  return useQuery({
    queryKey: ['job-analytics'],
    queryFn: async () => {
      const jobs = await getJobPostings({})

      // Handle different possible return structures
      const jobsData = (jobs as any)?.data || jobs
      const jobsArray = Array.isArray(jobsData) ? jobsData : []

      if (jobsArray.length === 0) {
        return {
          totalJobs: 0,
          activeJobs: 0,
            totalApplications: 0,
          byIndustry: {},
          byType: {},
        }
      }

      const activeJobs = jobsArray.filter((j: any) => j.status === 'active').length
      const totalApplications = jobsArray.reduce((sum: number, j: any) => sum + (j.applicants_count || 0), 0)

      const byIndustry: Record<string, number> = {}
      const byType: Record<string, number> = {}

      jobsArray.forEach((job: any) => {
        if (job.industry) {
          byIndustry[job.industry] = (byIndustry[job.industry] || 0) + 1
        }
        if (job.job_type) {
          byType[job.job_type] = (byType[job.job_type] || 0) + 1
        }
      })

      return {
        totalJobs: jobsArray.length,
        activeJobs,
        totalApplications,
        byIndustry,
        byType,
      }
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Invalidate analytics queries
 */
export const useInvalidateAnalytics = () => {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all })
  }
}

/**
 * Prefetch analytics data
 */
export const usePrefetchAnalytics = (startDate: string, endDate: string) => {
  const queryClient = useQueryClient()

  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.analytics.kpis(`${startDate}-${endDate}`),
      queryFn: () => getAnalytics(startDate, endDate),
    })
  }
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Get date range for analytics
 */
export const useAnalyticsDateRange = (range: '7d' | '30d' | '90d' | '1y' = '30d') => {
  const now = new Date()
  let startDate: Date

  switch (range) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  return {
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
    range,
  }
}

/**
 * Format analytics data for charts
 */
export const useFormattedAnalytics = (data: any) => {
  if (!data) return null

  return {
    revenue: {
      current: data.totalRevenue || 0,
      formatted: new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
      }).format(data.totalRevenue || 0),
    },
    events: {
      current: data.totalEvents || 0,
      change: 0, // Calculate based on previous period
    },
    attendees: {
      current: data.totalAttendees || 0,
      change: 0,
    },
    checkInRate: {
      current: data.avgCheckinRate || 0,
      formatted: `${data.avgCheckinRate?.toFixed(1) || 0}%`,
    },
    volunteers: {
      current: data.totalVolunteers || 0,
      hours: data.totalHours || 0,
      formattedHours: `${data.totalHours?.toFixed(1) || 0}h`,
    },
    certifications: {
      current: data.certificationsIssued || 0,
    },
    jobs: {
      current: data.activeJobs || 0,
    },
  }
}
