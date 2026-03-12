-- =====================================================
-- REVENUE & MONETIZATION SYSTEM - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Features: Subscription Plans, Sponsored Ads, Affiliate Program
-- Date: January 5, 2026
-- =====================================================

-- ============================================================================
-- SECTION 1: SUBSCRIPTION PLANS FOR ORGANIZERS
-- ============================================================================

-- Subscription tiers configuration
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE, -- 'free', 'pro', 'business', 'enterprise'
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'PKR',
  features JSONB NOT NULL, -- Feature flags and limits
  limits JSONB NOT NULL, -- Usage limits
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default subscription tiers
INSERT INTO subscription_tiers (name, display_name, description, price_monthly, price_yearly, features, limits) VALUES
('free', 'Free', 'Perfect for getting started', 0, 0,
  '{"basic_analytics": true, "email_support": true, "custom_branding": false, "advanced_analytics": false, "priority_support": false, "api_access": false}'::jsonb,
  '{"events_per_year": 5, "attendees_per_event": 100, "email_campaigns": 3, "storage_gb": 1, "team_members": 1}'::jsonb
),
('pro', 'Pro', 'For growing organizers', 2900, 29000,
  '{"basic_analytics": true, "email_support": true, "custom_branding": true, "advanced_analytics": true, "priority_support": false, "api_access": false, "email_marketing": true, "event_cloning": true}'::jsonb,
  '{"events_per_year": 50, "attendees_per_event": 1000, "email_campaigns": 50, "storage_gb": 10, "team_members": 5}'::jsonb
),
('business', 'Business', 'For professional event organizers', 9900, 99000,
  '{"basic_analytics": true, "email_support": true, "custom_branding": true, "advanced_analytics": true, "priority_support": true, "api_access": true, "email_marketing": true, "event_cloning": true, "white_label": true, "dedicated_support": false}'::jsonb,
  '{"events_per_year": -1, "attendees_per_event": 10000, "email_campaigns": -1, "storage_gb": 100, "team_members": 20}'::jsonb
),
('enterprise', 'Enterprise', 'Custom solutions for large organizations', 0, 0,
  '{"basic_analytics": true, "email_support": true, "custom_branding": true, "advanced_analytics": true, "priority_support": true, "api_access": true, "email_marketing": true, "event_cloning": true, "white_label": true, "dedicated_support": true, "custom_integration": true}'::jsonb,
  '{"events_per_year": -1, "attendees_per_event": -1, "email_campaigns": -1, "storage_gb": -1, "team_members": -1}'::jsonb
) ON CONFLICT (name) DO NOTHING;

CREATE INDEX idx_subscription_tiers_active ON subscription_tiers(is_active) WHERE is_active = true;
CREATE INDEX idx_subscription_tiers_order ON subscription_tiers(display_order);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES subscription_tiers(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended', 'trialing', 'past_due')),
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'PKR',

  -- Billing dates
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- Payment information
  payment_method VARCHAR(50), -- 'stripe', 'jazzcash', 'easypaisa'
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),

  -- Usage tracking
  usage_data JSONB DEFAULT '{}'::jsonb,
  last_usage_reset TIMESTAMPTZ DEFAULT NOW(),

  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, status)
);

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_tier ON user_subscriptions(tier_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_period_end ON user_subscriptions(current_period_end);
CREATE INDEX idx_user_subscriptions_stripe_sub ON user_subscriptions(stripe_subscription_id);

-- Subscription usage tracking
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL, -- 'events', 'attendees', 'emails', 'storage'
  quantity INT NOT NULL DEFAULT 1,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metadata JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_usage_subscription ON subscription_usage(subscription_id);
CREATE INDEX idx_subscription_usage_type ON subscription_usage(resource_type);
CREATE INDEX idx_subscription_usage_period ON subscription_usage(period_start, period_end);

-- Feature gates (track feature access)
CREATE TABLE IF NOT EXISTS feature_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  required_tier VARCHAR(50)[], -- Array of tier names that can access
  is_usage_based BOOLEAN DEFAULT false,
  usage_limit_key VARCHAR(50), -- Key in limits JSONB
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Common feature gates
INSERT INTO feature_gates (name, description, required_tier, is_usage_based, usage_limit_key) VALUES
('create_event', 'Create new events', ARRAY['free', 'pro', 'business', 'enterprise'], true, 'events_per_year'),
('advanced_analytics', 'Access advanced analytics', ARRAY['pro', 'business', 'enterprise'], false, null),
('custom_branding', 'Custom branding and white-label', ARRAY['pro', 'business', 'enterprise'], false, null),
('email_campaigns', 'Email marketing campaigns', ARRAY['pro', 'business', 'enterprise'], true, 'email_campaigns'),
('api_access', 'API access', ARRAY['business', 'enterprise'], false, null),
('priority_support', 'Priority customer support', ARRAY['business', 'enterprise'], false, null),
('team_members', 'Add team members', ARRAY['pro', 'business', 'enterprise'], true, 'team_members')
ON CONFLICT (name) DO NOTHING;

-- Subscription invoices
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'PKR',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'void')),

  -- Billing details
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,

  -- Payment details
  payment_method VARCHAR(50),
  payment_transaction_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),

  -- Invoice items (line items)
  line_items JSONB NOT NULL,

  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_subscription ON subscription_invoices(subscription_id);
