// =====================================================
// SPONSORSHIP ANALYTICS
// =====================================================

import { createServerClient } from '@/lib/supabase/secure-client';
import { logger } from '@/lib/logger';

export interface SponsorshipAnalytics {
  totalBookings: number;
  activeBookings: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  avgBookingValue: number;
  topPerformingSlots: Array<{
    slotName: string;
    bookings: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    bookingId: string;
    eventName: string;
    slotName: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

export interface BookingPerformance {
  bookingId: string;
  eventName: string;
  slotName: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate
  conversions: number;
  costPerClick: number;
  costPerConversion: number;
  roi: number; // Return on investment
}

/**
 * Get sponsorship analytics for platform (admin)
 */
export async function getSponsorshipAnalytics(
  startDate?: string,
  endDate?: string
): Promise<SponsorshipAnalytics | null> {
  try {
    const supabase = await createServerClient();

    let query = supabase
      .from('sponsored_event_bookings')
      .select(`
        *,
        slot:sponsored_event_slots(*)
      `);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: bookings, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error('Error getting analytics:', error);
      return null;
    }

    // Calculate stats
    const totalBookings = bookings?.length || 0;
    const activeBookings = bookings?.filter((b: any) => b.status === 'active').length || 0;
    const pendingBookings = bookings?.filter((b: any) => b.status === 'pending').length || 0;
    const completedBookings = bookings?.filter((b: any) => b.status === 'completed').length || 0;
    const cancelledBookings = bookings?.filter((b: any) => b.status === 'cancelled').length || 0;
    const totalRevenue = bookings?.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0) || 0;
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Calculate top performing slots
    const slotStats: Record<
      string,
      { slotName: string; bookings: number; revenue: number }
    > = {};

    for (const booking of bookings || []) {
      const slotName = booking.slot?.name || 'Unknown';
      if (!slotStats[slotName]) {
        slotStats[slotName] = { slotName, bookings: 0, revenue: 0 };
      }
      slotStats[slotName].bookings++;
      slotStats[slotName].revenue += booking.total_amount || 0;
    }

    const topPerformingSlots = Object.values(slotStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get recent activity (last 10)
    const recentActivity = (bookings || [])
      .slice(0, 10)
      .map((booking: any) => ({
        bookingId: booking.id,
        eventName: booking.event?.title || 'Unknown Event',
        slotName: booking.slot?.name || 'Unknown Slot',
        amount: booking.total_amount,
        status: booking.status,
        createdAt: booking.created_at,
      }));

    return {
      totalBookings,
      activeBookings,
      pendingBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      avgBookingValue,
      topPerformingSlots,
      recentActivity,
    };
  } catch (error) {
    logger.error('Error getting sponsorship analytics:', error);
    return null;
  }
}

/**
 * Get sponsorship analytics for a specific user
 */
export async function getUserSponsorshipAnalytics(userId: string): Promise<SponsorshipAnalytics | null> {
  try {
    const supabase = await createServerClient();

    const { data: bookings, error } = await supabase
      .from('sponsored_event_bookings')
      .select(`
        *,
        slot:sponsored_event_slots(*),
        event:events(title)
      `)
      .eq('sponsor_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error getting user analytics:', error);
      return null;
    }

    const totalBookings = bookings?.length || 0;
    const activeBookings = bookings?.filter((b: any) => b.status === 'active').length || 0;
    const pendingBookings = bookings?.filter((b: any) => b.status === 'pending').length || 0;
    const completedBookings = bookings?.filter((b: any) => b.status === 'completed').length || 0;
    const cancelledBookings = bookings?.filter((b: any) => b.status === 'cancelled').length || 0;
    const totalRevenue = bookings?.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0) || 0;
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    const slotStats: Record<
      string,
      { slotName: string; bookings: number; revenue: number }
    > = {};

    for (const booking of bookings || []) {
      const slotName = booking.slot?.name || 'Unknown';
      if (!slotStats[slotName]) {
        slotStats[slotName] = { slotName, bookings: 0, revenue: 0 };
      }
      slotStats[slotName].bookings++;
      slotStats[slotName].revenue += booking.total_amount || 0;
    }

    const topPerformingSlots = Object.values(slotStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const recentActivity = (bookings || [])
      .slice(0, 10)
      .map((booking: any) => ({
        bookingId: booking.id,
        eventName: booking.event?.title || 'Unknown Event',
        slotName: booking.slot?.name || 'Unknown Slot',
        amount: booking.total_amount,
        status: booking.status,
        createdAt: booking.created_at,
      }));

    return {
      totalBookings,
      activeBookings,
      pendingBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      avgBookingValue,
      topPerformingSlots,
      recentActivity,
    };
  } catch (error) {
    logger.error('Error getting user sponsorship analytics:', error);
    return null;
  }
}

/**
 * Get performance for a specific booking
 */
