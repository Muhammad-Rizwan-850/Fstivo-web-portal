/**
 * Seating & Venue Management Query Functions
 * Database queries for venues, seating layouts, and seat reservations
 */

import { createClient } from '@/lib/auth/config'
import type {
  Venue,
  SeatingLayout,
  SeatingSection,
  Seat,
  SeatReservation,
  SeatPricingTier,
  AccessibilityRequest,
  GroupSeating,
  SeatHold,
  SeatingConfigHistory
} from '@/types/seating'

// ============================================================================
// VENUES
// ============================================================================

export async function getVenues(userId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('venues')
    .select('*')
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.eq('created_by', userId)
  } else {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Venue[]
}

export async function getVenue(venueId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', venueId)
    .single()

  if (error) throw error
  return data as Venue
}

export async function createVenue(
  userId: string,
  venueData: {
    venueName: string
    description?: string
    address?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
    capacity?: number
    contactEmail?: string
    contactPhone?: string
    websiteUrl?: string
    imagesUrl?: string[]
    amenities?: Record<string, any>
    accessibilityFeatures?: string[]
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('venues') as any)
    .insert({
      created_by: userId,
      venue_name: venueData.venueName,
      description: venueData.description,
      address: venueData.address,
      city: venueData.city,
      state: venueData.state,
      country: venueData.country,
      postal_code: venueData.postalCode,
      capacity: venueData.capacity,
      contact_email: venueData.contactEmail,
      contact_phone: venueData.contactPhone,
      website_url: venueData.websiteUrl,
      images_url: venueData.imagesUrl,
      amenities: venueData.amenities as any,
      accessibility_features: venueData.accessibilityFeatures
    })
    .select()
    .single()

  if (error) throw error
  return data as Venue
}

export async function updateVenue(
  venueId: string,
  updates: Partial<Venue>
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('venues') as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', venueId)
    .select()
    .single()

  if (error) throw error
  return data as Venue
}

export async function deleteVenue(venueId: string) {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('venues') as any)
    .update({ is_active: false })
    .eq('id', venueId)

  if (error) throw error
}

// ============================================================================
// SEATING LAYOUTS
// ============================================================================

export async function getSeatingLayouts(eventId?: string, venueId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('seating_layouts')
    .select('*')
    .order('created_at', { ascending: false })

  if (eventId) {
    query = query.eq('event_id', eventId)
  } else if (venueId) {
    query = query.eq('venue_id', venueId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as SeatingLayout[]
}

export async function getSeatingLayout(layoutId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('seating_layouts') as any)
    .select('*, seating_sections(*)')
    .eq('id', layoutId)
    .single()

  if (error) throw error
  return data
}

export async function createSeatingLayout(
  layoutData: {
    venueId?: string
    eventId?: string
    layoutName: string
    layoutType: 'theater' | 'stadium' | 'classroom' | 'banquet' | 'cocktail' | 'custom'
    totalCapacity: number
    stagePosition?: Record<string, any>
    dimensions?: Record<string, any>
    backgroundImageUrl?: string
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('seating_layouts') as any)
    .insert({
      venue_id: layoutData.venueId,
      event_id: layoutData.eventId,
      layout_name: layoutData.layoutName,
      layout_type: layoutData.layoutType,
      total_capacity: layoutData.totalCapacity,
      stage_position: layoutData.stagePosition as any,
      dimensions: layoutData.dimensions as any,
      background_image_url: layoutData.backgroundImageUrl
    })
    .select()
    .single()

  if (error) throw error
  return data as SeatingLayout
}

export async function updateSeatingLayout(
  layoutId: string,
  updates: Partial<SeatingLayout>
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('seating_layouts') as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', layoutId)
    .select()
    .single()

  if (error) throw error
  return data as SeatingLayout
}

export async function duplicateSeatingLayout(
  layoutId: string,
  newEventId?: string
) {
  const supabase = await createClient()

  // Get original layout with sections
  const original = await getSeatingLayout(layoutId)

  // Create new layout
  const { data: newLayout } = await (supabase
    .from('seating_layouts') as any)
    .insert({
      venue_id: original.venue_id,
      event_id: newEventId,
      layout_name: `${original.layout_name} (Copy)`,
      layout_type: original.layout_type,
      total_capacity: original.total_capacity,
      stage_position: original.stage_position,
      dimensions: original.dimensions,
      background_image_url: original.background_image_url
    })
    .select()
    .single()

  if (newLayout) {
    // Copy sections
    const sections = await getSeatingSections(layoutId)

    for (const section of sections) {
      const { data: newSection } = await (supabase
        .from('seating_sections') as any)
        .insert({
          layout_id: newLayout.id,
          section_name: section.section_name,
          section_type: section.section_type,
          base_price: section.base_price,
          capacity: section.capacity,
          position: section.position,
          color: section.color,
          row_count: section.row_count,
          seats_per_row: section.seats_per_row,
          seat_labels_pattern: section.seat_labels_pattern
        })
        .select()
        .single()

      if (newSection) {
        // Copy seats
        const seats = await getSeats(section.id)

        await (supabase
          .from('seats') as any)
          .insert(
            seats.map(seat => ({
              section_id: newSection.id,
              seat_number: seat.seat_number,
              row_label: seat.row_label,
              column_number: seat.column_number,
              status: 'available',
              is_accessible: seat.is_accessible,
              position: seat.position
            }))
          )
      }
    }

    return newLayout
  }

  throw new Error('Failed to duplicate layout')
}

// ============================================================================
// SEATING SECTIONS
// ============================================================================

export async function getSeatingSections(layoutId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('seating_sections') as any)
    .select('*')
    .eq('layout_id', layoutId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as SeatingSection[]
}

export async function getSeatingSection(sectionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seating_sections')
    .select('*')
    .eq('id', sectionId)
    .single()

  if (error) throw error
  return data as SeatingSection
}

export async function createSeatingSection(
  layoutId: string,
  sectionData: {
    sectionName: string
    sectionType: 'general' | 'vip' | 'premium' | 'accessible' | 'reserved'
    basePrice: number
    capacity: number
    position?: Record<string, any>
    color?: string
    rowCount?: number
    seatsPerRow?: number
    seatLabelsPattern?: string
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('seating_sections') as any)
    .insert({
      layout_id: layoutId,
      section_name: sectionData.sectionName,
      section_type: sectionData.sectionType,
      base_price: sectionData.basePrice,
      capacity: sectionData.capacity,
      position: sectionData.position as any,
      color: sectionData.color,
      row_count: sectionData.rowCount,
      seats_per_row: sectionData.seatsPerRow,
      seat_labels_pattern: sectionData.seatLabelsPattern
    })
    .select()
    .single()

  if (error) throw error
  return data as SeatingSection
}

export async function updateSeatingSection(
  sectionId: string,
  updates: Partial<SeatingSection>
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('seating_sections') as any)
    .update(updates)
    .eq('id', sectionId)
    .select()
    .single()

  if (error) throw error
  return data as SeatingSection
}

