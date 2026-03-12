-- =============================================================================
-- FSTIVO REFERRAL & REWARDS SYSTEM
-- =============================================================================
-- Migration: 004_referral_rewards_system.sql
-- Purpose: Create tables for referral program, rewards catalog, and campaigns
-- Created: 2024-12-30
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. REFERRAL SYSTEM
-- -----------------------------------------------------------------------------

-- Add referral columns to user_profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'referral_code'
    ) THEN
        ALTER TABLE user_profiles
        ADD COLUMN referral_code TEXT UNIQUE,
        ADD COLUMN referral_points INTEGER DEFAULT 0,
        ADD COLUMN total_referrals INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create indexes for user_profiles referral columns
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON user_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_points ON user_profiles(referral_points);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    referred_email TEXT,
    referred_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at DESC);

-- RLS Policies for referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals"
    ON referrals FOR SELECT
    USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert referrals"
    ON referrals FOR INSERT
    WITH CHECK (auth.uid() = referrer_id);

-- -----------------------------------------------------------------------------
-- 2. REWARDS SYSTEM
-- -----------------------------------------------------------------------------

-- Rewards catalog
CREATE TABLE IF NOT EXISTS rewards_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('tickets', 'credits', 'badges', 'promotion', 'tools', 'vouchers')),
    icon TEXT,
    available INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    popular BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for rewards
CREATE INDEX IF NOT EXISTS idx_rewards_catalog_active ON rewards_catalog(active);
CREATE INDEX IF NOT EXISTS idx_rewards_catalog_category ON rewards_catalog(category);
CREATE INDEX IF NOT EXISTS idx_rewards_catalog_points ON rewards_catalog(points_required);

-- RLS Policies for rewards catalog (public read, no user write)
ALTER TABLE rewards_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rewards"
    ON rewards_catalog FOR SELECT
    USING (active = true);

-- Reward redemptions
CREATE TABLE IF NOT EXISTS reward_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards_catalog(id),
    reward_title TEXT NOT NULL,
    points_spent INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Indexes for redemptions
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_redeemed_at ON reward_redemptions(redeemed_at DESC);

-- RLS Policies for redemptions
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own redemptions"
    ON reward_redemptions FOR SELECT
    USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. CAMPAIGNS SYSTEM
-- -----------------------------------------------------------------------------

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('referral', 'social', 'engagement', 'milestone')),
    target INTEGER NOT NULL,
    reward_title TEXT NOT NULL,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('points', 'ticket', 'badge', 'credit')),
    reward_value INTEGER,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON campaigns(end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);

-- RLS Policies for campaigns (public read)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active campaigns"
    ON campaigns FOR SELECT
    USING (status = 'active' AND end_date > NOW());

-- Campaign progress tracking
CREATE TABLE IF NOT EXISTS campaign_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    progress_type TEXT NOT NULL CHECK (progress_type IN ('referral', 'share', 'engagement')),
    target_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, campaign_id, target_id)
);

-- Indexes for campaign progress
CREATE INDEX IF NOT EXISTS idx_campaign_progress_user_id ON campaign_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_progress_campaign_id ON campaign_progress(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_progress_type ON campaign_progress(progress_type);

-- RLS Policies for campaign progress
ALTER TABLE campaign_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
    ON campaign_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
    ON campaign_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. SHARE TRACKING
-- -----------------------------------------------------------------------------

-- Share tracking table
CREATE TABLE IF NOT EXISTS share_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'facebook', 'twitter', 'linkedin', 'email', 'other')),
    share_url TEXT,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for share tracking
CREATE INDEX IF NOT EXISTS idx_share_tracking_user_id ON share_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_share_tracking_created_at ON share_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_tracking_platform ON share_tracking(platform);

-- RLS Policies for share tracking
ALTER TABLE share_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shares"
    ON share_tracking FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert shares"
    ON share_tracking FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 5. FUNCTIONS AND TRIGGERS
-- -----------------------------------------------------------------------------

-- Function to check and complete referrals
CREATE OR REPLACE FUNCTION check_referral_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is the first confirmed registration for a referral
    IF NEW.status = 'confirmed' THEN
        -- Find pending referral by email
        UPDATE referrals
        SET status = 'completed',
            completed_at = NOW(),
            points_earned = 100
        WHERE referred_email = (
                SELECT email FROM users WHERE id = NEW.user_id
            )
        AND status = 'pending'
        AND id IN (
                SELECT id FROM referrals r
                JOIN user_profiles up ON r.referrer_id = up.id
                WHERE up.id = r.referrer_id
            );

        -- Award points to referrer
        UPDATE user_profiles
        SET referral_points = referral_points + 100,
            total_referrals = total_referrals + 1
        WHERE id IN (
                SELECT referrer_id FROM referrals
                WHERE referred_email = (
                        SELECT email FROM users WHERE id = NEW.user_id
                    )
                AND status = 'completed'
            );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for referral completion
