-- =====================================================
-- PHASE 2 DATABASE SCHEMA - INTEGRATED WITH EXISTING FSTIVO
-- =====================================================
-- Extends existing: profiles, events, registrations, notifications
-- Migration Date: January 5, 2026
-- =====================================================

-- ============================================================================
-- SECTION 1: SOCIAL FEATURES (Extends existing connections/posts)
-- ============================================================================

-- Enhance existing connections table with connection types
DO $$
BEGIN
  -- Add connection_type if not exists
  ALTER TABLE connections
    ADD COLUMN IF NOT EXISTS connection_type VARCHAR(20) DEFAULT 'friend'
    CHECK (connection_type IN ('friend', 'follower', 'blocked'));

  -- Add status if not exists
  ALTER TABLE connections
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'accepted'
    CHECK (status IN ('pending', 'accepted', 'rejected'));
EXCEPTION
  WHEN others THEN
    -- Columns might already exist, which is fine
    NULL;
END $$;

-- Event-specific posts (extends existing posts table)
CREATE TABLE IF NOT EXISTS event_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'photo', 'video', 'poll', 'announcement')),
  media_urls TEXT[],
  poll_options JSONB,
  is_pinned BOOLEAN DEFAULT false,
  is_announcement BOOLEAN DEFAULT false,
  visibility VARCHAR(20) NOT NULL DEFAULT 'attendees' CHECK (visibility IN ('public', 'attendees', 'organizers')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_posts_event ON event_posts(event_id);
CREATE INDEX IF NOT EXISTS idx_event_posts_user ON event_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_event_posts_created ON event_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_posts_pinned ON event_posts(is_pinned) WHERE is_pinned = true;

-- Post reactions
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES event_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'celebrate', 'insightful', 'funny')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON post_reactions(user_id);

-- Post comments
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES event_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id);

-- Event photo gallery
CREATE TABLE IF NOT EXISTS event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  tagged_users UUID[],
  album_name VARCHAR(100),
  is_featured BOOLEAN DEFAULT false,
  moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_photos_event ON event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_uploader ON event_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_event_photos_album ON event_photos(album_name);

-- Referral system
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'purchased', 'rewarded')),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  reward_type VARCHAR(50),
  reward_value NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- Social share tracking
CREATE TABLE IF NOT EXISTS social_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  share_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_shares_event ON social_shares(event_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_platform ON social_shares(platform);

-- ============================================================================
-- SECTION 2: ADVANCED TICKETING (Extends existing ticket_types, registrations)
-- ============================================================================

-- Dynamic pricing rules (works with existing ticket_types)
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  rule_type VARCHAR(30) NOT NULL CHECK (rule_type IN ('early_bird', 'time_based', 'demand_based', 'inventory_based', 'group_discount')),
  base_price NUMERIC(10, 2) NOT NULL,
  discount_percentage NUMERIC(5, 2),
  discount_amount NUMERIC(10, 2),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  min_quantity INT,
  max_quantity INT,
  inventory_threshold INT,
  demand_multiplier NUMERIC(5, 2),
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_event ON pricing_rules(event_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_ticket ON pricing_rules(ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active) WHERE is_active = true;

-- Waitlist management
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  quantity INT NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'converted', 'expired', 'cancelled')),
  position INT,
  notification_sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_event ON waitlist(event_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_user ON waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);

