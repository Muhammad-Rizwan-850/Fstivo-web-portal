'use server'

import { createClient } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Database } from '@/lib/types/database'
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface EventFilters {
  search?: string
  category?: string
  field?: string
  event_type?: string
  status?: string
  event_mode?: 'in-person' | 'virtual' | 'hybrid' | 'all'
  start_date?: string
  end_date?: string
  organizer_id?: string
  is_published?: boolean
  page?: number
  limit?: number
  sort_by?: 'start_date' | 'created_at' | 'title' | 'price'
  sort_order?: 'asc' | 'desc'
}

export interface EventFormData {
  title: string
  short_description?: string
  description: string
  event_type: string
  start_date: string
  end_date: string
  registration_opens_at?: string
  registration_closes_at?: string
  is_virtual: boolean
  venue_name?: string
  venue_city?: string
  venue_address?: string
  virtual_meeting_link?: string
  capacity?: number
  price: number
  currency?: string
  category_id?: string
  field_id?: string
  required_skills?: string[]
  eligibility_criteria?: string
  cover_image_url?: string
  banner_image_url?: string
}

export interface TicketTypeFormData {
  name: string
  description?: string
  price: number
  quantity_available?: number
  sale_start_date?: string
  sale_end_date?: string
  is_early_bird?: boolean
  max_per_order?: number
  valid_from?: string
  valid_until?: string
  benefits?: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  total_pages: number
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  short_description: z.string().max(500, 'Short description must be less than 500 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  event_type: z.enum(['conference', 'workshop', 'seminar', 'competition', 'networking', 'social', 'exhibition', 'other']),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  registration_opens_at: z.string().datetime().optional(),
  registration_closes_at: z.string().datetime().optional(),
  is_virtual: z.boolean(),
  venue_name: z.string().optional(),
  venue_city: z.string().optional(),
  venue_address: z.string().optional(),
  virtual_meeting_link: z.string().url().optional().or(z.literal('')),
  capacity: z.number().int().positive().optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  currency: z.string().default('PKR'),
  category_id: z.string().uuid().optional(),
  field_id: z.string().uuid().optional(),
  required_skills: z.array(z.string()).optional(),
  eligibility_criteria: z.string().optional(),
  cover_image_url: z.string().url().optional().or(z.literal('')),
  banner_image_url: z.string().url().optional().or(z.literal('')),
})

const ticketTypeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  quantity_available: z.number().int().positive().optional(),
  sale_start_date: z.string().datetime().optional(),
  sale_end_date: z.string().datetime().optional(),
  is_early_bird: z.boolean().default(false),
  max_per_order: z.number().int().min(1).default(10),
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().optional(),
  benefits: z.array(z.string()).optional(),
})

// ============================================================================
// EVENT CRUD OPERATIONS
// ============================================================================

/**
 * Create a new event
 */
export async function createEventAction(formData: EventFormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to create an event' }
  }

  // Validate form data
  const validatedFields = eventSchema.safeParse(formData)

  if (!validatedFields.success) {
    return {
      error: 'Invalid input',
      details: validatedFields.error.flatten(),
    }
  }

  // Validate end_date is after start_date
  const startDate = new Date(validatedFields.data.start_date)
  const endDate = new Date(validatedFields.data.end_date)

  if (endDate <= startDate) {
    return { error: 'End date must be after start date' }
  }

  // Create event
  const { data, error } = await (supabase.from('events') as any)
    .insert({
      ...validatedFields.data,
      organizer_id: user.id,
      status: 'draft',
      is_published: false,
      currency: validatedFields.data.currency || 'PKR',
    })
    .select()
    .single()

  if (error) {
    logger.error('Event creation error:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/events', 'page')
  revalidatePath('/events', 'page')

  return { success: true, event: data }
}

/**
 * Update an existing event
 */
export async function updateEventAction(eventId: string, formData: Partial<EventFormData>) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check if user owns this event
  const { data: existingEvent } = await (supabase.from('events') as any)
    .select('organizer_id')
    .eq('id', eventId)
    .single()

  if (!existingEvent) {
    return { error: 'Event not found' }
  }

  if (existingEvent.organizer_id !== user.id) {
    return { error: 'You do not have permission to update this event' }
  }

  // Validate form data (partial validation for updates)
  const validatedFields = eventSchema.partial().safeParse(formData)

  if (!validatedFields.success) {
    return {
      error: 'Invalid input',
      details: validatedFields.error.flatten(),
    }
  }

  // Update event
  const { data, error } = await (supabase.from('events') as any)
    .update(validatedFields.data)
    .eq('id', eventId)
    .select()
    .single()

  if (error) {
    logger.error('Event update error:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/events', 'page')
  revalidatePath(`/events/${eventId}`, 'page')

  return { success: true, event: data }
}

