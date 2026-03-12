-- =====================================================
-- Migration: 20250103_affiliate_system.sql
-- Description: Affiliate program with tracking and payouts
-- Tables: 8 tables
-- =====================================================

-- 1. Affiliate Profiles
CREATE TABLE affiliate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  affiliate_code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
  tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  total_paid DECIMAL(10,2) DEFAULT 0,
  pending_balance DECIMAL(10,2) DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  successful_conversions INTEGER DEFAULT 0,
  payment_method VARCHAR(50),
  payment_details JSONB DEFAULT '{}',
  bank_account_name VARCHAR(255),
  bank_account_number VARCHAR(100),
  bank_name VARCHAR(255),
  tax_id VARCHAR(100),
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspended_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Affiliate Links
CREATE TABLE affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  link_code VARCHAR(100) UNIQUE NOT NULL,
  destination_url TEXT NOT NULL,
  destination_type VARCHAR(50) CHECK (destination_type IN ('homepage', 'event', 'category', 'custom')),
  destination_id UUID,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_clicked_at TIMESTAMPTZ
);

-- 3. Affiliate Clicks
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  link_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  landing_page TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  country VARCHAR(2),
  city VARCHAR(100),
  converted BOOLEAN DEFAULT false,
  conversion_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Affiliate Conversions
CREATE TABLE affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  link_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
  click_id UUID REFERENCES affiliate_clicks(id),
  user_id UUID REFERENCES auth.users(id),
  conversion_type VARCHAR(50) NOT NULL CHECK (conversion_type IN ('ticket_purchase', 'event_creation', 'subscription', 'other')),
  order_id UUID,
  order_amount DECIMAL(10,2),
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'refunded')),
  metadata JSONB DEFAULT '{}',
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Affiliate Payouts
CREATE TABLE affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  payout_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PKR',
  payment_method VARCHAR(50) NOT NULL,
  payment_details JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'canceled')),
  conversion_ids UUID[] NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  transaction_id VARCHAR(255),
  notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  failed_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Affiliate Commission Tiers
CREATE TABLE affiliate_commission_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name VARCHAR(50) NOT NULL UNIQUE,
  min_conversions INTEGER NOT NULL,
  min_revenue DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  bonus_rate DECIMAL(5,2) DEFAULT 0,
  benefits JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Affiliate Marketing Materials
CREATE TABLE affiliate_marketing_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  material_type VARCHAR(50) NOT NULL CHECK (material_type IN ('banner', 'email_template', 'social_post', 'landing_page', 'video', 'pdf')),
  dimensions VARCHAR(50),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  download_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Affiliate Performance Stats
CREATE TABLE affiliate_performance_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  commission_earned DECIMAL(10,2) DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(affiliate_id, date)
);

-- Indexes for performance
CREATE INDEX idx_affiliate_profiles_user_id ON affiliate_profiles(user_id);
CREATE INDEX idx_affiliate_profiles_affiliate_code ON affiliate_profiles(affiliate_code);
CREATE INDEX idx_affiliate_profiles_status ON affiliate_profiles(status);
CREATE INDEX idx_affiliate_profiles_tier ON affiliate_profiles(tier);

CREATE INDEX idx_affiliate_links_affiliate_id ON affiliate_links(affiliate_id);
CREATE INDEX idx_affiliate_links_link_code ON affiliate_links(link_code);
CREATE INDEX idx_affiliate_links_destination_type ON affiliate_links(destination_type);

CREATE INDEX idx_affiliate_clicks_affiliate_id ON affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_clicks_link_id ON affiliate_clicks(link_id);
CREATE INDEX idx_affiliate_clicks_session_id ON affiliate_clicks(session_id);
CREATE INDEX idx_affiliate_clicks_created_at ON affiliate_clicks(created_at);

CREATE INDEX idx_affiliate_conversions_affiliate_id ON affiliate_conversions(affiliate_id);
CREATE INDEX idx_affiliate_conversions_link_id ON affiliate_conversions(link_id);
CREATE INDEX idx_affiliate_conversions_status ON affiliate_conversions(status);
CREATE INDEX idx_affiliate_conversions_created_at ON affiliate_conversions(created_at);

CREATE INDEX idx_affiliate_payouts_affiliate_id ON affiliate_payouts(affiliate_id);
CREATE INDEX idx_affiliate_payouts_status ON affiliate_payouts(status);
CREATE INDEX idx_affiliate_payouts_created_at ON affiliate_payouts(created_at);

CREATE INDEX idx_affiliate_performance_stats_affiliate_date ON affiliate_performance_stats(affiliate_id, date);

-- RLS Policies
ALTER TABLE affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_marketing_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_performance_stats ENABLE ROW LEVEL SECURITY;

-- Affiliates can manage their own profile
CREATE POLICY "Affiliates can manage own profile" ON affiliate_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Affiliates can manage own links" ON affiliate_links
  FOR ALL USING (
    affiliate_id IN (SELECT id FROM affiliate_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Affiliates can view own clicks" ON affiliate_clicks
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliate_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Affiliates can view own conversions" ON affiliate_conversions
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliate_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Affiliates can view own payouts" ON affiliate_payouts
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliate_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can view commission tiers" ON affiliate_commission_tiers
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view marketing materials" ON affiliate_marketing_materials
  FOR SELECT USING (is_active = true);

CREATE POLICY "Affiliates can view own stats" ON affiliate_performance_stats
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliate_profiles WHERE user_id = auth.uid())
  );