export async function getBookingPerformance(bookingId: string): Promise<BookingPerformance | null> {
  try {
    const supabase = await createServerClient();

    // Get booking details
    const { data: booking, error } = await supabase
      .from('sponsored_event_bookings')
      .select(`
        *,
        slot:sponsored_event_slots(*),
        event:events(title)
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return null;
    }

    // Get tracking data
    const { data: tracking } = await supabase
      .from('ad_tracking')
      .select('*')
      .eq('ad_id', bookingId);

    const impressions = tracking?.filter((t: any) => t.event_type === 'impression').length || 0;
    const clicks = tracking?.filter((t: any) => t.event_type === 'click').length || 0;
    const conversions = tracking?.filter((t: any) => t.event_type === 'conversion').length || 0;

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const costPerClick = clicks > 0 ? booking.total_amount / clicks : 0;
    const costPerConversion = conversions > 0 ? booking.total_amount / conversions : 0;

    // ROI would need conversion value data
    const roi = 0; // Placeholder

    return {
      bookingId: booking.id,
      eventName: booking.event?.title || 'Unknown Event',
      slotName: booking.slot?.name || 'Unknown Slot',
      startDate: booking.start_date,
      endDate: booking.end_date,
      totalAmount: booking.total_amount,
      impressions,
      clicks,
      ctr,
      conversions,
      costPerClick,
      costPerConversion,
      roi,
    };
  } catch (error) {
    logger.error('Error getting booking performance:', error);
    return null;
  }
}

/**
 * Get sponsorship trends over time
 */
export async function getSponsorshipTrends(
  months: number = 12
): Promise<Array<{ month: string; revenue: number; bookings: number }>> {
  try {
    const supabase = await createServerClient();

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data: bookings, error } = await supabase
      .from('sponsored_event_bookings')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error getting trends:', error);
      return [];
    }

    // Group by month
    const monthlyStats: Record<string, { revenue: number; bookings: number }> = {};

    for (const booking of bookings || []) {
      const date = new Date(booking.created_at);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { revenue: 0, bookings: 0 };
      }

      monthlyStats[monthKey].revenue += booking.total_amount || 0;
      monthlyStats[monthKey].bookings++;
    }

    return Object.entries(monthlyStats).map(([month, stats]) => ({
      month,
      revenue: stats.revenue,
      bookings: stats.bookings,
    }));
  } catch (error) {
    logger.error('Error getting sponsorship trends:', error);
    return [];
  }
}

/**
 * Get slot performance comparison
 */
export async function getSlotPerformance(): Promise<
  Array<{
    slotId: string;
    slotName: string;
    totalBookings: number;
    totalRevenue: number;
    avgRevenue: number;
    occupancyRate: number;
  }>
> {
  try {
    const supabase = await createServerClient();

    const { data: slots, error: slotsError } = await supabase
      .from('sponsored_event_slots')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (slotsError) {
      logger.error('Error getting slots:', slotsError);
      return [];
    }

    const performance = [];

    for (const slot of slots || []) {
      const { data: bookings } = await supabase
        .from('sponsored_event_bookings')
        .select('*')
        .eq('slot_id', slot.id);

      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0) || 0;
      const avgRevenue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Calculate occupancy rate (active bookings / max slots)
      const activeBookings = bookings?.filter((b: any) => b.status === 'active').length || 0;
      const maxSlots = slot.max_slots || 1;
      const occupancyRate = maxSlots > 0 ? (activeBookings / maxSlots) * 100 : 0;

      performance.push({
        slotId: slot.id,
        slotName: slot.name,
        totalBookings,
        totalRevenue,
        avgRevenue,
        occupancyRate,
      });
    }

    return performance.sort((a, b) => b.totalRevenue - a.totalRevenue);
  } catch (error) {
    logger.error('Error getting slot performance:', error);
    return [];
  }
}

/**
 * Generate sponsorship report
 */
export async function generateSponsorshipReport(
  format: 'json' | 'csv' = 'json',
  startDate?: string,
  endDate?: string
): Promise<any> {
  try {
    const analytics = await getSponsorshipAnalytics(startDate, endDate);
    const trends = await getSponsorshipTrends(12);
    const slotPerformance = await getSlotPerformance();

    const report = {
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate },
      summary: analytics,
      trends,
      slotPerformance,
    };

    if (format === 'csv') {
      // Convert to CSV format
      return convertToCSV(report);
    }

    return report;
  } catch (error) {
    logger.error('Error generating report:', error);
    return null;
  }
}

function convertToCSV(data: any): string {
  // Simple CSV conversion - would be more sophisticated in production
  const lines: string[] = [];

  lines.push('Month,Revenue,Bookings');
  for (const trend of data.trends) {
    lines.push(`${trend.month},${trend.revenue},${trend.bookings}`);
  }

  return lines.join('\n');
}