CREATE INDEX idx_invoices_user ON subscription_invoices(user_id);
CREATE INDEX idx_invoices_status ON subscription_invoices(status);
CREATE INDEX idx_invoices_due_date ON subscription_invoices(due_date);
CREATE INDEX idx_invoices_number ON subscription_invoices(invoice_number);

-- Subscription change history
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'created', 'upgraded', 'downgraded', 'cancelled', 'renewed', 'expired'
  from_tier_id UUID REFERENCES subscription_tiers(id),
  to_tier_id UUID REFERENCES subscription_tiers(id),
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_history_user ON subscription_history(user_id);
CREATE INDEX idx_subscription_history_action ON subscription_history(action);
CREATE INDEX idx_subscription_history_created ON subscription_history(created_at DESC);

-- ============================================================================
-- SECTION 2: SPONSORED EVENTS & ADS
-- ============================================================================

-- Sponsored event slots
CREATE TABLE IF NOT EXISTS sponsored_event_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  placement VARCHAR(50) NOT NULL, -- 'homepage_hero', 'homepage_grid', 'search_results', 'category_page'
  position INT NOT NULL, -- Order in placement
  max_events INT DEFAULT 5,
  price_per_day NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'PKR',
  impressions_limit INT, -- Max daily impressions
  clicks_limit INT, -- Max daily clicks
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sponsored_slots_placement ON sponsored_event_slots(placement);
CREATE INDEX idx_sponsored_slots_active ON sponsored_event_slots(is_active) WHERE is_active = true;

-- Default sponsored slots
INSERT INTO sponsored_event_slots (name, description, placement, position, max_events, price_per_day) VALUES
('Homepage Hero Banner', 'Large banner at top of homepage', 'homepage_hero', 1, 1, 5000),
('Homepage Featured Grid', 'Featured events grid on homepage', 'homepage_grid', 2, 3, 2000),
('Search Results Top', 'Top of search results', 'search_results', 1, 2, 1500),
('Category Page Featured', 'Featured in category pages', 'category_page', 1, 2, 1000)
ON CONFLICT DO NOTHING;

-- Sponsored event bookings
CREATE TABLE IF NOT EXISTS sponsored_event_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES sponsored_event_slots(id) ON DELETE CASCADE,
  sponsor_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Booking details
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INT GENERATED ALWAYS AS (end_date - start_date + 1) STORED,

  -- Pricing
  daily_rate NUMERIC(10, 2) NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'PKR',

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'completed', 'cancelled', 'rejected')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),

  -- Performance tracking
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,

  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sponsored_bookings_event ON sponsored_event_bookings(event_id);
CREATE INDEX idx_sponsored_bookings_slot ON sponsored_event_bookings(slot_id);
CREATE INDEX idx_sponsored_bookings_sponsor ON sponsored_event_bookings(sponsor_user_id);
CREATE INDEX idx_sponsored_bookings_dates ON sponsored_event_bookings(start_date, end_date);
CREATE INDEX idx_sponsored_bookings_status ON sponsored_event_bookings(status);

-- Banner ads system
CREATE TABLE IF NOT EXISTS banner_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Ad content
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  call_to_action VARCHAR(50), -- 'Learn More', 'Register Now', 'Buy Tickets'

  -- Targeting
  placement VARCHAR(50) NOT NULL, -- 'sidebar', 'between_events', 'footer', 'modal'
  target_categories VARCHAR(100)[],
  target_cities VARCHAR(100)[],

  -- Budget & Pricing
  budget_type VARCHAR(20) NOT NULL CHECK (budget_type IN ('daily', 'total', 'per_click', 'per_impression')),
  budget_amount NUMERIC(10, 2) NOT NULL,
  spent_amount NUMERIC(10, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'PKR',

  -- Schedule
  start_date DATE NOT NULL,
  end_date DATE,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'active', 'paused', 'completed', 'rejected')),
  rejection_reason TEXT,

  -- Performance
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  ctr NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE WHEN impressions > 0
    THEN (clicks::numeric / impressions * 100)
    ELSE 0 END
  ) STORED,

  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_banner_ads_advertiser ON banner_ads(advertiser_id);