export async function deleteSeatingSection(sectionId: string) {
  const supabase = await createClient()

  const { error } = await (supabase
    .from('seating_sections') as any)
    .delete()
    .eq('id', sectionId)

  if (error) throw error
}

// ============================================================================
// SEATS
// ============================================================================

export async function getSeats(sectionId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('seats') as any)
    .select('*')
    .eq('section_id', sectionId)
    .order('row_label', { ascending: true })
    .order('column_number', { ascending: true })

  if (error) throw error
  return data as Seat[]
}

export async function getSeat(seatId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seats')
    .select('*, seating_sections(*, seating_layouts(*))')
    .eq('id', seatId)
    .single()

  if (error) throw error
  return data
}

export async function generateSeats(
  sectionId: string,
  seatConfig: {
    rowCount: number
    seatsPerRow: number
    rowLabels?: string[]
    startNumber?: number
    isAccessible?: boolean[]
  }
) {
  const supabase = await createClient()

  const seatsToInsert = []

  for (let row = 0; row < seatConfig.rowCount; row++) {
    const rowLabel = seatConfig.rowLabels?.[row] || String.fromCharCode(65 + row)

    for (let col = 0; col < seatConfig.seatsPerRow; col++) {
      const seatNumber = `${rowLabel}${col + (seatConfig.startNumber || 1)}`
      const isAccessible = seatConfig.isAccessible?.[row * seatConfig.seatsPerRow + col] || false

      seatsToInsert.push({
        section_id: sectionId,
        seat_number: seatNumber,
        row_label: rowLabel,
        column_number: col + 1,
        status: 'available',
        is_accessible: isAccessible,
        position: { row, col }
      })
    }
  }

  const { data, error } = await (supabase
    .from('seats') as any)
    .insert(seatsToInsert)
    .select()

  if (error) throw error
  return data as Seat[]
}

export async function updateSeatStatus(
  seatId: string,
  status: 'available' | 'reserved' | 'held' | 'sold' | 'blocked'
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('seats') as any)
    .update({ status })
    .eq('id', seatId)
    .select()
    .single()

  if (error) throw error
  return data as Seat
}

export async function bulkUpdateSeatStatus(
  seatIds: string[],
  status: 'available' | 'reserved' | 'held' | 'sold' | 'blocked'
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('seats') as any)
    .update({ status })
    .in('id', seatIds)
    .select()

  if (error) throw error
  return data as Seat[]
}

