-- =====================================================
-- Migration: 20250103_sponsored_ads.sql
-- Description: Sponsored events and advertising system
-- Tables: 14 tables
-- =====================================================

-- 1. Sponsored Event Slots
CREATE TABLE sponsored_event_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sponsor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  placement VARCHAR(50) NOT NULL CHECK (placement IN ('homepage_hero', 'search_top', 'category_featured', 'sidebar_premium')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'active', 'paused', 'completed', 'rejected')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  daily_budget DECIMAL(10,2),
  total_budget DECIMAL(10,2) NOT NULL,
  spent_amount DECIMAL(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  targeting JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ
);

-- 2. Sponsor Profiles
CREATE TABLE sponsor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  website_url TEXT,
  logo_url TEXT,
  description TEXT,
  target_audience JSONB DEFAULT '[]',
  budget_range VARCHAR(50),
  preferred_categories JSONB DEFAULT '[]',
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sponsor Matchmaking Results
CREATE TABLE sponsor_matchmaking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES sponsor_profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  match_score DECIMAL(5,2) NOT NULL,
  match_reasons JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'suggested' CHECK (status IN ('suggested', 'contacted', 'interested', 'declined', 'sponsored')),
  contacted_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sponsor_id, event_id)
);

-- 4. Ad Campaigns
CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'pending_review', 'active', 'paused', 'completed', 'rejected')),
  campaign_type VARCHAR(50) NOT NULL CHECK (campaign_type IN ('banner', 'sponsored_event', 'newsletter', 'social')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  daily_budget DECIMAL(10,2),
  total_budget DECIMAL(10,2) NOT NULL,
  spent_amount DECIMAL(10,2) DEFAULT 0,
  targeting JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT
);

-- 5. Ad Creatives
CREATE TABLE ad_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'video', 'html', 'text')),
  content JSONB NOT NULL,
  image_url TEXT,
  video_url TEXT,
  destination_url TEXT NOT NULL,
  cta_text VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Ad Placements
CREATE TABLE ad_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  location VARCHAR(100) NOT NULL,
  dimensions VARCHAR(50),
  pricing_model VARCHAR(20) NOT NULL CHECK (pricing_model IN ('cpm', 'cpc', 'cpa', 'flat')),
  base_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  daily_impressions_limit INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Ad Serving (for active ads)
CREATE TABLE ad_serving (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  creative_id UUID NOT NULL REFERENCES ad_creatives(id) ON DELETE CASCADE,
  placement_id UUID NOT NULL REFERENCES ad_placements(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  priority INTEGER DEFAULT 0,
  weight INTEGER DEFAULT 100,
  impressions_served INTEGER DEFAULT 0,
  impressions_limit INTEGER,
  clicks_received INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, placement_id)
);

-- 8. Ad Impressions Log
CREATE TABLE ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_serving_id UUID NOT NULL REFERENCES ad_serving(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  creative_id UUID NOT NULL REFERENCES ad_creatives(id) ON DELETE CASCADE,
  placement_id UUID NOT NULL REFERENCES ad_placements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  page_url TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  country VARCHAR(2),
  city VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Ad Clicks Log
CREATE TABLE ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_serving_id UUID NOT NULL REFERENCES ad_serving(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  creative_id UUID NOT NULL REFERENCES ad_creatives(id) ON DELETE CASCADE,
  placement_id UUID NOT NULL REFERENCES ad_placements(id) ON DELETE CASCADE,
  impression_id UUID REFERENCES ad_impressions(id),
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  destination_url TEXT NOT NULL,
  device_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Ad Conversions Log
CREATE TABLE ad_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_serving_id UUID NOT NULL REFERENCES ad_serving(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  click_id UUID REFERENCES ad_clicks(id),
  user_id UUID REFERENCES auth.users(id),
  conversion_type VARCHAR(50) NOT NULL,
  conversion_value DECIMAL(10,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Sponsor Contracts
CREATE TABLE sponsor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES sponsor_profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN ('title_sponsor', 'platinum', 'gold', 'silver', 'bronze', 'media_partner')),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PKR',
  benefits JSONB DEFAULT '[]',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'pending', 'active', 'completed', 'canceled')),
  contract_url TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Ad Campaign Performance (materialized view data)
CREATE TABLE ad_campaign_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  ctr DECIMAL(5,4) DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  cpm DECIMAL(10,2) DEFAULT 0,
  cpa DECIMAL(10,2) DEFAULT 0,
  roas DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, date)
);

