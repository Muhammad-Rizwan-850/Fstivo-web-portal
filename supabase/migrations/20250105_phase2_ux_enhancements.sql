-- =====================================================
-- FSTIVO PHASE 2: USER EXPERIENCE ENHANCEMENTS
-- =====================================================
-- Features: Social, Advanced Ticketing, Check-in, PWA
-- Date: January 5, 2026
-- =====================================================

-- ============================================================================
-- SECTION 1: SOCIAL FEATURES
-- ============================================================================

-- User connections (friends/followers)
CREATE TABLE IF NOT EXISTS user_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    connected_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    connection_type VARCHAR(20) NOT NULL CHECK (connection_type IN ('friend', 'follower', 'blocked')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, connected_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_connections_user ON user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_connected ON user_connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_type ON user_connections(connection_type);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON user_connections(status);

-- Event social feed
CREATE TABLE IF NOT EXISTS event_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created ON post_comments(created_at DESC);

-- Event photo gallery
CREATE TABLE IF NOT EXISTS event_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_event_photos_featured ON event_photos(is_featured) WHERE is_featured = true;

-- Referral system
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Social share tracking
CREATE TABLE IF NOT EXISTS social_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    share_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_shares_event ON social_shares(event_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_platform ON social_shares(platform);
CREATE INDEX IF NOT EXISTS idx_social_shares_created ON social_shares(created_at DESC);

-- ============================================================================
-- SECTION 2: ADVANCED TICKETING
-- ============================================================================

-- Dynamic pricing rules
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
CREATE INDEX IF NOT EXISTS idx_pricing_rules_dates ON pricing_rules(starts_at, ends_at);

-- Waitlist management
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_waitlist_position ON waitlist(position);

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
    organizer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_group_bookings_status ON group_bookings(status);

-- Group booking members
CREATE TABLE IF NOT EXISTS group_booking_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_booking_id UUID NOT NULL REFERENCES group_bookings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_members_booking ON group_booking_members(group_booking_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_booking_members(user_id);

-- Season passes
CREATE TABLE IF NOT EXISTS season_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    max_quantity INT,
    sold_quantity INT DEFAULT 0,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    event_category VARCHAR(100),
    max_events_per_month INT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_season_passes_organizer ON season_passes(organizer_id);
CREATE INDEX IF NOT EXISTS idx_season_passes_active ON season_passes(is_active) WHERE is_active = true;

-- Season pass purchases
CREATE TABLE IF NOT EXISTS season_pass_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_pass_id UUID NOT NULL REFERENCES season_passes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pass_number VARCHAR(50) UNIQUE NOT NULL,
    purchase_price NUMERIC(10, 2) NOT NULL,
    events_attended INT DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'cancelled')),
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_season_purchases_pass ON season_pass_purchases(season_pass_id);
CREATE INDEX IF NOT EXISTS idx_season_purchases_user ON season_pass_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_season_purchases_status ON season_pass_purchases(status);

-- Ticket resale marketplace
CREATE TABLE IF NOT EXISTS ticket_resales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    seller_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    buyer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    original_price NUMERIC(10, 2) NOT NULL,
    asking_price NUMERIC(10, 2) NOT NULL,
    platform_fee NUMERIC(10, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'listed' CHECK (status IN ('listed', 'sold', 'cancelled', 'expired')),
    listed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sold_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ticket_resales_ticket ON ticket_resales(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_resales_seller ON ticket_resales(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_resales_status ON ticket_resales(status);

-- ============================================================================
-- SECTION 3: CHECK-IN IMPROVEMENTS
-- ============================================================================

-- Check-in stations
CREATE TABLE IF NOT EXISTS checkin_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    station_name VARCHAR(100) NOT NULL,
    station_type VARCHAR(30) NOT NULL CHECK (station_type IN ('manual', 'self_service', 'kiosk', 'mobile', 'facial_recognition')),
    location_description TEXT,
    is_active BOOLEAN DEFAULT true,
    assigned_staff UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    config JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkin_stations_event ON checkin_stations(event_id);
CREATE INDEX IF NOT EXISTS idx_checkin_stations_active ON checkin_stations(is_active) WHERE is_active = true;

-- Check-in records (enhanced)
CREATE TABLE IF NOT EXISTS checkin_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    station_id UUID REFERENCES checkin_stations(id) ON DELETE SET NULL,
    checked_in_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    checkin_method VARCHAR(30) NOT NULL CHECK (checkin_method IN ('qr_scan', 'manual_entry', 'facial_recognition', 'nfc', 'biometric')),
    checkin_status VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (checkin_status IN ('success', 'duplicate', 'invalid', 'expired', 'transferred')),
    device_info JSONB,
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_out_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_checkin_records_ticket ON checkin_records(ticket_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_station ON checkin_records(station_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_time ON checkin_records(checked_in_at DESC);

-- Badge printing queue
CREATE TABLE IF NOT EXISTS badge_print_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
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
    registered_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    attendee_name VARCHAR(200) NOT NULL,
    attendee_email VARCHAR(255),
    attendee_phone VARCHAR(20),
    payment_method VARCHAR(30) NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_walkin_registrations_event ON walkin_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_walkin_registrations_station ON walkin_registrations(station_id);

-- Express lane configuration
CREATE TABLE IF NOT EXISTS express_lanes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    lane_name VARCHAR(100) NOT NULL,
    eligibility_criteria JSONB NOT NULL,
    station_id UUID REFERENCES checkin_stations(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_express_lanes_event ON express_lanes(event_id);

-- Lost ticket recovery
CREATE TABLE IF NOT EXISTS lost_ticket_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    requester_email VARCHAR(255) NOT NULL,
    requester_phone VARCHAR(20),
    booking_reference VARCHAR(50),
    verification_method VARCHAR(30) NOT NULL CHECK (verification_method IN ('email', 'phone', 'id_card', 'manual')),
    verification_data JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'recovered', 'rejected')),
    recovered_ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lost_tickets_event ON lost_ticket_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_lost_tickets_status ON lost_ticket_requests(status);

-- ============================================================================
-- SECTION 4: PWA FEATURES
-- ============================================================================

-- Push subscriptions
CREATE TABLE IF NOT EXISTS pwa_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Offline ticket cache
CREATE TABLE IF NOT EXISTS offline_ticket_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticket_data JSONB NOT NULL,
    qr_code_data TEXT NOT NULL,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(ticket_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_offline_cache_user ON offline_ticket_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_cache_synced ON offline_ticket_cache(last_synced_at);

-- PWA installation tracking
CREATE TABLE IF NOT EXISTS pwa_installs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_type VARCHAR(50),
    platform VARCHAR(50),
    browser VARCHAR(50),
    installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uninstalled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pwa_installs_user ON pwa_installs(user_id);
CREATE INDEX IF NOT EXISTS idx_pwa_installs_platform ON pwa_installs(platform);

-- ============================================================================
-- SECTION 5: DARK MODE PREFERENCES
-- ============================================================================

-- User UI preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
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

-- Social engagement view
CREATE OR REPLACE VIEW v_social_engagement AS
SELECT
    ep.event_id,
    COUNT(DISTINCT ep.id) as total_posts,
    COUNT(DISTINCT pr.id) as total_reactions,
    COUNT(DISTINCT pc.id) as total_comments,
    COUNT(DISTINCT ss.id) as total_shares,
    COUNT(DISTINCT ep.user_id) as active_users
FROM event_posts ep
LEFT JOIN post_reactions pr ON ep.id = pr.post_id
LEFT JOIN post_comments pc ON ep.id = pc.post_id
LEFT JOIN social_shares ss ON ep.event_id = ss.event_id
GROUP BY ep.event_id;

-- Waitlist conversion rate
CREATE OR REPLACE VIEW v_waitlist_conversion AS
SELECT
    event_id,
    ticket_type_id,
    COUNT(*) as total_waitlisted,
    COUNT(*) FILTER (WHERE status = 'converted') as converted,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'converted') / NULLIF(COUNT(*), 0), 2) as conversion_rate
FROM waitlist
GROUP BY event_id, ticket_type_id;

-- Check-in analytics
CREATE OR REPLACE VIEW v_checkin_analytics AS
SELECT
    cr.station_id,
    cs.station_name,
    cs.event_id,
    DATE_TRUNC('hour', cr.checked_in_at) as hour,
    COUNT(*) as checkins,
    COUNT(DISTINCT cr.ticket_id) as unique_tickets,
    AVG(EXTRACT(EPOCH FROM (cr.checked_in_at - t.created_at))) as avg_time_to_checkin
FROM checkin_records cr
JOIN checkin_stations cs ON cr.station_id = cs.id
JOIN tickets t ON cr.ticket_id = t.id
WHERE cr.checkin_status = 'success'
GROUP BY cr.station_id, cs.station_name, cs.event_id, DATE_TRUNC('hour', cr.checked_in_at);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update waitlist positions when someone leaves
CREATE OR REPLACE FUNCTION update_waitlist_positions()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('converted', 'cancelled', 'expired') THEN
        UPDATE waitlist
        SET position = position - 1
        WHERE event_id = NEW.event_id
            AND ticket_type_id = NEW.ticket_type_id
            AND position > NEW.position
            AND status = 'waiting';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_waitlist_positions
AFTER UPDATE ON waitlist
FOR EACH ROW
WHEN (OLD.status = 'waiting' AND NEW.status IN ('converted', 'cancelled', 'expired'))
EXECUTE FUNCTION update_waitlist_positions();

-- Calculate dynamic price
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
    SELECT price INTO v_base_price
    FROM ticket_types
    WHERE id = p_ticket_type_id;

    v_final_price := v_base_price;

    FOR v_rule IN
        SELECT *
        FROM pricing_rules
        WHERE ticket_type_id = p_ticket_type_id
            AND is_active = true
            AND (starts_at IS NULL OR starts_at <= NOW())
            AND (ends_at IS NULL OR ends_at >= NOW())
        ORDER BY priority DESC
    LOOP
        CASE v_rule.rule_type
            WHEN 'early_bird' THEN
                IF v_rule.discount_percentage IS NOT NULL THEN
                    v_final_price := v_final_price * (1 - v_rule.discount_percentage / 100);
                ELSIF v_rule.discount_amount IS NOT NULL THEN
                    v_final_price := v_final_price - v_rule.discount_amount;
                END IF;

            WHEN 'group_discount' THEN
                IF p_quantity >= v_rule.min_quantity THEN
                    IF v_rule.discount_percentage IS NOT NULL THEN
                        v_final_price := v_final_price * (1 - v_rule.discount_percentage / 100);
                    END IF;
                END IF;
        END CASE;
    END LOOP;

    RETURN GREATEST(v_final_price, 0);
END;
$$ LANGUAGE plpgsql;

-- Get friend count
CREATE OR REPLACE FUNCTION get_friend_count(p_user_id UUID)
RETURNS INT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM user_connections
        WHERE (user_id = p_user_id OR connected_user_id = p_user_id)
            AND connection_type = 'friend'
            AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_booking_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_pass_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_resales ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_print_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE walkin_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE express_lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_ticket_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pwa_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_ticket_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE pwa_installs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- User connections policies
CREATE POLICY "Users can view their connections" ON user_connections
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE POLICY "Users can create connections" ON user_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their connections" ON user_connections
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

-- Event posts policies
CREATE POLICY "Anyone can view public posts" ON event_posts
    FOR SELECT USING (visibility = 'public');

CREATE POLICY "Users can create posts" ON event_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their posts" ON event_posts
    FOR UPDATE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPSERT USING (auth.uid() = user_id);

-- PWA subscriptions policies
CREATE POLICY "Users can manage their subscriptions" ON pwa_push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Offline cache policies
CREATE POLICY "Users can view their cache" ON offline_ticket_cache
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their cache" ON offline_ticket_cache
    FOR UPSERT USING (auth.uid() = user_id);
