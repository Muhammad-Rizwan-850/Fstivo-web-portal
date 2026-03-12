'use server'

import { createClient } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Database } from '@/lib/types/database'
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface EventWithTicketsFormData {
  // Basic Info
  title: string
  short_description: string
  description: string
  event_type: string
  category_id: string
  field_id?: string

  // Date & Time
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  registration_opens_at?: string
  registration_closes_at?: string
  timezone?: string

  // Location
  event_mode: 'in-person' | 'virtual' | 'hybrid'
  venue_name?: string
  venue_city?: string
  venue_address?: string
  venue_country?: string
  virtual_meeting_link?: string

  // Capacity & Pricing
  capacity: number
  min_attendees?: number
  base_price: number
  currency: string

  // Media
  banner_image?: string
  cover_image_url?: string

  // Additional Features
  tags?: string[]
  waitlist_enabled?: boolean

  // Settings
  is_published: boolean

  // Ticket Types
  ticket_types: TicketTypeInput[]
}

export interface TicketTypeInput {
  id: string
  name: string
  description?: string
  price: number
  quantity_available: number
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ticketTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Ticket name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  quantity_available: z.number().int().positive('Quantity must be greater than 0'),
})

const eventWithTicketsSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  short_description: z.string().max(500, 'Short description must be less than 500 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  event_type: z.enum(['conference', 'workshop', 'seminar', 'competition', 'networking', 'social', 'exhibition', 'other']),
  category_id: z.string().min(1, 'Category is required'),
  field_id: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  registration_opens_at: z.string().optional(),
  registration_closes_at: z.string().optional(),
  timezone: z.string().optional(),
  event_mode: z.enum(['in-person', 'virtual', 'hybrid']),
  venue_name: z.string().optional(),
  venue_city: z.string().optional(),
  venue_address: z.string().optional(),
  venue_country: z.string().optional(),
  virtual_meeting_link: z.string().url().optional().or(z.literal('')),
  capacity: z.number().int().positive('Capacity must be greater than 0'),
  min_attendees: z.number().int().min(0).optional(),
  base_price: z.number().min(0, 'Price must be 0 or greater'),
  currency: z.string().default('PKR'),
  banner_image: z.string().url().optional().or(z.literal('')),
  cover_image_url: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  waitlist_enabled: z.boolean().optional(),
  is_published: z.boolean().default(false),
  ticket_types: z.array(ticketTypeSchema).min(1, 'At least one ticket type is required'),
})

// ============================================================================
// EVENT CREATION WITH TICKET TYPES
// ============================================================================

/**
 * Create a new event with ticket types
 */