-- 13. Sponsored Event Performance
CREATE TABLE sponsored_event_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsored_slot_id UUID NOT NULL REFERENCES sponsored_event_slots(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  registrations INTEGER DEFAULT 0,
  tickets_sold INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sponsored_slot_id, date)
);

-- 14. Budget Transactions
CREATE TABLE ad_budget_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  sponsored_slot_id UUID REFERENCES sponsored_event_slots(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('deposit', 'spend', 'refund', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sponsored_event_slots_event_id ON sponsored_event_slots(event_id);
CREATE INDEX idx_sponsored_event_slots_sponsor_user_id ON sponsored_event_slots(sponsor_user_id);
CREATE INDEX idx_sponsored_event_slots_status ON sponsored_event_slots(status);
CREATE INDEX idx_sponsored_event_slots_placement ON sponsored_event_slots(placement);
CREATE INDEX idx_sponsored_event_slots_dates ON sponsored_event_slots(start_date, end_date);

CREATE INDEX idx_sponsor_profiles_user_id ON sponsor_profiles(user_id);
CREATE INDEX idx_sponsor_profiles_industry ON sponsor_profiles(industry);

CREATE INDEX idx_sponsor_matchmaking_sponsor_id ON sponsor_matchmaking(sponsor_id);
CREATE INDEX idx_sponsor_matchmaking_event_id ON sponsor_matchmaking(event_id);
CREATE INDEX idx_sponsor_matchmaking_match_score ON sponsor_matchmaking(match_score DESC);

CREATE INDEX idx_ad_campaigns_advertiser_user_id ON ad_campaigns(advertiser_user_id);
CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);

CREATE INDEX idx_ad_creatives_campaign_id ON ad_creatives(campaign_id);
CREATE INDEX idx_ad_serving_campaign_id ON ad_serving(campaign_id);
CREATE INDEX idx_ad_serving_placement_id ON ad_serving(placement_id);

CREATE INDEX idx_ad_impressions_ad_serving_id ON ad_impressions(ad_serving_id);
CREATE INDEX idx_ad_impressions_campaign_id ON ad_impressions(campaign_id);
CREATE INDEX idx_ad_impressions_created_at ON ad_impressions(created_at);

CREATE INDEX idx_ad_clicks_ad_serving_id ON ad_clicks(ad_serving_id);
CREATE INDEX idx_ad_clicks_campaign_id ON ad_clicks(campaign_id);
CREATE INDEX idx_ad_clicks_created_at ON ad_clicks(created_at);

CREATE INDEX idx_ad_conversions_campaign_id ON ad_conversions(campaign_id);
CREATE INDEX idx_ad_conversions_created_at ON ad_conversions(created_at);

CREATE INDEX idx_sponsor_contracts_sponsor_id ON sponsor_contracts(sponsor_id);
CREATE INDEX idx_sponsor_contracts_event_id ON sponsor_contracts(event_id);

CREATE INDEX idx_ad_campaign_stats_campaign_id_date ON ad_campaign_stats(campaign_id, date);
CREATE INDEX idx_sponsored_event_stats_slot_id_date ON sponsored_event_stats(sponsored_slot_id, date);

-- RLS Policies
ALTER TABLE sponsored_event_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_matchmaking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_serving ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaign_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_event_stats ENABLE ROW LEVEL SECURITY;

-- Sponsors can manage their own slots
CREATE POLICY "Sponsors can manage own slots" ON sponsored_event_slots
  FOR ALL USING (auth.uid() = sponsor_user_id);

-- Event organizers can view slots for their events
CREATE POLICY "Organizers can view event slots" ON sponsored_event_slots
  FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid())
  );

-- Users can manage their sponsor profile
CREATE POLICY "Users can manage own sponsor profile" ON sponsor_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Public can view active placements
CREATE POLICY "Anyone can view active placements" ON ad_placements
  FOR SELECT USING (is_active = true);

-- Advertisers can manage their campaigns
CREATE POLICY "Advertisers can manage own campaigns" ON ad_campaigns
  FOR ALL USING (auth.uid() = advertiser_user_id);