-- Ticket bundles
CREATE TABLE IF NOT EXISTS ticket_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  bundle_price NUMERIC(10, 2) NOT NULL,
  individual_price NUMERIC(10, 2) NOT NULL,
  savings_amount NUMERIC(10, 2) GENERATED ALWAYS AS (individual_price - bundle_price) STORED,
  max_quantity INT DEFAULT 100,
  sold_quantity INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_bundles_event ON ticket_bundles(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_bundles_active ON ticket_bundles(is_active) WHERE is_active = true;

-- Bundle items
CREATE TABLE IF NOT EXISTS bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES ticket_bundles(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_ticket ON bundle_items(ticket_type_id);

-- Group bookings
CREATE TABLE IF NOT EXISTS group_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_name VARCHAR(200) NOT NULL,
  total_quantity INT NOT NULL,
  filled_quantity INT DEFAULT 0,
  price_per_ticket NUMERIC(10, 2) NOT NULL,
  group_discount_percentage NUMERIC(5, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'confirmed', 'cancelled')),
  payment_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_bookings_event ON group_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_group_bookings_organizer ON group_bookings(organizer_user_id);

-- Group booking members
CREATE TABLE IF NOT EXISTS group_booking_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_booking_id UUID NOT NULL REFERENCES group_bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_members_booking ON group_booking_members(group_booking_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_booking_members(user_id);

-- Ticket resale marketplace
CREATE TABLE IF NOT EXISTS ticket_resales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  seller_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  original_price NUMERIC(10, 2) NOT NULL,
  asking_price NUMERIC(10, 2) NOT NULL,
  platform_fee NUMERIC(10, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'listed' CHECK (status IN ('listed', 'sold', 'cancelled', 'expired')),
  listed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sold_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ticket_resales_registration ON ticket_resales(registration_id);
CREATE INDEX IF NOT EXISTS idx_ticket_resales_seller ON ticket_resales(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_resales_status ON ticket_resales(status);

-- ============================================================================
-- SECTION 3: CHECK-IN IMPROVEMENTS (Extends existing check-in system)
-- ============================================================================

-- Check-in stations
CREATE TABLE IF NOT EXISTS checkin_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  station_name VARCHAR(100) NOT NULL,
  station_type VARCHAR(30) NOT NULL CHECK (station_type IN ('manual', 'self_service', 'kiosk', 'mobile')),
  location_description TEXT,
  is_active BOOLEAN DEFAULT true,
  assigned_staff UUID REFERENCES profiles(id) ON DELETE SET NULL,
  config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkin_stations_event ON checkin_stations(event_id);
CREATE INDEX IF NOT EXISTS idx_checkin_stations_active ON checkin_stations(is_active) WHERE is_active = true;

-- Enhanced check-in records
CREATE TABLE IF NOT EXISTS checkin_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  attendee_id UUID REFERENCES registration_attendees(id) ON DELETE SET NULL,
  station_id UUID REFERENCES checkin_stations(id) ON DELETE SET NULL,
  checked_in_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  checkin_method VARCHAR(30) NOT NULL CHECK (checkin_method IN ('qr_scan', 'manual_entry', 'nfc', 'biometric')),
  checkin_status VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (checkin_status IN ('success', 'duplicate', 'invalid', 'expired')),
  device_info JSONB,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_checkin_records_registration ON checkin_records(registration_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_station ON checkin_records(station_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_time ON checkin_records(checked_in_at DESC);

-- Badge printing queue
CREATE TABLE IF NOT EXISTS badge_print_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  attendee_id UUID REFERENCES registration_attendees(id) ON DELETE SET NULL,
  station_id UUID NOT NULL REFERENCES checkin_stations(id) ON DELETE CASCADE,
  badge_template_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'printing', 'printed', 'failed')),
  print_data JSONB NOT NULL,
  attempts INT DEFAULT 0,
  printed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badge_queue_station ON badge_print_queue(station_id);
CREATE INDEX IF NOT EXISTS idx_badge_queue_status ON badge_print_queue(status);

-- Walk-in registrations
CREATE TABLE IF NOT EXISTS walkin_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES checkin_stations(id) ON DELETE CASCADE,
  registered_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attendee_name VARCHAR(200) NOT NULL,
  attendee_email VARCHAR(255),
  attendee_phone VARCHAR(20),
  payment_method VARCHAR(30) NOT NULL,
  amount_paid NUMERIC(10, 2) NOT NULL,
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_walkin_registrations_event ON walkin_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_walkin_registrations_station ON walkin_registrations(station_id);

-- ============================================================================
-- SECTION 4: PWA & USER PREFERENCES
-- ============================================================================

-- PWA push subscriptions
CREATE TABLE IF NOT EXISTS pwa_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  device_type VARCHAR(50),
  browser VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pwa_subscriptions_user ON pwa_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_pwa_subscriptions_active ON pwa_push_subscriptions(is_active) WHERE is_active = true;

-- User preferences (extends profiles)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  theme VARCHAR(20) NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  color_scheme VARCHAR(50) DEFAULT 'default',
  font_size VARCHAR(20) DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'extra_large')),
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(100) DEFAULT 'Asia/Karachi',
  email_frequency VARCHAR(30) DEFAULT 'all' CHECK (email_frequency IN ('all', 'important', 'digest', 'none')),
  show_tutorial BOOLEAN DEFAULT true,
  enable_animations BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- Social engagement metrics
CREATE OR REPLACE VIEW v_social_engagement AS
SELECT
  ep.event_id,
  e.title as event_name,
  COUNT(DISTINCT ep.id) as total_posts,
  COUNT(DISTINCT pr.id) as total_reactions,
  COUNT(DISTINCT pc.id) as total_comments,
  COUNT(DISTINCT ss.id) as total_shares,
  COUNT(DISTINCT ep.user_id) as active_users
FROM event_posts ep
JOIN events e ON ep.event_id = e.id
LEFT JOIN post_reactions pr ON ep.id = pr.post_id
LEFT JOIN post_comments pc ON ep.id = pc.post_id
LEFT JOIN social_shares ss ON ep.event_id = ss.event_id
GROUP BY ep.event_id, e.title;

-- Waitlist conversion analytics
CREATE OR REPLACE VIEW v_waitlist_conversion AS
SELECT
  w.event_id,
  e.title as event_name,
  tt.name as ticket_type,
  COUNT(*) as total_waitlisted,
  COUNT(*) FILTER (WHERE w.status = 'converted') as converted,
  ROUND(100.0 * COUNT(*) FILTER (WHERE w.status = 'converted') / NULLIF(COUNT(*), 0), 2) as conversion_rate
FROM waitlist w
JOIN events e ON w.event_id = e.id
LEFT JOIN ticket_types tt ON w.ticket_type_id = tt.id
GROUP BY w.event_id, e.title, tt.name;

-- Check-in performance
CREATE OR REPLACE VIEW v_checkin_performance AS
SELECT
  cs.event_id,
  e.title as event_name,
  cs.station_name,
  cs.station_type,
  COUNT(cr.id) as total_checkins,
  COUNT(DISTINCT cr.registration_id) as unique_registrations,
  COUNT(*) FILTER (WHERE cr.checkin_status = 'success') as successful,
  COUNT(*) FILTER (WHERE cr.checkin_status = 'duplicate') as duplicates,
  COUNT(*) FILTER (WHERE cr.checkin_status = 'invalid') as invalid
FROM checkin_stations cs
JOIN events e ON cs.event_id = e.id
LEFT JOIN checkin_records cr ON cs.id = cr.station_id
WHERE cs.is_active = true
GROUP BY cs.event_id, e.title, cs.station_name, cs.station_type;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Calculate dynamic price based on rules
CREATE OR REPLACE FUNCTION calculate_dynamic_price(
  p_ticket_type_id UUID,
  p_quantity INT DEFAULT 1
)
RETURNS NUMERIC AS $$
DECLARE
  v_base_price NUMERIC;
  v_final_price NUMERIC;
  v_rule RECORD;
BEGIN
  -- Get base price from ticket_types
  SELECT price INTO v_base_price
  FROM ticket_types
  WHERE id = p_ticket_type_id;

  IF v_base_price IS NULL THEN
    RETURN 0;
  END IF;

  v_final_price := v_base_price;

  -- Apply pricing rules in priority order
  FOR v_rule IN
    SELECT *
    FROM pricing_rules
    WHERE ticket_type_id = p_ticket_type_id
      AND is_active = true
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (ends_at IS NULL OR ends_at >= NOW())
    ORDER BY priority DESC
    LIMIT 1
  LOOP
    CASE v_rule.rule_type
      WHEN 'early_bird' THEN
        IF v_rule.discount_percentage IS NOT NULL THEN
          v_final_price := v_final_price * (1 - v_rule.discount_percentage / 100);
        ELSIF v_rule.discount_amount IS NOT NULL THEN
          v_final_price := v_final_price - v_rule.discount_amount;
        END IF;

      WHEN 'group_discount' THEN
        IF p_quantity >= COALESCE(v_rule.min_quantity, 1) THEN
          IF v_rule.discount_percentage IS NOT NULL THEN
            v_final_price := v_final_price * (1 - v_rule.discount_percentage / 100);
          END IF;
        END IF;
    END CASE;
  END LOOP;

  RETURN GREATEST(v_final_price, 0);
END;
$$ LANGUAGE plpgsql;

-- Update waitlist positions
CREATE OR REPLACE FUNCTION update_waitlist_positions()
RETURNS TRIGGER AS $
BEGIN
  IF NEW.status IN ('converted', 'cancelled', 'expired') AND OLD.status = 'waiting' THEN
    UPDATE waitlist
    SET position = position - 1
    WHERE event_id = NEW.event_id
      AND ticket_type_id = NEW.ticket_type_id
      AND position > OLD.position
      AND status = 'waiting';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_waitlist_positions
AFTER UPDATE ON waitlist
FOR EACH ROW
EXECUTE FUNCTION update_waitlist_positions();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE event_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_booking_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_resales ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_print_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE walkin_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE pwa_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Event posts policies
CREATE POLICY "Public posts are viewable by everyone" ON event_posts
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Attendees can view attendee posts" ON event_posts
  FOR SELECT USING (
    visibility = 'attendees' AND
    EXISTS (
      SELECT 1 FROM registrations
      WHERE user_id = auth.uid() AND event_id = event_posts.event_id
    )
  );

CREATE POLICY "Users can create posts" ON event_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their posts" ON event_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Waitlist policies
CREATE POLICY "Users can view own waitlist" ON waitlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join waitlist" ON waitlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Check-in records policies
CREATE POLICY "Staff can view checkin records" ON checkin_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM checkin_stations cs
      WHERE cs.id = checkin_records.station_id
      AND cs.assigned_staff = auth.uid()
    )
  );

CREATE POLICY "Staff can create checkin records" ON checkin_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM checkin_stations cs
      WHERE cs.id = checkin_records.station_id
      AND cs.assigned_staff = auth.uid()
    )
  );

-- PWA subscriptions policies
CREATE POLICY "Users can manage their subscriptions" ON pwa_push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Event photos policies
CREATE POLICY "Everyone can view approved photos" ON event_photos
  FOR SELECT USING (moderation_status = 'approved');

CREATE POLICY "Users can upload photos" ON event_photos
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their photos" ON event_photos
  FOR UPDATE USING (auth.uid() = uploaded_by);

-- Reactions policies
CREATE POLICY "Everyone can view reactions" ON post_reactions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can react" ON post_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their reactions" ON post_reactions
  FOR UPDATE WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their reactions" ON post_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Everyone can view comments" ON post_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their comments" ON post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);