export async function getAvailableSeats(sectionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seats')
    .select('*')
    .eq('section_id', sectionId)
    .eq('status', 'available')
    .order('row_label', { ascending: true })
    .order('column_number', { ascending: true })

  if (error) throw error
  return data as Seat[]
}

export async function getSeatsByLayout(layoutId: string) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('seats') as any)
    .select('*, seating_sections(*)')
    .in('section_id',
      (supabase
        .from('seating_sections') as any)
        .select('id')
        .eq('layout_id', layoutId)
    )
    .order('row_label')
    .order('column_number')

  if (error) throw error
  return data
}

// ============================================================================
// SEAT RESERVATIONS
// ============================================================================

export async function getSeatReservations(registrationId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('seat_reservations')
    .select('*, seats(*, seating_sections(*))')

  if (registrationId) {
    query = query.eq('registration_id', registrationId)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getSeatReservation(reservationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seat_reservations')
    .select('*')
    .eq('id', reservationId)
    .single()

  if (error) throw error
  return data as SeatReservation
}

export async function reserveSeat(
  seatId: string,
  registrationId: string,
  reservedBy: string,
  options?: {
    expiresAt?: Date
    reservationType?: 'temporary' | 'confirmed' | 'held'
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('seat_reservations') as any)
    .insert({
      seat_id: seatId,
      registration_id: registrationId,
      reserved_by: reservedBy,
      reservation_type: options?.reservationType || 'temporary',
      expires_at: options?.expiresAt?.toISOString()
    })
    .select()
    .single()

  if (error) throw error

  // Update seat status
  await updateSeatStatus(seatId, options?.reservationType === 'confirmed' ? 'sold' : 'reserved')

  return data as SeatReservation
}

export async function confirmSeatReservation(reservationId: string) {
  const supabase = await createClient()

  const reservation = await getSeatReservation(reservationId)

  // Update reservation
  const { data, error } = await (supabase
    .from('seat_reservations') as any)
    .update({
      reservation_type: 'confirmed',
      confirmed_at: new Date().toISOString()
    })
    .eq('id', reservationId)
    .select()
    .single()

  if (error) throw error

  // Update seat status
  await updateSeatStatus(reservation.seat_id, 'sold')

  return data as SeatReservation
}

export async function cancelSeatReservation(reservationId: string) {
  const supabase = await createClient()

  const reservation = await getSeatReservation(reservationId)

  const { error } = await (supabase
    .from('seat_reservations') as any)
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', reservationId)

  if (error) throw error

  // Release seat
  await updateSeatStatus(reservation.seat_id, 'available')
}

export async function cleanupExpiredReservations() {
  const supabase = await createClient()

  const now = new Date().toISOString()

  // Get expired reservations
  const { data: expired } = await (supabase
    .from('seat_reservations') as any)
    .select('*')
    .lt('expires_at', now)
    .eq('status', 'active')

  if (expired) {
    for (const reservation of expired) {
      await cancelSeatReservation(reservation.id)
    }
  }

  return expired?.length || 0
}

// ============================================================================
// SEAT PRICING TIERS
// ============================================================================

export async function getSeatPricingTiers(sectionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seat_pricing_tiers')
    .select('*')
    .eq('section_id', sectionId)
    .order('price_multiplier', { ascending: false })

  if (error) throw error
  return data as SeatPricingTier[]
}

export async function createSeatPricingTier(
  sectionId: string,
  tierData: {
    tierName: string
    priceMultiplier: number
    minPrice?: number
    maxPrice?: number
    benefits?: Record<string, any>
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('seat_pricing_tiers') as any)
    .insert({
      section_id: sectionId,
      tier_name: tierData.tierName,
      price_multiplier: tierData.priceMultiplier,
      min_price: tierData.minPrice,
      max_price: tierData.maxPrice,
      benefits: tierData.benefits as any
    })
    .select()
    .single()

  if (error) throw error
  return data as SeatPricingTier
}

// ============================================================================
// ACCESSIBILITY REQUESTS
// ============================================================================

export async function getAccessibilityRequests(registrationId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('accessibility_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (registrationId) {
    query = query.eq('registration_id', registrationId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as AccessibilityRequest[]
}

export async function createAccessibilityRequest(
  registrationId: string,
  requestData: {
    requestType: string
    details?: string
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('accessibility_requests') as any)
    .insert({
      registration_id: registrationId,
      request_type: requestData.requestType,
      details: requestData.details,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data as AccessibilityRequest
}

export async function updateAccessibilityRequest(
  requestId: string,
  updates: {
    status?: 'pending' | 'approved' | 'denied' | 'fulfilled'
    assignedSeats?: string[]
    notes?: string
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('accessibility_requests') as any)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return data as AccessibilityRequest
}

// ============================================================================
// GROUP SEATING
// ============================================================================

export async function getGroupSeatings(eventId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('group_seating')
    .select('*')
    .order('created_at', { ascending: false })

  if (eventId) {
    query = query.eq('event_id', eventId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as GroupSeating[]
}

export async function createGroupSeating(
  groupData: {
    groupName: string
    groupSize: number
    contactEmail?: string
    contactPhone?: string
    specialRequests?: string
    eventId?: string
    createdBy?: string
  }
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('group_seating') as any)
    .insert({
      group_name: groupData.groupName,
      group_size: groupData.groupSize,
      contact_email: groupData.contactEmail,
      contact_phone: groupData.contactPhone,
      special_requests: groupData.specialRequests,
      event_id: groupData.eventId,
      created_by: groupData.createdBy
    })
    .select()
    .single()

  if (error) throw error
  return data as GroupSeating
}

export async function assignSeatsToGroup(
  groupId: string,
  seatIds: string[]
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('group_seating') as any)
    .update({
      assigned_seats: seatIds,
      updated_at: new Date().toISOString()
    })
    .eq('id', groupId)
    .select()
    .single()

  if (error) throw error
  return data as GroupSeating
}

// ============================================================================
// SEAT HOLDS
// ============================================================================

export async function createSeatHold(
  seatId: string,
  heldBy: string | null,
  options?: {
    holdReason?: string
    expiresAt?: Date
  }
) {
  const supabase = await createClient()

  const expiresAt = options?.expiresAt || new Date(Date.now() + 15 * 60 * 1000) // 15 min default

  const { data, error } = await (supabase
    .from('seat_holds') as any)
    .insert({
      seat_id: seatId,
      held_by: heldBy,
      hold_reason: options?.holdReason,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single()

  if (error) throw error

  // Update seat status
  await updateSeatStatus(seatId, 'held')

  return data as SeatHold
}

export async function releaseSeatHold(holdId: string) {
  const supabase = await createClient()

  const hold = await (supabase
    .from('seat_holds') as any)
    .select('*')
    .eq('id', holdId)
    .single()

  if (hold.error) throw hold.error

  await (supabase
    .from('seat_holds') as any)
    .update({ is_active: false })
    .eq('id', holdId)

  // Update seat status
  await updateSeatStatus(hold.data.seat_id, 'available')
}

export async function releaseExpiredSeatHolds() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('release_expired_seat_holds')

  if (error) throw error
  return data
}

// ============================================================================
// SEATING CONFIGURATION HISTORY
// ============================================================================

export async function saveSeatingConfiguration(
  layoutId: string,
  configuration: Record<string, any>,
  changedBy: string | null,
  changeReason?: string
) {
  const supabase = await createClient()

  const { data, error } = await (supabase
    .from('seating_config_history') as any)
    .insert({
      layout_id: layoutId,
      configuration: configuration as any,
      changed_by: changedBy,
      change_reason: changeReason
    })
    .select()
    .single()

  if (error) throw error
  return data as SeatingConfigHistory
}

export async function getSeatingConfigurationHistory(layoutId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seating_config_history')
    .select('*, profiles(first_name, last_name)')
    .eq('layout_id', layoutId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ============================================================================
// SEATING AVAILABILITY VIEW
// ============================================================================

export async function getSeatingAvailability(layoutId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_seating_availability')
    .select('*')
    .eq('layout_id', layoutId)

  if (error) throw error
  return data
}

export async function getBestAvailableSeats(
  sectionId: string,
  quantity: number,
  together = true
) {
  const supabase = await createClient()

  if (together) {
    // Find contiguous seats in same row
    const seats = await getAvailableSeats(sectionId)

    for (let i = 0; i < seats.length; i++) {
      const currentRow = seats[i].row_label
      const consecutiveSeats = [seats[i]]

      for (let j = i + 1; j < seats.length; j++) {
        if (seats[j].row_label === currentRow &&
            seats[j].column_number === (seats[j-1].column_number || 0) + 1) {
          consecutiveSeats.push(seats[j])

          if (consecutiveSeats.length === quantity) {
            return consecutiveSeats
          }
        } else {
          break
        }
      }
    }

    return [] // No contiguous seats found
  } else {
    // Return any available seats
    const { data, error } = await (supabase
      .from('seats') as any)
      .select('*')
      .eq('section_id', sectionId)
      .eq('status', 'available')
      .limit(quantity)

    if (error) throw error
    return data as Seat[]
  }
}