-- Insert default commission tiers
INSERT INTO affiliate_commission_tiers (tier_name, min_conversions, min_revenue, commission_rate, bonus_rate, benefits) VALUES
('Bronze', 0, 0, 10.00, 0, '["Basic affiliate dashboard", "Monthly payouts", "Marketing materials access"]'::jsonb),
('Silver', 10, 10000, 12.00, 0, '["Priority support", "Bi-weekly payouts", "Advanced analytics", "Dedicated account manager"]'::jsonb),
('Gold', 50, 50000, 15.00, 2.00, '["Premium support", "Weekly payouts", "Custom marketing materials", "Early access to features", "Performance bonus"]'::jsonb),
('Platinum', 100, 100000, 20.00, 5.00, '["VIP support", "Daily payouts", "Co-marketing opportunities", "Revenue share on referrals", "Exclusive events access"]'::jsonb);

-- Insert sample marketing materials
INSERT INTO affiliate_marketing_materials (title, description, material_type, dimensions, file_url, thumbnail_url) VALUES
('Homepage Banner 1200x400', 'Large banner for website headers', 'banner', '1200x400', '/materials/banner-1200x400.png', '/materials/banner-1200x400-thumb.png'),
('Social Media Square 1080x1080', 'Perfect for Instagram and Facebook', 'banner', '1080x1080', '/materials/social-square.png', '/materials/social-square-thumb.png'),
('Email Template - Welcome', 'Welcome email template for new users', 'email_template', NULL, '/materials/email-welcome.html', NULL),
('Event Promotion Guide', 'Complete guide for promoting events', 'pdf', NULL, '/materials/promotion-guide.pdf', '/materials/guide-thumb.png');

-- Function to generate unique affiliate code
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS VARCHAR AS $$
DECLARE
  v_code VARCHAR(50);
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 8-character code
    v_code := upper(substring(md5(random()::text) from 1 for 8));

    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM affiliate_profiles WHERE affiliate_code = v_code) INTO v_exists;

    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate affiliate link