export async function createEventWithTicketsAction(formData: EventWithTicketsFormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to create an event' }
  }

  // Validate form data
  const validatedFields = eventWithTicketsSchema.safeParse(formData)

  if (!validatedFields.success) {
    return {
      error: 'Invalid input',
      details: validatedFields.error.flatten().fieldErrors,
    }
  }

  const data = validatedFields.data

  // Combine date and time into ISO strings
  const startDateTime = new Date(`${data.start_date}T${data.start_time}`)
  const endDateTime = new Date(`${data.end_date}T${data.end_time}`)

  if (endDateTime <= startDateTime) {
    return { error: 'End date/time must be after start date/time' }
  }

  // Validate registration dates
  if (data.registration_opens_at && data.registration_closes_at) {
    const regOpens = new Date(data.registration_opens_at)
    const regCloses = new Date(data.registration_closes_at)
    if (regCloses <= regOpens) {
      return { error: 'Registration closing date must be after opening date' }
    }
    if (regCloses > startDateTime) {
      return { error: 'Registration must close before the event starts' }
    }
  }

  try {
    // Start a transaction-like operation
    // First, create the event
    const eventInsertData: any = {
      organizer_id: user.id,
      title: data.title,
      short_description: data.short_description,
      description: data.description,
      event_type: data.event_type,
      category_id: data.category_id,
      field_id: data.field_id || null,
      start_date: startDateTime.toISOString(),
      end_date: endDateTime.toISOString(),
      registration_opens_at: data.registration_opens_at ? new Date(data.registration_opens_at).toISOString() : null,
      registration_closes_at: data.registration_closes_at ? new Date(data.registration_closes_at).toISOString() : null,
      is_virtual: data.event_mode === 'virtual',
      venue_name: data.event_mode === 'in-person' || data.event_mode === 'hybrid' ? data.venue_name : null,
      venue_city: data.event_mode === 'in-person' || data.event_mode === 'hybrid' ? data.venue_city : null,
      venue_address: data.event_mode === 'in-person' || data.event_mode === 'hybrid' ? data.venue_address : null,
      virtual_meeting_link: data.event_mode === 'virtual' || data.event_mode === 'hybrid' ? data.virtual_meeting_link : null,
      capacity: data.capacity,
      price: data.base_price,
      currency: data.currency || 'PKR',
      cover_image_url: data.cover_image_url || null,
      banner_image_url: data.banner_image || null,
      status: data.is_published ? 'published' : 'draft',
      is_published: data.is_published,
      // Store additional fields in location JSONB column
      location: {
        timezone: data.timezone,
        country: data.venue_country,
        event_mode: data.event_mode,
        tags: data.tags || [],
        waitlist_enabled: data.waitlist_enabled || false,
        min_attendees: data.min_attendees || 0,
      },
      // Use required_skills field to store tags for now (can be migrated to proper column later)
      required_skills: data.tags || [],
    }

    const { data: event, error: eventError } = await (supabase.from('events') as any)
      .insert(eventInsertData)
      .select()
      .single()

    if (eventError) {
      logger.error('Event creation error:', eventError)
      return { error: eventError.message }
    }

    // Create ticket types
    const ticketTypesData = data.ticket_types.map(ticket => ({
      event_id: event.id,
      name: ticket.name,
      description: ticket.description || null,
      price: ticket.price,
      quantity_available: ticket.quantity_available,
      currency: data.currency || 'PKR',
    }))

    const { error: ticketsError } = await (supabase.from('ticket_types') as any)
      .insert(ticketTypesData)

    if (ticketsError) {
      logger.error('Ticket types creation error:', ticketsError)
      // Rollback event creation if ticket types fail
      await supabase.from('events').delete().eq('id', event.id)
      return { error: 'Failed to create ticket types: ' + ticketsError.message }
    }

    // Revalidate paths
    revalidatePath('/dashboard/events', 'page')
    revalidatePath('/events', 'page')

    return {
      success: true,
      event,
      message: data.is_published ? 'Event published successfully!' : 'Event saved as draft!',
    }
  } catch (error: any) {
    logger.error('Event creation error:', error)
    return { error: error.message || 'Failed to create event' }
  }
}

/**
 * Update an existing event with ticket types
 */