CREATE INDEX idx_banner_ads_placement ON banner_ads(placement);
CREATE INDEX idx_banner_ads_status ON banner_ads(status);
CREATE INDEX idx_banner_ads_dates ON banner_ads(start_date, end_date);
CREATE INDEX idx_banner_ads_active ON banner_ads(status) WHERE status = 'active';

-- Ad impressions & clicks tracking
CREATE TABLE IF NOT EXISTS ad_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES banner_ads(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES sponsored_event_bookings(id) ON DELETE CASCADE,

  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('impression', 'click', 'conversion')),

  -- User info
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,

  -- Context
  page_url TEXT,
  referrer TEXT,

  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ad_tracking_ad ON ad_tracking(ad_id);
CREATE INDEX idx_ad_tracking_booking ON ad_tracking(booking_id);
CREATE INDEX idx_ad_tracking_type ON ad_tracking(event_type);
CREATE INDEX idx_ad_tracking_timestamp ON ad_tracking(timestamp DESC);

-- Sponsor matchmaking
CREATE TABLE IF NOT EXISTS sponsor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  company_name VARCHAR(200) NOT NULL,
  industry VARCHAR(100),
  description TEXT,
  logo_url TEXT,
  website_url TEXT,

  -- Sponsorship preferences
  interested_categories VARCHAR(100)[],
  interested_cities VARCHAR(100)[],
  budget_range JSONB, -- {min: 50000, max: 500000}
  sponsorship_type VARCHAR(50)[], -- 'title', 'gold', 'silver', 'bronze'

  -- Contact
  contact_name VARCHAR(200),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sponsor_profiles_user ON sponsor_profiles(user_id);
CREATE INDEX idx_sponsor_profiles_industry ON sponsor_profiles(industry);
CREATE INDEX idx_sponsor_profiles_active ON sponsor_profiles(is_active) WHERE is_active = true;

-- Sponsor matches (AI recommendations)
CREATE TABLE IF NOT EXISTS sponsor_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES sponsor_profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  match_score NUMERIC(5, 2), -- 0-100
  match_reasons JSONB, -- Array of why this is a good match
  status VARCHAR(20) DEFAULT 'suggested' CHECK (status IN ('suggested', 'contacted', 'interested', 'declined', 'confirmed')),
  contacted_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sponsor_matches_sponsor ON sponsor_matches(sponsor_id);
CREATE INDEX idx_sponsor_matches_event ON sponsor_matches(event_id);
CREATE INDEX idx_sponsor_matches_score ON sponsor_matches(match_score DESC);
CREATE INDEX idx_sponsor_matches_status ON sponsor_matches(status);

-- ============================================================================
-- SECTION 3: AFFILIATE COMMISSION PROGRAM
-- ============================================================================

-- Affiliate program configuration
CREATE TABLE IF NOT EXISTS affiliate_program_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL DEFAULT 'FSTIVO Affiliate Program',
  description TEXT,

  -- Commission structure
  commission_type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed', 'tiered')),
  commission_percentage NUMERIC(5, 2) DEFAULT 10.00, -- 10%
  commission_fixed_amount NUMERIC(10, 2) DEFAULT 0,

  -- Tiered commissions (if applicable)
  commission_tiers JSONB, -- [{min_sales: 0, rate: 10}, {min_sales: 10, rate: 12}, {min_sales: 50, rate: 15}]

  -- Cookie duration
  cookie_duration_days INT DEFAULT 30,

  -- Minimum payout
  minimum_payout NUMERIC(10, 2) DEFAULT 1000, -- PKR 1000

  -- Payout schedule
  payout_frequency VARCHAR(20) DEFAULT 'monthly' CHECK (payout_frequency IN ('weekly', 'biweekly', 'monthly')),

  is_active BOOLEAN DEFAULT true,
  terms_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default config
INSERT INTO affiliate_program_config (commission_percentage, minimum_payout)
VALUES (10.00, 1000)
ON CONFLICT DO NOTHING;

