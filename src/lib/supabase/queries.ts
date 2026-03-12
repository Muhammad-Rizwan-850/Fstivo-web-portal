/**
 * Supabase Query Utilities
 * Type-safe query functions for all database operations
 */

import { supabase } from './client'
import { logger } from '@/lib/logger';
import type {
  EventCategory,
} from '@/lib/types'

type QueryResult<T> = { data: T | null; error: Error | null }
type QueryListResult<T> = { data: T[] | null; error: Error | null }

// Define types inline for queries
type Certification = any
type CorporatePartner = any
type JobPosting = any

// ============================================================================
// EVENTS QUERIES
// ============================================================================

export interface EventFilters {
  category_id?: string
  field_id?: string
  search?: string
  start_date?: string
  end_date?: string
  status?: string
  is_published?: boolean
  organizer_id?: string
  limit?: number
  offset?: number
}

/**
 * Get events with filters
 */
export const getEvents = async (filters: EventFilters = {}): Promise<QueryListResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    let query = supabase
      .from('events')
      .select(`
        *,
        organizer:profiles(id, full_name, email, avatar_url),
        category:event_categories(id, name, slug, icon, color),
        field:event_fields(id, name, slug),
        organization:organizations(id, name, logo_url)
      `)
      .is('deleted_at', null)
      .order('start_date', { ascending: true })

    // Apply filters
    if (filters.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published)
    }
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters.field_id) {
      query = query.eq('field_id', filters.field_id)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.organizer_id) {
      query = query.eq('organizer_id', filters.organizer_id)
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`)
    }
    if (filters.start_date) {
      query = query.gte('start_date', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('end_date', filters.end_date)
    }
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching events:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get event by ID
 */
export const getEventById = async (id: string): Promise<QueryResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:profiles(id, full_name, email, avatar_url, phone),
        category:event_categories(id, name, icon, color),
        field:event_fields(id, name, slug),
        organization:organizations(id, name, logo_url, website),
        ticket_types(*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching event:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get event by slug
 */
export const getEventBySlug = async (slug: string): Promise<QueryResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:profiles(id, full_name, email, avatar_url),
        category:event_categories(id, name, icon, color),
        field:event_fields(id, name, slug),
        organization:organizations(id, name, logo_url),
        ticket_types(*)
      `)
      .eq('slug', slug)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching event by slug:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get event categories
 */
export const getEventCategories = async (): Promise<QueryListResult<EventCategory>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('event_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order')

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching categories:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get event fields by category
 */
export const getEventFields = async (categoryId?: string): Promise<QueryListResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    let query = supabase
      .from('event_fields')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching fields:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// REGISTRATIONS QUERIES
// ============================================================================

/**
 * Get registrations for an event
 */
export const getRegistrations = async (eventId: string): Promise<QueryListResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        user:profiles(id, full_name, email, avatar_url),
        ticket_type:ticket_types(id, name, price)
      `)
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching registrations:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get registration by ID
 */
export const getRegistrationById = async (id: string): Promise<QueryResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        event:events(id, title, start_date, venue_city),
        user:profiles(id, full_name, email),
        ticket_type:ticket_types(id, name, price)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching registration:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get registrations by ticket number
 */
export const getRegistrationByTicketNumber = async (ticketNumber: string): Promise<QueryResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        event:events(id, title, start_date, venue_city, venue_name),
        user:profiles(id, full_name, email),
        ticket_type:ticket_types(id, name)
      `)
      .eq('registration_number', ticketNumber)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching registration by ticket:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Create registration
 */