-- Insert default ad placements
INSERT INTO ad_placements (name, slug, description, location, dimensions, pricing_model, base_price) VALUES
('Homepage Hero Banner', 'homepage_hero', 'Large banner at the top of homepage', 'homepage', '1200x400', 'cpm', 500),
('Search Results Top', 'search_top', 'Featured position in search results', 'search', '800x200', 'cpc', 5),
('Category Page Featured', 'category_featured', 'Featured event in category pages', 'category', '600x300', 'cpm', 300),
('Sidebar Premium', 'sidebar_premium', 'Premium sidebar placement', 'sidebar', '300x600', 'cpm', 200),
('Event Details Sponsor', 'event_sponsor', 'Sponsor section on event details', 'event_details', '1000x150', 'flat', 1000);

-- Function to check budget and auto-pause
CREATE OR REPLACE FUNCTION check_and_update_campaign_budget()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if budget exceeded
  IF NEW.spent_amount >= NEW.total_budget THEN
    NEW.status = 'completed';
  ELSIF NEW.daily_budget IS NOT NULL THEN
    -- Check daily budget
    DECLARE
      v_daily_spend DECIMAL(10,2);
    BEGIN
      SELECT COALESCE(SUM(spend), 0) INTO v_daily_spend
      FROM ad_campaign_stats
      WHERE campaign_id = NEW.id
        AND date = CURRENT_DATE;

      IF v_daily_spend >= NEW.daily_budget THEN
        NEW.status = 'paused';
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_campaign_budget
  BEFORE UPDATE ON ad_campaigns
  FOR EACH ROW
  WHEN (NEW.spent_amount <> OLD.spent_amount)
  EXECUTE FUNCTION check_and_update_campaign_budget();

-- Function to track ad impression
CREATE OR REPLACE FUNCTION track_ad_impression(
  p_ad_serving_id UUID,
  p_user_id UUID,
  p_session_id VARCHAR,
  p_ip_address INET,
  p_user_agent TEXT,
  p_page_url TEXT,
  p_referrer TEXT
)
RETURNS UUID AS $$
DECLARE
  v_impression_id UUID;
  v_campaign_id UUID;
  v_creative_id UUID;
  v_placement_id UUID;
BEGIN
  -- Get campaign details
  SELECT campaign_id, creative_id, placement_id
  INTO v_campaign_id, v_creative_id, v_placement_id
  FROM ad_serving
  WHERE id = p_ad_serving_id;

  -- Insert impression
  INSERT INTO ad_impressions (
    ad_serving_id,
    campaign_id,
    creative_id,
    placement_id,
    user_id,
    session_id,
    ip_address,
    user_agent,
    page_url,
    referrer
  ) VALUES (
    p_ad_serving_id,
    v_campaign_id,
    v_creative_id,
    v_placement_id,
    p_user_id,
    p_session_id,
    p_ip_address,
    p_user_agent,
    p_page_url,
    p_referrer
  ) RETURNING id INTO v_impression_id;

  -- Update counters
  UPDATE ad_serving
  SET impressions_served = impressions_served + 1
  WHERE id = p_ad_serving_id;

  RETURN v_impression_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track ad click
CREATE OR REPLACE FUNCTION track_ad_click(
  p_ad_serving_id UUID,
  p_impression_id UUID,
  p_user_id UUID,
  p_session_id VARCHAR,
  p_destination_url TEXT
)
RETURNS UUID AS $$
DECLARE
  v_click_id UUID;
  v_campaign_id UUID;
  v_creative_id UUID;
  v_placement_id UUID;
BEGIN
  -- Get campaign details
  SELECT campaign_id, creative_id, placement_id
  INTO v_campaign_id, v_creative_id, v_placement_id
  FROM ad_serving
  WHERE id = p_ad_serving_id;

  -- Insert click
  INSERT INTO ad_clicks (
    ad_serving_id,
    campaign_id,
    creative_id,
    placement_id,
    impression_id,
    user_id,
    session_id,
    destination_url
  ) VALUES (
    p_ad_serving_id,
    v_campaign_id,
    v_creative_id,
    v_placement_id,
    p_impression_id,
    p_user_id,
    p_session_id,
    p_destination_url
  ) RETURNING id INTO v_click_id;

  -- Update counters
  UPDATE ad_serving
  SET clicks_received = clicks_received + 1
  WHERE id = p_ad_serving_id;

  RETURN v_click_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