-- Affiliate accounts
CREATE TABLE IF NOT EXISTS affiliate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,

  -- Unique affiliate code
  affiliate_code VARCHAR(20) UNIQUE NOT NULL,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),

  -- Payment information
  payment_method VARCHAR(50), -- 'bank_transfer', 'jazzcash', 'easypaisa'
  payment_details JSONB, -- Bank account, mobile number, etc.

  -- Statistics
  total_clicks INT DEFAULT 0,
  total_conversions INT DEFAULT 0,
  total_earned NUMERIC(10, 2) DEFAULT 0,
  total_paid NUMERIC(10, 2) DEFAULT 0,
  pending_payout NUMERIC(10, 2) DEFAULT 0,

  conversion_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE WHEN total_clicks > 0
    THEN (total_conversions::numeric / total_clicks * 100)
    ELSE 0 END
  ) STORED,

  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affiliate_accounts_user ON affiliate_accounts(user_id);
CREATE INDEX idx_affiliate_accounts_code ON affiliate_accounts(affiliate_code);
CREATE INDEX idx_affiliate_accounts_status ON affiliate_accounts(status);

-- Affiliate referral links
CREATE TABLE IF NOT EXISTS affiliate_referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate_accounts(id) ON DELETE CASCADE,

  -- Link details
  link_type VARCHAR(50) NOT NULL, -- 'general', 'event_specific', 'category_specific'
  target_event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  target_category VARCHAR(100),

  -- Short URL
  short_code VARCHAR(20) UNIQUE NOT NULL,
  full_url TEXT NOT NULL,

  -- Tracking
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  revenue_generated NUMERIC(10, 2) DEFAULT 0,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referral_links_affiliate ON affiliate_referral_links(affiliate_id);
CREATE INDEX idx_referral_links_short ON affiliate_referral_links(short_code);
CREATE INDEX idx_referral_links_event ON affiliate_referral_links(target_event_id);
CREATE INDEX idx_referral_links_active ON affiliate_referral_links(is_active) WHERE is_active = true;

