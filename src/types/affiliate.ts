// Affiliate Types
export interface Affiliate {
  id: string;
  user_id: string;
  referral_code: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  status: 'active' | 'suspended' | 'pending';
  total_earnings: number;
  total_referrals: number;
  created_at: string;
  updated_at: string;
}

export interface AffiliateAccount {
  id: string;
  user_id: string;
  affiliate_code: string;
  payment_method?: string;
  payment_details: any;
  status: string;
  total_earnings: number;
  pending_payout: number;
  total_referrals: number;
  total_clicks?: number;
  total_conversions?: number;
  conversion_rate?: number;
  total_earned?: number;
  total_paid?: number;
  created_at: string;
  updated_at: string;
}

export interface AffiliateReferralLink {
  id: string;
  affiliate_id: string;
  event_id: string;
  custom_slug?: string;
  clicks: number;
  conversions: number;
  revenue_generated: number;
  status: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliateClick {
  id: string;
  affiliate_id: string;
  link_id: string;
  user_id?: string;
  ip_address: string;
  user_agent: string;
  tracking_cookie: string;
  referrer?: string;
  clicked_at: string;
}

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  referral_id?: string;
  event_id: string;
  amount: number;
  commission_rate: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  payout_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliatePayout {
  id: string;
  affiliate_id: string;
  amount: number;
  commission_ids: string[];
  payment_method: string;
  payment_details: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliateMarketingMaterial {
  id: string;
  title: string;
  description: string;
  type: 'banner' | 'text_link' | 'social_post' | 'email_template';
  content: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AffiliateProgramConfig {
  id: string;
  is_enabled: boolean;
  default_commission_rate: number;
  minimum_payout: number;
  cookie_expiry_days: number;
  tiers: {
    bronze: { min_referrals: number; commission_rate: number };
    silver: { min_referrals: number; commission_rate: number };
    gold: { min_referrals: number; commission_rate: number };
    platinum: { min_referrals: number; commission_rate: number };
  };
  created_at: string;
  updated_at: string;
}

export interface AffiliateLink {
  id: string;
  affiliate_id: string;
  url: string;
  clicks: number;
  conversions: number;
  created_at: string;
}

export interface AffiliateEarning {
  id: string;
  affiliate_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  referral_id: string;
  created_at: string;
}
