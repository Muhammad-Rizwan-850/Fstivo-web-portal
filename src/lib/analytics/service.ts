// =====================================================
// FSTIVO EVENT ANALYTICS SERVICE
// =====================================================
// Deep insights into event performance
// Features: Real-time tracking, revenue, demographics, heatmaps
// =====================================================

import { createClient } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface AnalyticsOverview {
  id: string;
  event_id: string;
  total_tickets_sold: number;
  total_tickets_available: number;
  total_attendees: number;
  checked_in_count: number;
  no_show_count: number;
  waitlist_count: number;
  total_revenue: number;
  average_ticket_price: number;
  revenue_by_ticket_type: Record<string, number>;
  refund_amount: number;
  net_revenue: number;
  page_views: number;
  unique_visitors: number;
  conversion_rate: number;
  add_to_cart_count: number;
  abandoned_cart_count: number;
  average_time_on_page: number;
  social_shares: number;
  email_opens: number;
  email_clicks: number;
  last_updated: string;
  created_at: string;
}

export interface RevenueAnalytics {
  date: string;
  tickets_sold: number;
  revenue: number;
  refunds: number;
  net_revenue: number;
  revenue_by_type: Record<string, number>;
  payment_method_breakdown: Record<string, number>;
  discount_amount: number;
  promo_codes_used: string[];
}

export interface MarketingFunnel {
  date: string;
  impressions: number;
  page_views: number;
  unique_visitors: number;
  ticket_selections: number;
  add_to_cart: number;
  checkout_started: number;
  checkout_completed: number;
  view_to_selection_rate: number;
  selection_to_cart_rate: number;
  cart_to_checkout_rate: number;
  checkout_completion_rate: number;
  overall_conversion_rate: number;
  traffic_sources: Record<string, number>;
}

export interface AttendeeDemographics {
  event_id: string;
  age_distribution: Record<string, number>;
  gender_distribution: Record<string, number>;
  city_distribution: Record<string, number>;
  country_distribution: Record<string, number>;
  industry_distribution: Record<string, number>;
  ticket_type_by_demographic: Record<string, any>;
  avg_engagement_score: number;
  last_updated: string;
}

export interface TrafficSource {
  source: string;
  visitors: number;
  conversions: number;
  revenue: number;
  conversion_rate: number;
}

export interface ConversionRate {
  stage: string;
  count: number;
  rate: number;
}

// =====================================================
// ANALYTICS SERVICE CLASS
// =====================================================

export class AnalyticsService {

  // =====================================================
  // EVENT ANALYTICS OVERVIEW
  // =====================================================

  async getOverview(eventId: string): Promise<AnalyticsOverview | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('event_analytics_overview')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (error) {
      logger.error('Error fetching analytics overview:', error);
      return null;
    }