export const createRegistration = async (registrationData: any): Promise<QueryResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await (supabase
      .from('registrations') as any)
      .insert([registrationData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error creating registration:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update registration
 */
export const updateRegistration = async (id: string, updates: any): Promise<QueryResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await (supabase
      .from('registrations') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error updating registration:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Check in attendee
 */
export const checkInAttendee = async (registrationId: string, checkedInBy: string): Promise<QueryResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await (supabase
      .from('registrations') as any)
      .update({
        checked_in_at: new Date().toISOString(),
        check_in_method: 'qr_scan',
        status: 'attended',
      })
      .eq('id', registrationId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error checking in attendee:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// USERS & PROFILES QUERIES
// ============================================================================

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<QueryResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        organization:organizations(id, name, logo_url)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching user:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<QueryResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching user by email:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Update user profile
 */
export const updateUserProfile = async (id: string, updates: any): Promise<QueryResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await (supabase
      .from('profiles') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error updating user profile:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// VOLUNTEERS QUERIES
// ============================================================================

/**
 * Get volunteer profile by user ID
 */
export const getVolunteerProfile = async (userId: string): Promise<QueryResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('volunteers')
      .select(`
        *,
        user:profiles(id, full_name, email, avatar_url),
        activities:volunteer_activities(
          *,
          event:events(id, title, start_date)
        )
      `)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching volunteer profile:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get all volunteers
 */
export const getVolunteers = async (filters: { tier?: string; limit?: number } = {}): Promise<QueryListResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    let query = supabase
      .from('volunteers')
      .select(`
        *,
        user:profiles(id, full_name, email, avatar_url)
      `)
      .order('total_points', { ascending: false })

    if (filters.tier) {
      query = query.eq('tier', filters.tier)
    }
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching volunteers:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Log volunteer activity
 */
export const logVolunteerActivity = async (activityData: any): Promise<QueryResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await (supabase
      .from('volunteer_activities') as any)
      .insert([activityData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error logging activity:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get activity points configuration
 */
export const getActivityPoints = async (): Promise<QueryListResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('activity_points')
      .select('*')
      .eq('is_active', true)
      .order('base_points')

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching activity points:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// CERTIFICATIONS QUERIES
// ============================================================================

/**
 * Get user certifications
 */
export const getUserCertifications = async (userId: string): Promise<QueryListResult<Certification>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('certifications')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('issue_date', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching certifications:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Verify certificate by number
 */
export const verifyCertificate = async (certificateNumber: string): Promise<QueryResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('certifications')
      .select(`
        *,
        user:profiles(id, full_name, email)
      `)
      .eq('certificate_number', certificateNumber)
      .eq('status', 'active')
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error verifying certificate:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// CORPORATE PARTNERS & JOBS QUERIES
// ============================================================================

/**
 * Get corporate partners
 */
export const getCorporatePartners = async (filters: { tier?: string; status?: string } = {}): Promise<QueryListResult<CorporatePartner>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    let query = supabase
      .from('corporate_partners')
      .select('*')
      .order('company_name')

    if (filters.tier) {
      query = query.eq('partnership_tier', filters.tier)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching corporate partners:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get job postings
 */
export const getJobPostings = async (filters: { status?: string; company_id?: string; limit?: number } = {}): Promise<QueryListResult<JobPosting>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    let query = supabase
      .from('job_postings')
      .select(`
        *,
        company:corporate_partners(id, company_name, logo_url, industry)
      `)
      .order('created_at', { ascending: false })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.company_id) {
      query = query.eq('company_id', filters.company_id)
    }
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching job postings:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get job by slug
 */
export const getJobBySlug = async (slug: string): Promise<QueryResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('job_postings')
      .select(`
        *,
        company:corporate_partners(*)
      `)
      .eq('slug', slug)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching job:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

export interface AnalyticsData {
  totalRevenue: number
  totalEvents: number
  totalAttendees: number
  avgCheckinRate: number
  totalVolunteers: number
  totalHours: number
  certificationsIssued: number
  activeJobs: number
}

/**
 * Get analytics for date range
 */
export const getAnalytics = async (startDate: string, endDate: string): Promise<QueryResult<AnalyticsData>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    // Get payments total
    const { data: payments, error: paymentsError } = await (supabase
      .from('registrations')
      .select('total_amount')
      .eq('payment_status', 'paid')
      .gte('registered_at', startDate)
      .lte('registered_at', endDate) as any)

    if (paymentsError) throw paymentsError

    // Get events count
    const { count: eventsCount, error: eventsError } = await (supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate) as any)

    if (eventsError) throw eventsError

    // Get registrations count
    const { count: attendeesCount, error: attendeesError } = await (supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('registered_at', startDate)
      .lte('registered_at', endDate) as any)

    if (attendeesError) throw attendeesError

    // Get check-ins
    const { data: checkins, error: checkinsError } = await (supabase
      .from('registrations')
      .select('checked_in_at')
      .eq('status', 'confirmed')
      .gte('registered_at', startDate)
      .lte('registered_at', endDate) as any)

    if (checkinsError) throw checkinsError

    // Calculate totals
    const totalRevenue = payments?.reduce((sum: number, p: any) => sum + (p.total_amount || 0), 0) || 0
    const checkedInCount = checkins?.filter((c: any) => c.checked_in_at)!.length || 0
    const avgCheckinRate = checkins?.length ? (checkedInCount / checkins.length) * 100 : 0

    // Get volunteer stats
    const { data: volunteerData } = await (supabase
      .from('volunteer_activities')
      .select('hours, points_earned')
      .eq('status', 'approved')
      .gte('created_at', startDate)
      .lte('created_at', endDate) as any)

    const totalVolunteers = new Set(volunteerData?.map((v: any) => v.user_id)).size || 0
    const totalHours = volunteerData?.reduce((sum: number, v: any) => sum + (v.hours || 0), 0) || 0

    // Get certifications issued
    const { count: certsCount } = await (supabase
      .from('certifications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate) as any)

    // Get active jobs
    const { count: jobsCount } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    return {
      data: {
        totalRevenue,
        totalEvents: eventsCount || 0,
        totalAttendees: attendeesCount || 0,
        avgCheckinRate,
        totalVolunteers,
        totalHours,
        certificationsIssued: certsCount || 0,
        activeJobs: jobsCount || 0,
      },
      error: null,
    }
  } catch (error) {
    logger.error('Error fetching analytics:', error)
    return { data: null, error: error as Error }
  }
}

/**
 * Get university performance stats
 */
export const getUniversityPerformance = async (): Promise<QueryListResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id,
        name,
        type,
        events:events(count),
        registrations:registrations(count)
      `)
      .eq('type', 'university')
      .order('name')

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching university performance:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// ORGANIZATIONS QUERIES
// ============================================================================

/**
 * Get organizations
 */
export const getOrganizations = async (filters: { type?: string; is_verified?: boolean } = {}): Promise<QueryListResult<any>> => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    let query = supabase
      .from('organizations')
      .select('*')
      .order('name')

    if (filters.type) {
      query = query.eq('type', filters.type)
    }
    if (filters.is_verified !== undefined) {
      query = query.eq('is_verified', filters.is_verified)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    logger.error('Error fetching organizations:', error)
    return { data: null, error: error as Error }
  }
}

// ============================================================================
// SEARCH QUERIES
// ============================================================================

/**
 * Global search
 */
export const globalSearch = async (query: string) => {
  try {
    if (!supabase) throw new Error('Supabase not configured')

    const [events, jobs, organizations] = await Promise.all([
      supabase
        .from('events')
        .select('id, title, short_description, start_date, venue_city')
        .eq('is_published', true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(5),

      supabase
        .from('job_postings')
        .select('id, title, location, job_type')
        .eq('status', 'active')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(5),

      supabase
        .from('organizations')
        .select('id, name, type, logo_url')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(5),
    ])

    return {
      events: events.data || [],
      jobs: jobs.data || [],
      organizations: organizations.data || [],
      error: null,
    }
  } catch (error) {
    logger.error('Error in global search:', error)
    return {
      events: [],
      jobs: [],
      organizations: [],
      error: error as Error,
    }
  }
}
