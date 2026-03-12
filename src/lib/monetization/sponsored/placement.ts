// =====================================================
// SPONSORED EVENT PLACEMENT
// =====================================================

import { createServerClient } from '@/lib/supabase/secure-client';
import { logger } from '@/lib/logger';

export interface SponsoredSlot {
  id: string;
  name: string;
  description: string;
  placementType: 'homepage_hero' | 'homepage_featured' | 'category_featured' | 'search_top' | 'sidebar';
  pricePerDay: number;
  maxSlots: number;
  isActive: boolean;
  displayOrder: number;
  requirements?: {
    minWidth?: number;
    minHeight?: number;
    maxSizeMB?: number;
    allowedFormats?: string[];
  };
}

export interface SponsoredBooking {
  id: string;
  eventId: string;
  slotId: string;
  sponsorUserId: string;
  startDate: string;
  endDate: string;
  dailyRate: number;
  totalAmount: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

/**
 * Get all available sponsored slots
 */
export async function getSponsoredSlots(): Promise<SponsoredSlot[]> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('sponsored_event_slots')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      logger.error('Error getting sponsored slots:', error);
      return [];
    }

    return data.map((slot) => ({
      id: slot.id,
      name: slot.name,
      description: slot.description || '',
      placementType: slot.placement_type,
      pricePerDay: slot.price_per_day,
      maxSlots: slot.max_slots || 1,
      isActive: slot.is_active,
      displayOrder: slot.display_order || 0,
    }));
  } catch (error) {
    logger.error('Error getting sponsored slots:', error);
    return [];
  }
}

/**
 * Get available slots for a date range
 */
export async function getAvailableSlots(
  startDate: string,
  endDate: string
): Promise<SponsoredSlot[]> {
  try {
    const supabase = await createServerClient();

    // Get all active slots
    const { data: slots, error } = await supabase
      .from('sponsored_event_slots')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      logger.error('Error getting slots:', error);
      return [];
    }

    // Check availability for each slot
    const availableSlots: SponsoredSlot[] = [];

    for (const slot of slots) {
      // Get existing bookings for this slot in the date range
      const { data: bookings } = await supabase
        .from('sponsored_event_bookings')
        .select('*')
        .eq('slot_id', slot.id)
        .in('status', ['pending', 'active'])
        .or(`start_date.gte.${startDate},end_date.lte.${endDate}`);

      // Check if slot is at capacity
      const maxSlots = slot.max_slots || 1;
      const currentBookings = bookings?.length || 0;

      if (currentBookings < maxSlots) {
        availableSlots.push({
          id: slot.id,
          name: slot.name,
          description: slot.description || '',
          placementType: slot.placement_type,
          pricePerDay: slot.price_per_day,
          maxSlots,
          isActive: slot.is_active,
          displayOrder: slot.display_order || 0,
        });
      }
    }

    return availableSlots;
  } catch (error) {
    logger.error('Error getting available slots:', error);
    return [];
  }
}

/**
 * Calculate cost for sponsored placement
 */
export function calculateSponsoredCost(
  pricePerDay: number,
  startDate: string,
  endDate: string
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return pricePerDay * days;
}

/**
 * Book a sponsored slot
 */
export async function bookSponsoredSlot(data: {
  eventId: string;
  slotId: string;
  startDate: string;
  endDate: string;
}): Promise<SponsoredBooking | null> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get slot details
    const { data: slot } = await supabase
      .from('sponsored_event_slots')
      .select('*')
      .eq('id', data.slotId)
      .single();

    if (!slot) {
      throw new Error('Invalid slot');
    }

    // Calculate cost
    const totalAmount = calculateSponsoredCost(
      slot.price_per_day,
      data.startDate,
      data.endDate
    );

    // Create booking
    const { data: booking, error } = await supabase
      .from('sponsored_event_bookings')
      .insert({
        event_id: data.eventId,
        slot_id: data.slotId,
        sponsor_user_id: user.id,
        start_date: data.startDate,
        end_date: data.endDate,
        daily_rate: slot.price_per_day,
        total_amount: totalAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating booking:', error);
      return null;
    }

    return {
      id: booking.id,
      eventId: booking.event_id,
      slotId: booking.slot_id,
      sponsorUserId: booking.sponsor_user_id,
      startDate: booking.start_date,
      endDate: booking.end_date,
      dailyRate: booking.daily_rate,
      totalAmount: booking.total_amount,
      status: booking.status,
      createdAt: booking.created_at,
    };
  } catch (error) {
    logger.error('Error booking sponsored slot:', error);
    return null;
  }
}