    return data as AnalyticsOverview;
  }

  async updateOverview(eventId: string): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await (supabase as any).rpc('update_event_analytics', {
      p_event_id: eventId
    });

    if (error) {
      logger.error('Error updating analytics:', error);
      return false;
    }

    return true;
  }

  // =====================================================
  // ATTENDANCE TRACKING
  // =====================================================

  async logCheckIn(
    eventId: string,
    userId: string,
    ticketId: string,
    method: 'qr_code' | 'manual' | 'nfc',
    location?: { lat: number; lng: number; venue_section?: string }
  ): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await (supabase as any)
      .from('attendance_logs')
      .insert({
        event_id: eventId,
        user_id: userId,
        ticket_id: ticketId,
        action_type: 'checked_in',
        check_in_time: new Date().toISOString(),
        check_in_method: method,
        check_in_location: location,
      });

    if (error) {
      logger.error('Error logging check-in:', error);
      return false;
    }

    // Update analytics overview
    await this.updateOverview(eventId);

    return true;
  }

  async logCheckOut(
    eventId: string,
    userId: string,
    ticketId: string
  ): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await (supabase as any)
      .from('attendance_logs')
      .update({
        action_type: 'checked_out',
        check_out_time: new Date().toISOString(),
      })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('ticket_id', ticketId);

    if (error) {
      logger.error('Error logging check-out:', error);
      return false;
    }

    return true;
  }

  async getAttendanceLogs(eventId: string): Promise<any[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('event_id', eventId)
      .order('check_in_time', { ascending: false });

    if (error) {
      logger.error('Error fetching attendance logs:', error);
      return [];
    }

    return data || [];
  }

  // =====================================================
  // REVENUE ANALYTICS
  // =====================================================

  async getRevenueAnalytics(
    eventId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RevenueAnalytics[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('revenue_analytics')
      .select('*')
      .eq('event_id', eventId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      logger.error('Error fetching revenue analytics:', error);
      return [];
    }

    return (data || []) as RevenueAnalytics[];
  }

  async getRevenueByDateRange(
    eventId: string,
    days: number = 7
  ): Promise<Array<{ date: string; revenue: number }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await this.getRevenueAnalytics(eventId, startDate, endDate);

    return analytics.map(a => ({
      date: a.date,
      revenue: parseFloat(a.revenue as any) || 0
    }));
  }

  // =====================================================
  // MARKETING FUNNEL
  // =====================================================

  async getMarketingFunnel(eventId: string): Promise<MarketingFunnel | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('marketing_funnel')
      .select('*')
      .eq('event_id', eventId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      logger.error('Error fetching marketing funnel:', error);
      return null;
    }

    return data as MarketingFunnel;
  }

  async getConversionRates(eventId: string): Promise<ConversionRate[]> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .rpc('calculate_conversion_rates', { p_event_id: eventId });

    if (error) {
      logger.error('Error calculating conversion rates:', error);
      return [];
    }

    return (data || []) as ConversionRate[];
  }

  // =====================================================
  // DEMOGRAPHICS
  // =====================================================

  async getDemographics(eventId: string): Promise<AttendeeDemographics | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('attendee_demographics')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (error) {
      logger.error('Error fetching demographics:', error);
      return null;
    }

    return data as AttendeeDemographics;
  }

  // =====================================================
  // TRAFFIC SOURCES
  // =====================================================

  async getTrafficSources(eventId: string, limit: number = 10): Promise<TrafficSource[]> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .rpc('get_top_traffic_sources', {
        p_event_id: eventId,
        p_limit: limit
      });

    if (error) {
      logger.error('Error fetching traffic sources:', error);
      return [];
    }

    return (data || []) as TrafficSource[];
  }

  // =====================================================
  // ANALYTICS EVENTS TRACKING
  // =====================================================

  async trackEvent(
    eventId: string,
    eventType: string,
    userId?: string,
    eventData?: Record<string, any>,
    sessionId?: string
  ): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await (supabase as any)
      .from('analytics_events')
      .insert({
        event_id: eventId,
        event_type: eventType,
        user_id: userId || null,
        event_data: eventData || {},
        session_id: sessionId || null,
        timestamp: new Date().toISOString(),
      });

    if (error) {
      logger.error('Error tracking event:', error);
      return false;
    }

    return true;
  }

  async trackPageView(
    eventId: string,
    userId?: string,
    sessionId?: string
  ): Promise<boolean> {
    return this.trackEvent(eventId, 'page_view', userId, {}, sessionId);
  }

  async trackTicketPurchase(
    eventId: string,
    userId: string,
    amount: number,
    ticketType: string
  ): Promise<boolean> {
    return this.trackEvent(eventId, 'ticket_purchase', userId, {
      amount,
      ticket_type: ticketType,
      timestamp: new Date().toISOString()
    });
  }

  // =====================================================
  // REAL-TIME ACTIVITY FEED
  // =====================================================

  async getRecentActivity(eventId: string, limit: number = 10): Promise<any[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('event_id', eventId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching recent activity:', error);
      return [];
    }

    return data || [];
  }

  // =====================================================
  // COMPARATIVE ANALYTICS
  // =====================================================

  async compareWithPreviousEvent(
    eventId: string,
    previousEventId: string
  ): Promise<any[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('comparative_analytics')
      .select('*')
      .eq('event_id', eventId)
      .eq('comparison_event_id', previousEventId)
      .eq('comparison_type', 'previous_event');

    if (error) {
      logger.error('Error fetching comparison:', error);
      return [];
    }

    return data || [];
  }

  // =====================================================
  // EXPORT REPORTS
  // =====================================================

  async createExport(
    eventId: string,
    userId: string,
    exportType: 'pdf' | 'excel' | 'csv',
    reportType: string,
    dateRangeStart: Date,
    dateRangeEnd: Date,
    filters?: Record<string, any>
  ): Promise<string | null> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from('analytics_exports')
      .insert({
        event_id: eventId,
        user_id: userId,
        export_type: exportType,
        report_type: reportType,
        date_range_start: dateRangeStart.toISOString().split('T')[0],
        date_range_end: dateRangeEnd.toISOString().split('T')[0],
        filters_applied: filters || {},
        status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Error creating export:', error);
      return null;
    }

    return data.id;
  }

  async getExportStatus(exportId: string): Promise<any> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('analytics_exports')
      .select('*')
      .eq('id', exportId)
      .single();

    if (error) {
      logger.error('Error fetching export status:', error);
      return null;
    }

    return data;
  }

  // =====================================================
  // DASHBOARD SUMMARY
  // =====================================================

  async getDashboardSummary(eventId: string): Promise<{
    overview: AnalyticsOverview | null;
    revenueByDay: Array<{ date: string; revenue: number }>;
    funnel: MarketingFunnel | null;
    conversionRates: ConversionRate[];
    trafficSources: TrafficSource[];
    demographics: AttendeeDemographics | null;
    recentActivity: any[];
  }> {
    const [
      overview,
      revenueByDay,
      funnel,
      conversionRates,
      trafficSources,
      demographics,
      recentActivity
    ] = await Promise.all([
      this.getOverview(eventId),
      this.getRevenueByDateRange(eventId, 7),
      this.getMarketingFunnel(eventId),
      this.getConversionRates(eventId),
      this.getTrafficSources(eventId, 5),
      this.getDemographics(eventId),
      this.getRecentActivity(eventId, 5)
    ]);

    return {
      overview,
      revenueByDay,
      funnel,
      conversionRates,
      trafficSources,
      demographics,
      recentActivity
    };
  }
}

// =====================================================
// SINGLETON EXPORT
// =====================================================

export const analyticsService = new AnalyticsService();