/**
 * Delete an event (soft delete)
 */
export async function deleteEventAction(eventId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check ownership
  const { data: existingEvent } = await (supabase.from('events') as any)
    .select('organizer_id, status')
    .eq('id', eventId)
    .single()

  if (!existingEvent) {
    return { error: 'Event not found' }
  }

  if (existingEvent.organizer_id !== user.id) {
    return { error: 'You do not have permission to delete this event' }
  }

  // Soft delete by setting deleted_at
  const { error } = await (supabase.from('events') as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', eventId)

  if (error) {
    logger.error('Event deletion error:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/events', 'page')
  revalidatePath('/events', 'page')

  return { success: true, message: 'Event deleted successfully' }
}

/**
 * Publish an event
 */
export async function publishEventAction(eventId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check ownership and required fields
  const { data: existingEvent } = await (supabase.from('events') as any)
    .select('organizer_id, title, description, start_date, end_date, venue_name, venue_city')
    .eq('id', eventId)
    .single()

  if (!existingEvent) {
    return { error: 'Event not found' }
  }

  if (existingEvent.organizer_id !== user.id) {
    return { error: 'You do not have permission to publish this event' }
  }

  // Validate required fields
  if (!existingEvent.title || !existingEvent.description || !existingEvent.start_date || !existingEvent.end_date) {
    return { error: 'Please fill in all required fields before publishing' }
  }

  // Publish event
  const { data, error } = await (supabase.from('events') as any)
    .update({
      status: 'published',
      is_published: true,
    })
    .eq('id', eventId)
    .select()
    .single()

  if (error) {
    logger.error('Event publish error:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/events', 'page')
  revalidatePath('/events', 'page')

  return { success: true, event: data }
}

/**
 * Unpublish an event
 */
export async function unpublishEventAction(eventId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check ownership
  const { data: existingEvent } = await (supabase.from('events') as any)
    .select('organizer_id')
    .eq('id', eventId)
    .single()

  if (!existingEvent) {
    return { error: 'Event not found' }
  }

  if (existingEvent.organizer_id !== user.id) {
    return { error: 'You do not have permission to unpublish this event' }
  }

  // Unpublish event
  const { data, error } = await (supabase.from('events') as any)
    .update({
      status: 'draft',
      is_published: false,
    })
    .eq('id', eventId)
    .select()
    .single()

  if (error) {
    logger.error('Event unpublish error:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/events', 'page')
  revalidatePath('/events', 'page')

  return { success: true, event: data }
}

// ============================================================================
// EVENT RETRIEVAL
// ============================================================================

/**
 * Get event by ID with full details
 */
export async function getEventByIdAction(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase.from('events') as any)
    .select(`
      *,
      organizer:organizer_id(id, full_name, email, avatar_url),
      organization:organization_id(id, name, logo_url),
      ticket_types(*),
      category:event_categories(id, name, icon, color),
      field:event_fields(id, name, description)
    `)
    .eq('id', eventId)
    .eq('deleted_at', null)
    .single()

  if (error) {
    logger.error('Event fetch error:', error)
    return { error: error.message }
  }

  return { event: data }
}

/**
 * Get events by organizer (for dashboard)
 */
export async function getEventsByOrganizerAction(filters: {
  organizer_id?: string
  status?: string
  page?: number
  limit?: number
} = {}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  const organizerId = filters.organizer_id || user.id
  const page = filters.page || 1
  const limit = filters.limit || 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  // Build query
  let query = (supabase.from('events') as any)
    .select('*, ticket_types(*), category:event_categories(id, name, icon)', { count: 'exact' })
    .eq('organizer_id', organizerId)
    .eq('deleted_at', null)

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  query = query
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    logger.error('Events fetch error:', error)
    return { error: error.message }
  }

  return {
    events: data || [],
    count: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit),
  }
}

/**
 * Get public events with filtering and pagination
 */
export async function getPublicEventsAction(filters: EventFilters = {}) {
  const supabase = await createClient()

  const page = filters.page || 1
  const limit = Math.min(filters.limit || 12, 50) // Max 50 per page
  const from = (page - 1) * limit
  const to = from + limit - 1

  // Build query
  let query = (supabase.from('events') as any)
    .select(`
      id,
      title,
      short_description,
      description,
      event_type,
      status,
      start_date,
      end_date,
      is_virtual,
      venue_name,
      venue_city,
      capacity,
      price,
      currency,
      cover_image_url,
      banner_image_url,
      organizer_id,
      organizer:organizer_id(id, full_name, avatar_url),
      category:event_categories(id, name, icon, color),
      field:event_fields(id, name),
      ticket_types(id, name, price, quantity_available),
      registrations!inner(id)
    `, { count: 'exact' })
    .eq('is_published', true)
    .eq('deleted_at', null)

  // Apply filters
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  if (filters.category) {
    query = query.eq('category_id', filters.category)
  }

  if (filters.field) {
    query = query.eq('field_id', filters.field)
  }

  if (filters.event_type) {
    query = query.eq('event_type', filters.event_type)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.event_mode && filters.event_mode !== 'all') {
    if (filters.event_mode === 'virtual') {
      query = query.eq('is_virtual', true)
    } else if (filters.event_mode === 'in-person') {
      query = query.eq('is_virtual', false)
    }
    // hybrid would need more complex logic
  }

  if (filters.start_date) {
    query = query.gte('start_date', filters.start_date)
  }

  if (filters.end_date) {
    query = query.lte('start_date', filters.end_date)
  }

  // Count registrations
  query = query

  // Sorting
  const sortBy = filters.sort_by || 'start_date'
  const sortOrder = filters.sort_order || 'asc'
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // Pagination
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    logger.error('Public events fetch error:', error)
    return {
      events: [],
      count: 0,
      page,
      limit,
      total_pages: 0,
    }
  }

  return {
    events: data || [],
    count: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit),
  }
}