CREATE OR REPLACE FUNCTION generate_affiliate_link(
  p_affiliate_id UUID,
  p_destination_url TEXT,
  p_destination_type VARCHAR,
  p_destination_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_link_id UUID;
  v_link_code VARCHAR(100);
  v_affiliate_code VARCHAR(50);
BEGIN
  -- Get affiliate code
  SELECT affiliate_code INTO v_affiliate_code
  FROM affiliate_profiles
  WHERE id = p_affiliate_id;

  -- Generate unique link code
  v_link_code := v_affiliate_code || '_' || substring(md5(random()::text) from 1 for 6);

  -- Insert link
  INSERT INTO affiliate_links (
    affiliate_id,
    link_code,
    destination_url,
    destination_type,
    destination_id,
    utm_source,
    utm_medium,
    utm_campaign
  ) VALUES (
    p_affiliate_id,
    v_link_code,
    p_destination_url,
    p_destination_type,
    p_destination_id,
    'affiliate',
    'referral',
    v_affiliate_code
  ) RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track affiliate click
CREATE OR REPLACE FUNCTION track_affiliate_click(
  p_link_code VARCHAR,
  p_session_id VARCHAR,
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_click_id UUID;
  v_affiliate_id UUID;
  v_link_id UUID;
BEGIN
  -- Get link and affiliate info
  SELECT id, affiliate_id INTO v_link_id, v_affiliate_id
  FROM affiliate_links
  WHERE link_code = p_link_code AND is_active = true;

  IF v_link_id IS NULL THEN
    RAISE EXCEPTION 'Invalid affiliate link code';
  END IF;

  -- Insert click
  INSERT INTO affiliate_clicks (
    affiliate_id,
    link_id,
    session_id,
    user_id,
    ip_address,
    user_agent,
    referrer
  ) VALUES (
    v_affiliate_id,
    v_link_id,
    p_session_id,
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_referrer
  ) RETURNING id INTO v_click_id;

  -- Update link clicks
  UPDATE affiliate_links
  SET
    clicks = clicks + 1,
    last_clicked_at = NOW()
  WHERE id = v_link_id;

  RETURN v_click_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record affiliate conversion
CREATE OR REPLACE FUNCTION record_affiliate_conversion(
  p_session_id VARCHAR,
  p_conversion_type VARCHAR,
  p_order_id UUID,
  p_order_amount DECIMAL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversion_id UUID;
  v_click_record RECORD;
  v_commission_rate DECIMAL(5,2);
  v_commission_amount DECIMAL(10,2);
BEGIN
  -- Find the most recent click for this session (within 30 days)
  SELECT * INTO v_click_record
  FROM affiliate_clicks
  WHERE session_id = p_session_id
    AND created_at > NOW() - INTERVAL '30 days'
    AND converted = false
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_click_record IS NULL THEN
    RETURN NULL; -- No attribution
  END IF;

  -- Get commission rate
  SELECT commission_rate INTO v_commission_rate
  FROM affiliate_profiles
  WHERE id = v_click_record.affiliate_id;

  -- Calculate commission
  v_commission_amount := (p_order_amount * v_commission_rate / 100);

  -- Insert conversion
  INSERT INTO affiliate_conversions (
    affiliate_id,
    link_id,
    click_id,
    user_id,
    conversion_type,
    order_id,
    order_amount,
    commission_amount,
    commission_rate,
    status
  ) VALUES (
    v_click_record.affiliate_id,
    v_click_record.link_id,
    v_click_record.id,
    COALESCE(p_user_id, v_click_record.user_id),
    p_conversion_type,
    p_order_id,
    p_order_amount,
    v_commission_amount,
    v_commission_rate,
    'pending'
  ) RETURNING id INTO v_conversion_id;

  -- Mark click as converted
  UPDATE affiliate_clicks
  SET converted = true, conversion_id = v_conversion_id
  WHERE id = v_click_record.id;

  -- Update link conversions
  UPDATE affiliate_links
  SET conversions = conversions + 1
  WHERE id = v_click_record.link_id;

  -- Update affiliate stats
  UPDATE affiliate_profiles
  SET
    total_referrals = total_referrals + 1,
    successful_conversions = successful_conversions + 1,
    pending_balance = pending_balance + v_commission_amount
  WHERE id = v_click_record.affiliate_id;

  RETURN v_conversion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve conversion and update earnings
CREATE OR REPLACE FUNCTION approve_affiliate_conversion(
  p_conversion_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_affiliate_id UUID;
  v_commission_amount DECIMAL(10,2);
BEGIN
  -- Get conversion details
  SELECT affiliate_id, commission_amount
  INTO v_affiliate_id, v_commission_amount
  FROM affiliate_conversions
  WHERE id = p_conversion_id AND status = 'pending';

  IF v_affiliate_id IS NULL THEN
    RAISE EXCEPTION 'Conversion not found or already processed';
  END IF;

  -- Update conversion status
  UPDATE affiliate_conversions
  SET status = 'approved', approved_at = NOW()
  WHERE id = p_conversion_id;

  -- Update affiliate earnings
  UPDATE affiliate_profiles
  SET total_earnings = total_earnings + v_commission_amount
  WHERE id = v_affiliate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process affiliate payout
CREATE OR REPLACE FUNCTION process_affiliate_payout(
  p_affiliate_id UUID,
  p_amount DECIMAL,
  p_conversion_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
  v_payout_id UUID;
  v_payout_number VARCHAR(50);
BEGIN
  -- Generate payout number
  v_payout_number := 'PO-' || to_char(NOW(), 'YYYYMMDD') || '-' || substring(md5(random()::text) from 1 for 6);

  -- Create payout
  INSERT INTO affiliate_payouts (
    affiliate_id,
    payout_number,
    amount,
    payment_method,
    conversion_ids,
    period_start,
    period_end,
    status
  )
  SELECT
    p_affiliate_id,
    v_payout_number,
    p_amount,
    payment_method,
    p_conversion_ids,
    (SELECT MIN(created_at) FROM affiliate_conversions WHERE id = ANY(p_conversion_ids)),
    (SELECT MAX(created_at) FROM affiliate_conversions WHERE id = ANY(p_conversion_ids)),
    'pending'
  FROM affiliate_profiles
  WHERE id = p_affiliate_id
  RETURNING id INTO v_payout_id;

  -- Update conversions to paid status
  UPDATE affiliate_conversions
  SET status = 'paid', paid_at = NOW()
  WHERE id = ANY(p_conversion_ids);

  -- Update affiliate balances
  UPDATE affiliate_profiles
  SET
    pending_balance = pending_balance - p_amount,
    total_paid = total_paid + p_amount
  WHERE id = p_affiliate_id;

  RETURN v_payout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-upgrade affiliate tier
CREATE OR REPLACE FUNCTION check_affiliate_tier_upgrade()
RETURNS TRIGGER AS $$
DECLARE
  v_tier_record RECORD;
BEGIN
  -- Find appropriate tier based on conversions and revenue
  SELECT tier_name INTO v_tier_record
  FROM affiliate_commission_tiers
  WHERE min_conversions <= NEW.successful_conversions
    AND min_revenue <= NEW.total_earnings
  ORDER BY commission_rate DESC
  LIMIT 1;

  IF v_tier_record IS NOT NULL AND NEW.tier <> v_tier_record.tier_name THEN
    NEW.tier = v_tier_record.tier_name;
    NEW.commission_rate = (
      SELECT commission_rate
      FROM affiliate_commission_tiers
      WHERE tier_name = v_tier_record.tier_name
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_upgrade_affiliate_tier
  BEFORE UPDATE ON affiliate_profiles
  FOR EACH ROW
  WHEN (NEW.successful_conversions <> OLD.successful_conversions OR NEW.total_earnings <> OLD.total_earnings)
  EXECUTE FUNCTION check_affiliate_tier_upgrade();