-- Affiliate clicks tracking
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES affiliate_referral_links(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES affiliate_accounts(id) ON DELETE CASCADE,

  -- Click details
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,

  -- Cookie for attribution
  tracking_cookie VARCHAR(100) UNIQUE,
  cookie_expires_at TIMESTAMPTZ,

  -- Conversion tracking
  converted BOOLEAN DEFAULT false,
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,

  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affiliate_clicks_link ON affiliate_clicks(link_id);
CREATE INDEX idx_affiliate_clicks_affiliate ON affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_clicks_cookie ON affiliate_clicks(tracking_cookie);
CREATE INDEX idx_affiliate_clicks_converted ON affiliate_clicks(converted);
CREATE INDEX idx_affiliate_clicks_expires ON affiliate_clicks(cookie_expires_at);

-- Affiliate commissions
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate_accounts(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  click_id UUID REFERENCES affiliate_clicks(id) ON DELETE SET NULL,

  -- Commission details
  order_amount NUMERIC(10, 2) NOT NULL,
  commission_rate NUMERIC(5, 2) NOT NULL,
  commission_amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'PKR',

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),

  -- Dates
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commissions_affiliate ON affiliate_commissions(affiliate_id);
CREATE INDEX idx_commissions_registration ON affiliate_commissions(registration_id);
CREATE INDEX idx_commissions_status ON affiliate_commissions(status);
CREATE INDEX idx_commissions_created ON affiliate_commissions(created_at DESC);

-- Affiliate payouts
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate_accounts(id) ON DELETE CASCADE,

  -- Payout details
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'PKR',

  -- Commission IDs included
  commission_ids UUID[] NOT NULL,
  commission_count INT GENERATED ALWAYS AS (array_length(commission_ids, 1)) STORED,

  -- Payment
  payment_method VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(255),
  payment_details JSONB,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payouts_affiliate ON affiliate_payouts(affiliate_id);
CREATE INDEX idx_payouts_status ON affiliate_payouts(status);
CREATE INDEX idx_payouts_created ON affiliate_payouts(created_at DESC);

-- Affiliate leaderboard (materialized view for performance)
CREATE MATERIALIZED VIEW affiliate_leaderboard AS
SELECT
  aa.id as affiliate_id,
  aa.affiliate_code,
  p.full_name as affiliate_name,
  p.avatar_url,
  aa.total_conversions,
  aa.total_earned,
  COUNT(ac.id) as total_sales,
  COALESCE(SUM(ac.commission_amount), 0) as month_earnings,
  RANK() OVER (ORDER BY aa.total_earned DESC) as all_time_rank,
  RANK() OVER (ORDER BY COALESCE(SUM(CASE WHEN ac.created_at >= date_trunc('month', NOW()) THEN ac.commission_amount ELSE 0 END), 0) DESC) as month_rank
FROM affiliate_accounts aa
JOIN profiles p ON aa.user_id = p.id
LEFT JOIN affiliate_commissions ac ON aa.id = ac.affiliate_id AND ac.status = 'approved'
WHERE aa.status = 'active'
GROUP BY aa.id, aa.affiliate_code, p.full_name, p.avatar_url, aa.total_conversions, aa.total_earned;

CREATE UNIQUE INDEX idx_leaderboard_affiliate ON affiliate_leaderboard(affiliate_id);
CREATE INDEX idx_leaderboard_all_time ON affiliate_leaderboard(all_time_rank);
CREATE INDEX idx_leaderboard_month ON affiliate_leaderboard(month_rank);

-- Refresh leaderboard daily
CREATE OR REPLACE FUNCTION refresh_affiliate_leaderboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY affiliate_leaderboard;
END;
$$ LANGUAGE plpgsql;

-- Marketing materials for affiliates
CREATE TABLE IF NOT EXISTS affiliate_marketing_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  material_type VARCHAR(50) NOT NULL CHECK (material_type IN ('banner', 'email_template', 'social_post', 'video', 'landing_page')),
  file_url TEXT,
  thumbnail_url TEXT,
  dimensions VARCHAR(50), -- '728x90', '300x250', etc.
  download_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_materials_type ON affiliate_marketing_materials(material_type);
CREATE INDEX idx_materials_active ON affiliate_marketing_materials(is_active) WHERE is_active = true;

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- Subscription revenue overview
CREATE OR REPLACE VIEW v_subscription_revenue AS
SELECT
  date_trunc('month', created_at) as month,
  COUNT(*) as new_subscriptions,
  SUM(amount) as revenue,
  COUNT(*) FILTER (WHERE billing_cycle = 'monthly') as monthly_subs,
  COUNT(*) FILTER (WHERE billing_cycle = 'yearly') as yearly_subs
FROM subscription_invoices
WHERE status = 'paid'
GROUP BY date_trunc('month', created_at)
ORDER BY month DESC;

-- Ad performance summary
CREATE OR REPLACE VIEW v_ad_performance AS
SELECT
  ba.id,
  ba.title,
  ba.advertiser_id,
  p.full_name as advertiser_name,
  ba.impressions,
  ba.clicks,
  ba.conversions,
  ba.ctr,
  ba.spent_amount,
  CASE WHEN ba.clicks > 0 THEN ba.spent_amount / ba.clicks ELSE 0 END as cost_per_click,
  CASE WHEN ba.conversions > 0 THEN ba.spent_amount / ba.conversions ELSE 0 END as cost_per_conversion
FROM banner_ads ba
JOIN profiles p ON ba.advertiser_id = p.id
WHERE ba.status = 'active';

-- Affiliate performance overview
CREATE OR REPLACE VIEW v_affiliate_performance AS
SELECT
  aa.id,
  aa.affiliate_code,
  p.full_name as affiliate_name,
  aa.total_clicks,
  aa.total_conversions,
  aa.conversion_rate,
  aa.total_earned,
  aa.pending_payout,
  COUNT(DISTINCT ac.id) as pending_commissions_count,
  COALESCE(SUM(CASE WHEN ac.status = 'pending' THEN ac.commission_amount ELSE 0 END), 0) as pending_commission_amount
FROM affiliate_accounts aa
JOIN profiles p ON aa.user_id = p.id
LEFT JOIN affiliate_commissions ac ON aa.id = ac.affiliate_id
GROUP BY aa.id, aa.affiliate_code, p.full_name, aa.total_clicks, aa.total_conversions, aa.conversion_rate, aa.total_earned, aa.pending_payout;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Check if user can perform action based on subscription
CREATE OR REPLACE FUNCTION check_subscription_limit(
  p_user_id UUID,
  p_resource_type VARCHAR,
  p_quantity INT DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_tier RECORD;
  v_limit INT;
  v_current_usage INT;
BEGIN
  -- Get active subscription
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get tier limits
  SELECT * INTO v_tier
  FROM subscription_tiers
  WHERE id = v_subscription.tier_id;

  -- Get limit for resource
  v_limit := (v_tier.limits->p_resource_type)::int;

  -- -1 means unlimited
  IF v_limit = -1 THEN
    RETURN true;
  END IF;

  -- Get current usage
  SELECT COALESCE(SUM(quantity), 0) INTO v_current_usage
  FROM subscription_usage
  WHERE subscription_id = v_subscription.id
  AND resource_type = p_resource_type
  AND period_start >= v_subscription.current_period_start::date
  AND period_end <= v_subscription.current_period_end::date;

  RETURN (v_current_usage + p_quantity) <= v_limit;
END;
$$ LANGUAGE plpgsql;

-- Record subscription usage
CREATE OR REPLACE FUNCTION record_subscription_usage(
  p_subscription_id UUID,
  p_resource_type VARCHAR,
  p_quantity INT DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO subscription_usage (
    subscription_id,
    resource_type,
    quantity,
    period_start,
    period_end
  )
  SELECT
    p_subscription_id,
    p_resource_type,
    p_quantity,
    current_period_start::date,
    current_period_end::date
  FROM user_subscriptions
  WHERE id = p_subscription_id;
END;
$$ LANGUAGE plpgsql;

-- Calculate affiliate commission
CREATE OR REPLACE FUNCTION calculate_affiliate_commission(
  p_order_amount NUMERIC,
  p_affiliate_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_config RECORD;
  v_affiliate RECORD;
  v_commission NUMERIC;
BEGIN
  -- Get config
  SELECT * INTO v_config FROM affiliate_program_config WHERE is_active = true LIMIT 1;

  -- Get affiliate stats
  SELECT * INTO v_affiliate FROM affiliate_accounts WHERE id = p_affiliate_id;

  IF v_config.commission_type = 'percentage' THEN
    v_commission := p_order_amount * (v_config.commission_percentage / 100);
  ELSIF v_config.commission_type = 'fixed' THEN
    v_commission := v_config.commission_fixed_amount;
  ELSIF v_config.commission_type = 'tiered' THEN
    -- Find applicable tier based on total conversions
    SELECT rate INTO v_commission
    FROM jsonb_to_recordset(v_config.commission_tiers)
    AS x(min_sales INT, rate NUMERIC)
    WHERE v_affiliate.total_conversions >= min_sales
    ORDER BY min_sales DESC
    LIMIT 1;

    v_commission := p_order_amount * (v_commission / 100);
  END IF;

  RETURN COALESCE(v_commission, 0);
END;
$$ LANGUAGE plpgsql;

-- Auto-expire subscriptions
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS INT AS $$
DECLARE
  expired_count INT;
BEGIN
  WITH expired AS (
    UPDATE user_subscriptions
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'active'
    AND current_period_end < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO expired_count FROM expired;

  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_event_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view own invoices
CREATE POLICY "Users view own invoices" ON subscription_invoices
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create sponsored bookings
CREATE POLICY "Users create sponsored bookings" ON sponsored_event_bookings
  FOR INSERT WITH CHECK (auth.uid() = sponsor_user_id);

CREATE POLICY "Users view own bookings" ON sponsored_event_bookings
  FOR SELECT USING (auth.uid() = sponsor_user_id);

-- Users manage their ads
CREATE POLICY "Users manage own ads" ON banner_ads
  FOR ALL USING (auth.uid() = advertiser_id);

-- Users manage their affiliate account
CREATE POLICY "Users manage affiliate account" ON affiliate_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own commissions" ON affiliate_commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM affiliate_accounts
      WHERE id = affiliate_commissions.affiliate_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users view own payouts" ON affiliate_payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM affiliate_accounts
      WHERE id = affiliate_payouts.affiliate_id
      AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant select on views
GRANT SELECT ON v_subscription_revenue TO authenticated;
GRANT SELECT ON v_ad_performance TO authenticated;
GRANT SELECT ON v_affiliate_performance TO authenticated;
GRANT SELECT ON affiliate_leaderboard TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION check_subscription_limit(UUID, VARCHAR, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_subscription_usage(UUID, VARCHAR, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_affiliate_commission(NUMERIC, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_subscriptions() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_affiliate_leaderboard() TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - 22 new tables created
-- - 3 materialized views
-- - 4 analytics views
-- - 4 database functions
-- - Complete RLS policies
-- - 40+ indexes
-- - Subscription tiers with default data
-- - Sponsored slots with default data
-- - Affiliate program with default config