/**
 * Get upcoming events (for homepage)
 */
export async function getUpcomingEventsAction(limit: number = 6) {
  const supabase = await createClient()

  const { data, error } = await (supabase.from('events') as any)
    .select(`
      id,
      title,
      short_description,
      start_date,
      venue_city,
      cover_image_url,
      category:event_categories(id, name, icon)
    `)
    .eq('is_published', true)
    .eq('deleted_at', null)
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(limit)

  if (error) {
    logger.error('Upcoming events error:', error)
    return { events: [] }
  }

  return { events: data || [] }
}

// ============================================================================
// TICKET TYPES MANAGEMENT
// ============================================================================

/**
 * Create ticket type for an event
 */
export async function createTicketTypeAction(eventId: string, formData: TicketTypeFormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check ownership
  const { data: event } = await (supabase.from('events') as any)
    .select('organizer_id')
    .eq('id', eventId)
    .single()

  if (!event) {
    return { error: 'Event not found' }
  }

  if (event.organizer_id !== user.id) {
    return { error: 'You do not have permission to add tickets to this event' }
  }

  // Validate
  const validatedFields = ticketTypeSchema.safeParse(formData)

  if (!validatedFields.success) {
    return {
      error: 'Invalid input',
      details: validatedFields.error.flatten(),
    }
  }

  // Create ticket type
  const { data, error } = await (supabase.from('ticket_types') as any)
    .insert({
      ...validatedFields.data,
      event_id: eventId,
    })
    .select()
    .single()

  if (error) {
    logger.error('Ticket type creation error:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/events/${eventId}`, 'page')

  return { success: true, ticketType: data }
}

/**
 * Update ticket type
 */
export async function updateTicketTypeAction(ticketTypeId: string, formData: Partial<TicketTypeFormData>) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check ownership via event
  const { data: ticketType } = await (supabase.from('ticket_types') as any)
    .select('event_id, events!inner(organizer_id)')
    .eq('id', ticketTypeId)
    .single()

  if (!ticketType) {
    return { error: 'Ticket type not found' }
  }

  if (ticketType.events.organizer_id !== user.id) {
    return { error: 'You do not have permission to update this ticket type' }
  }

  // Validate partial
  const validatedFields = ticketTypeSchema.partial().safeParse(formData)

  if (!validatedFields.success) {
    return {
      error: 'Invalid input',
      details: validatedFields.error.flatten(),
    }
  }

  // Update
  const { data, error } = await (supabase.from('ticket_types') as any)
    .update(validatedFields.data)
    .eq('id', ticketTypeId)
    .select()
    .single()

  if (error) {
    logger.error('Ticket type update error:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/events/${ticketType.event_id}`, 'page')

  return { success: true, ticketType: data }
}

/**
 * Delete ticket type
 */
export async function deleteTicketTypeAction(ticketTypeId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check ownership
  const { data: ticketType } = await (supabase.from('ticket_types') as any)
    .select('event_id, events!inner(organizer_id)')
    .eq('id', ticketTypeId)
    .single()

  if (!ticketType) {
    return { error: 'Ticket type not found' }
  }

  if (ticketType.events.organizer_id !== user.id) {
    return { error: 'You do not have permission to delete this ticket type' }
  }

  // Delete
  const { error } = await (supabase.from('ticket_types') as any)
    .delete()
    .eq('id', ticketTypeId)

  if (error) {
    logger.error('Ticket type deletion error:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/events/${ticketType.event_id}`, 'page')

  return { success: true, message: 'Ticket type deleted successfully' }
}

// ============================================================================
// EVENT STATS & ANALYTICS
// ============================================================================

/**
 * Get event statistics
 */
export async function getEventStatsAction(eventId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check ownership
  const { data: event } = await (supabase.from('events') as any)
    .select('organizer_id')
    .eq('id', eventId)
    .single()

  if (!event) {
    return { error: 'Event not found' }
  }

  if (event.organizer_id !== user.id) {
    return { error: 'You do not have permission to view this event\'s stats' }
  }

  // Get registrations
  const { data: registrations, error } = await (supabase.from('registrations') as any)
    .select('status, payment_amount, checked_in_at')
    .eq('event_id', eventId)

  if (error) {
    logger.error('Event stats error:', error)
    return { error: error.message }
  }

  const totalRegistrations = registrations?.length || 0
  const totalCheckedIn = registrations?.filter((r: any) => r.checked_in_at).length || 0
  const totalRevenue = registrations?.reduce((sum: number, r: any) => sum + (r.payment_amount || 0), 0) || 0
  const confirmedCount = registrations?.filter((r: any) => r.status === 'confirmed').length || 0
  const attendedCount = registrations?.filter((r: any) => r.status === 'attended').length || 0

  return {
    stats: {
      total_registrations: totalRegistrations,
      total_checked_in: totalCheckedIn,
      total_revenue: totalRevenue,
      confirmed_count: confirmedCount,
      attended_count: attendedCount,
      check_in_rate: totalRegistrations > 0 ? (totalCheckedIn / totalRegistrations * 100).toFixed(1) : '0',
    },
  }
}

// ============================================================================
// FILE UPLOAD
// ============================================================================

/**
 * Upload event image
 */
export async function uploadEventImageAction(eventId: string, file: File, type: 'cover' | 'banner') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check ownership
  const { data: event } = await (supabase.from('events') as any)
    .select('organizer_id')
    .eq('id', eventId)
    .single()

  if (!event) {
    return { error: 'Event not found' }
  }

  if (event.organizer_id !== user.id) {
    return { error: 'You do not have permission to upload images to this event' }
  }

  // Validate file
  if (!file.type.startsWith('image/')) {
    return { error: 'File must be an image' }
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File size must be less than 5MB' }
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${eventId}-${type}-${Date.now()}.${fileExt}`
  const filePath = `events/${fileName}`

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await (supabase.storage as any)
    .from('event-images')
    .upload(filePath, file)

  if (uploadError) {
    logger.error('Image upload error:', uploadError)
    return { error: 'Failed to upload image' }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('event-images')
    .getPublicUrl(filePath)

  // Update event
  const updateData = type === 'cover'
    ? { cover_image_url: publicUrl }
    : { banner_image_url: publicUrl }

  const { error: updateError } = await (supabase.from('events') as any)
    .update(updateData)
    .eq('id', eventId)

  if (updateError) {
    return { error: 'Failed to update event' }
  }

  revalidatePath('/dashboard/events', 'page')
  revalidatePath(`/dashboard/events/${eventId}`, 'page')
  revalidatePath('/events', 'page')

  return { success: true, imageUrl: publicUrl }
}