export async function updateEventWithTicketsAction(
  eventId: string,
  formData: Partial<EventWithTicketsFormData>
) {
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
  const validatedFields = eventWithTicketsSchema.partial().safeParse(formData)

  if (!validatedFields.success) {
    return {
      error: 'Invalid input',
      details: validatedFields.error.flatten().fieldErrors,
    }
  }

  const data = validatedFields.data

  try {
    // Prepare update data
    const updateData: any = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.short_description !== undefined) updateData.short_description = data.short_description
    if (data.description !== undefined) updateData.description = data.description
    if (data.event_type !== undefined) updateData.event_type = data.event_type
    if (data.category_id !== undefined) updateData.category_id = data.category_id
    if (data.field_id !== undefined) updateData.field_id = data.field_id
    if (data.capacity !== undefined) updateData.capacity = data.capacity
    if (data.base_price !== undefined) updateData.price = data.base_price
    if (data.currency !== undefined) updateData.currency = data.currency
    if (data.cover_image_url !== undefined) updateData.cover_image_url = data.cover_image_url
    if (data.banner_image !== undefined) updateData.banner_image_url = data.banner_image

    // Handle date/time updates
    if (data.start_date && data.start_time) {
      updateData.start_date = new Date(`${data.start_date}T${data.start_time}`).toISOString()
    }
    if (data.end_date && data.end_time) {
      updateData.end_date = new Date(`${data.end_date}T${data.end_time}`).toISOString()
    }
    if (data.registration_opens_at !== undefined) {
      updateData.registration_opens_at = data.registration_opens_at ? new Date(data.registration_opens_at).toISOString() : null
    }
    if (data.registration_closes_at !== undefined) {
      updateData.registration_closes_at = data.registration_closes_at ? new Date(data.registration_closes_at).toISOString() : null
    }

    // Handle location updates
    if (data.event_mode !== undefined) {
      updateData.is_virtual = data.event_mode === 'virtual'
    }
    if (data.venue_name !== undefined) updateData.venue_name = data.venue_name
    if (data.venue_city !== undefined) updateData.venue_city = data.venue_city
    if (data.venue_address !== undefined) updateData.venue_address = data.venue_address
    if (data.virtual_meeting_link !== undefined) updateData.virtual_meeting_link = data.virtual_meeting_link

    // Handle new fields - update location JSONB with new values
    if (data.timezone !== undefined || data.venue_country !== undefined ||
        data.tags !== undefined || data.waitlist_enabled !== undefined ||
        data.min_attendees !== undefined || data.event_mode !== undefined) {
      // Get existing location data to merge with new values
      const { data: existingEvent } = await (supabase.from('events') as any)
        .select('location')
        .eq('id', eventId)
        .single()

      const existingLocation = existingEvent?.location || {}
      updateData.location = {
        ...existingLocation,
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.venue_country !== undefined && { country: data.venue_country }),
        ...(data.event_mode !== undefined && { event_mode: data.event_mode }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.waitlist_enabled !== undefined && { waitlist_enabled: data.waitlist_enabled }),
        ...(data.min_attendees !== undefined && { min_attendees: data.min_attendees }),
      }
    }

    // Update required_skills (tags) if provided
    if (data.tags !== undefined) {
      updateData.required_skills = data.tags
    }

    if (data.is_published !== undefined) {
      updateData.is_published = data.is_published
      updateData.status = data.is_published ? 'published' : 'draft'
    }

    // Update event
    const { data: event, error: eventError } = await (supabase.from('events') as any)
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single()

    if (eventError) {
      logger.error('Event update error:', eventError)
      return { error: eventError.message }
    }

    // Handle ticket types update if provided
    if (data.ticket_types && data.ticket_types.length > 0) {
      // Delete existing ticket types
      await supabase.from('ticket_types').delete().eq('event_id', eventId)

      // Create new ticket types
      const ticketTypesData = data.ticket_types.map(ticket => ({
        event_id: eventId,
        name: ticket.name,
        description: ticket.description || null,
        price: ticket.price,
        quantity_available: ticket.quantity_available,
        currency: data.currency || 'PKR',
      }))

      const { error: ticketsError } = await (supabase.from('ticket_types') as any)
        .insert(ticketTypesData)

      if (ticketsError) {
        logger.error('Ticket types update error:', ticketsError)
        return { error: 'Failed to update ticket types: ' + ticketsError.message }
      }
    }

    // Revalidate paths
    revalidatePath('/dashboard/events', 'page')
    revalidatePath(`/events/${eventId}`, 'page')

    return {
      success: true,
      event,
      message: 'Event updated successfully!',
    }
  } catch (error: any) {
    logger.error('Event update error:', error)
    return { error: error.message || 'Failed to update event' }
  }
}

/**
 * Save event as draft
 */
export async function saveEventDraftAction(formData: EventWithTicketsFormData) {
  return await createEventWithTicketsAction({
    ...formData,
    is_published: false,
  })
}

/**
 * Publish event (update existing draft to published)
 */
export async function publishEventDraftAction(eventId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in' }
  }

  // Check ownership
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

  return { success: true, event: data, message: 'Event published successfully!' }
}
