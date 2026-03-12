// Sponsored Ads Types
export interface SponsoredAd {
  id: string;
  sponsor_id: string;
  title: string;
  description: string;
  image_url: string;
  target_url: string;
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  start_date: string;
  end_date: string;
  targeting: AdTargeting;
  created_at: string;
  updated_at: string;
}

export interface AdTargeting {
  categories?: string[];
  locations?: string[];
  age_range?: { min: number; max: number };
  interests?: string[];
}

export interface AdMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  conversions: number;
}

export interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  website: string;
  contact_email: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface SponsoredEventSlot {
  id: string;
  event_id: string;
  sponsor_id: string;
  slot_type: string;
  price: number;
  status: 'available' | 'booked' | 'occupied';
  booked_at?: string;
  created_at: string;
}

export interface SponsoredEventBooking {
  id: string;
  event_id: string;
  sponsor_id: string;
  slot_id: string;
  booking_date: string;
  total_cost: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

export interface BannerAd {
  id: string;
  sponsor_id: string;
  title: string;
  image_url: string;
  target_url: string;
  dimensions: string;
  status: 'active' | 'inactive';
  impressions: number;
  clicks: number;
  created_at: string;
}

export interface AdTracking {
  id: string;
  ad_id: string;
  user_id?: string;
  event_type: 'impression' | 'click' | 'conversion';
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface SponsorProfile {
  id: string;
  user_id: string;
  company_name: string;
  logo_url?: string;
  website?: string;
  contact_email: string;
  contact_phone?: string;
  industry: string;
  budget_range: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface SponsorMatch {
  id: string;
  sponsor_id: string;
  event_id: string;
  match_score: number;
  match_reasons: string[];
  status: 'suggested' | 'contacted' | 'booked' | 'rejected';
  created_at: string;
}
