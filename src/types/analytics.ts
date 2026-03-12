// Analytics Types
export interface AnalyticsData {
  event_id: string;
  views: number;
  registrations: number;
  tickets_sold: number;
  revenue: number;
  date_range: {
    start: string;
    end: string;
  };
}

export interface VisitorStats {
  total: number;
  unique: number;
  returning: number;
  by_source: Record<string, number>;
}

export interface ConversionMetrics {
  registration_rate: number;
  ticket_conversion_rate: number;
  average_time_to_register: number;
}

export interface AttendanceTracking {
  id: string;
  event_id: string;
  timestamp: string;
  attendees_present: number;
  capacity: number;
  check_ins: number;
  created_at: string;
  updated_at: string;
}

export interface RevenueAnalytics {
  id: string;
  event_id: string;
  date: string;
  total_revenue: number;
  ticket_sales: number;
  merchandise_sales: number;
  sponsorship_revenue: number;
  created_at: string;
}

export interface MarketingFunnel {
  id: string;
  event_id: string;
  stage: string;
  visitors: number;
  conversions: number;
  conversion_rate: number;
  created_at: string;
}

export interface AttendeeDemographics {
  id: string;
  event_id: string;
  age_group: string;
  gender: string;
  location: string;
  interests: string[];
  created_at: string;
}

export interface EngagementHeatmap {
  id: string;
  event_id: string;
  timestamp: string;
  location: string;
  engagement_score: number;
  attendees_count: number;
  created_at: string;
}

export interface AnalyticsReport {
  id: string;
  event_id: string;
  report_type: string;
  data: Record<string, any>;
  generated_at: string;
  created_at: string;
}

export interface TrafficSource {
  id: string;
  event_id: string;
  source: string;
  visitors: number;
  conversions: number;
  created_at: string;
}

export interface CustomMetric {
  id: string;
  event_id: string;
  metric_name: string;
  value: number;
  metadata: Record<string, any>;
  created_at: string;
}