DROP TRIGGER IF EXISTS after_registration_insert ON registrations;
CREATE TRIGGER after_registration_insert
    AFTER INSERT ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION check_referral_completion();

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    attempts INTEGER := 0;
BEGIN
    WHILE attempts < 10 LOOP
        code := 'FSTIVO' || upper(substr(md5(random()::text), 1, 6));

        IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE referral_code = code) THEN
            RETURN code;
        END IF;

        attempts := attempts + 1;
    END LOOP;

    RAISE EXCEPTION 'Failed to generate unique referral code after 10 attempts';
END;
$$ LANGUAGE plpgsql;

-- Function to automatically assign referral code to new users
CREATE OR REPLACE FUNCTION assign_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_unique_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-assigning referral codes
DROP TRIGGER IF EXISTS before_user_profile_insert ON user_profiles;
CREATE TRIGGER before_user_profile_insert
    BEFORE INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION assign_referral_code();

-- -----------------------------------------------------------------------------
-- 6. SEED DATA - INITIAL REWARDS CATALOG
-- -----------------------------------------------------------------------------

-- Insert initial rewards
INSERT INTO rewards_catalog (title, description, points_required, category, icon, available, active, popular) VALUES
    ('Free Event Ticket', 'Redeem for any event ticket up to ₨500', 500, 'tickets', '🎟️', 100, true, true),
    ('₨500 Event Credit', 'Use on any event registration', 400, 'credits', '💰', 200, true, true),
    ('Premium Badge', 'Get VIP profile badge for 3 months', 300, 'badges', '⭐', 50, true, false),
    ('Featured Profile', 'Your profile featured for 1 week', 600, 'promotion', '🌟', 20, true, false),
    ('Event Organizer Pack', 'Free tools for event creation', 800, 'tools', '🎯', 30, true, false),
    ('Coffee Gift Card', '₨300 coffee shop voucher', 250, 'vouchers', '☕', 60, true, true)
ON CONFLICT DO NOTHING;

-- Insert initial campaigns
INSERT INTO campaigns (title, description, type, target, reward_title, reward_type, reward_value, end_date, status) VALUES
    ('Friend Fest 2024', 'Invite 5 friends and get a free Premium ticket', 'referral', 5, 'Premium Ticket', 'ticket', 500, '2025-12-31', 'active'),
    ('Social Sharer', 'Share 3 events on social media', 'social', 3, '200 Points', 'points', 200, '2025-12-30', 'active'),
    ('Review Master', 'Leave reviews for 5 attended events', 'engagement', 5, 'VIP Badge', 'badge', 0, '2025-01-15', 'active'),
    ('Event Explorer', 'Register for 10 different events', 'milestone', 10, '500 Points', 'points', 500, '2025-03-31', 'active')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. VIEWS FOR ANALYTICS
-- -----------------------------------------------------------------------------

-- Referral analytics view
CREATE OR REPLACE VIEW referral_analytics AS
SELECT
    up.id as user_id,
    up.referral_code,
    up.referral_points,
    up.total_referrals,
    COUNT(r.id) FILTER (WHERE r.status = 'completed') as completed_referrals,
    COUNT(r.id) FILTER (WHERE r.status = 'pending') as pending_referrals,
    SUM(r.points_earned) FILTER (WHERE r.status = 'completed') as total_points_from_referrals,
    (up.total_referrals * 200)::INTEGER as potential_earnings
FROM user_profiles up
LEFT JOIN referrals r ON up.id = r.referrer_id
GROUP BY up.id;

-- Top referrers view
CREATE OR REPLACE VIEW top_referrers AS
SELECT
    up.id as user_id,
    up.first_name,
    up.last_name,
    up.referral_code,
    up.total_referrals,
    up.referral_points,
    COUNT(r.id) FILTER (WHERE r.status = 'completed' AND r.created_at > NOW() - INTERVAL '30 days') as referrals_last_30_days
FROM user_profiles up
LEFT JOIN referrals r ON up.id = r.referrer_id
GROUP BY up.id
ORDER BY referrals_last_30_days DESC
LIMIT 100;

-- Campaign analytics view
CREATE OR REPLACE VIEW campaign_analytics AS
SELECT
    c.id as campaign_id,
    c.title,
    c.type,
    c.target,
    c.end_date,
    c.status,
    COUNT(DISTINCT cp.user_id) as total_participants,
    COUNT(cp.id) as total_actions,
    ROUND(COUNT(cp.id)::NUMERIC / NULLIF(c.target, 0) * 100, 2) as completion_rate
FROM campaigns c
LEFT JOIN campaign_progress cp ON c.id = cp.campaign_id
GROUP BY c.id
ORDER BY total_participants DESC;

-- -----------------------------------------------------------------------------
-- 8. GRANTS (adjust based on your security requirements)
-- -----------------------------------------------------------------------------

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON referrals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON rewards_catalog TO authenticated;
GRANT SELECT, INSERT ON reward_redemptions TO authenticated;
GRANT SELECT ON campaigns TO authenticated;
GRANT SELECT, INSERT ON campaign_progress TO authenticated;
GRANT SELECT, INSERT ON share_tracking TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION generate_unique_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION check_referral_completion() TO authenticated;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================

COMMIT;