/**
 * Get user's sponsored bookings
 */
export async function getUserSponsoredBookings(userId: string): Promise<SponsoredBooking[]> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('sponsored_event_bookings')
      .select(`
        *,
        slot:sponsored_event_slots(*),
        event:events(title, start_date, end_date)
      `)
      .eq('sponsor_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error getting bookings:', error);
      return [];
    }

    return data.map((booking) => ({
      id: booking.id,
      eventId: booking.event_id,
      slotId: booking.slot_id,
      sponsorUserId: booking.sponsor_user_id,
      startDate: booking.start_date,
      endDate: booking.end_date,
      dailyRate: booking.daily_rate,
      totalAmount: booking.total_amount,
      status: booking.status,
      createdAt: booking.created_at,
    }));
  } catch (error) {
    logger.error('Error getting user bookings:', error);
    return [];
  }
}

/**
 * Get active sponsored events for display
 */
export async function getActiveSponsoredEvents(
  placementType: string,
  limit: number = 5
): Promise<Array<{ eventId: string; eventName: string; slotId: string }>> {
  try {
    const supabase = await createServerClient();

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('sponsored_event_bookings')
      .select(`
        event_id,
        events(title),
        slot_id
      `)
      .eq('status', 'active')
      .lte('start_date', now)
      .gte('end_date', now)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error getting active sponsored events:', error);
      return [];
    }

    return data.map((item: any) => ({
      eventId: item.event_id,
      eventName: item.events?.title || 'Untitled Event',
      slotId: item.slot_id,
    }));
  } catch (error) {
    logger.error('Error getting active sponsored events:', error);
    return [];
  }
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
  bookingId: string,
  status: 'active' | 'completed' | 'cancelled'
): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('sponsored_event_bookings')
      .update({ status })
      .eq('id', bookingId);

    if (error) {
      logger.error('Error updating booking status:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error updating booking status:', error);
    return false;
  }
}

/**
 * Cancel booking
 */
export async function cancelBooking(bookingId: string, reason?: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from('sponsored_event_bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (error) {
      logger.error('Error cancelling booking:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error cancelling booking:', error);
    return false;
  }
}

/**
 * Get placement requirements
 */
export function getPlacementRequirements(placementType: string) {
  const requirements: Record<string, SponsoredSlot['requirements']> = {
    homepage_hero: {
      minWidth: 1920,
      minHeight: 600,
      maxSizeMB: 5,
      allowedFormats: ['jpg', 'png', 'webp'],
    },
    homepage_featured: {
      minWidth: 800,
      minHeight: 450,
      maxSizeMB: 3,
      allowedFormats: ['jpg', 'png', 'webp'],
    },
    category_featured: {
      minWidth: 600,
      minHeight: 400,
      maxSizeMB: 2,
      allowedFormats: ['jpg', 'png', 'webp'],
    },
    search_top: {
      minWidth: 1200,
      minHeight: 200,
      maxSizeMB: 2,
      allowedFormats: ['jpg', 'png', 'webp'],
    },
    sidebar: {
      minWidth: 300,
      minHeight: 250,
      maxSizeMB: 1,
      allowedFormats: ['jpg', 'png', 'webp', 'gif'],
    },
  };

  return requirements[placementType] || null;
}
