-- =============================================================================
-- FSTIVO ADMIN PANEL SYSTEM
-- =============================================================================
-- Migration: 006_admin_system.sql
-- Purpose: Create admin roles, permissions, activity logging
-- Created: 2024-12-30
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ADMIN ROLES & PERMISSIONS
-- -----------------------------------------------------------------------------

-- Add admin role column to user_profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'admin_role'
    ) THEN
        ALTER TABLE user_profiles
        ADD COLUMN admin_role TEXT CHECK (admin_role IN ('super_admin', 'admin', 'moderator', NULL));
    END IF;
END $$;

-- Add status column to user_profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'account_status'
    ) THEN
        ALTER TABLE user_profiles
        ADD COLUMN account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned')),
        ADD COLUMN status_updated_at TIMESTAMPTZ,
        ADD COLUMN status_updated_by UUID REFERENCES auth.users(id),
        ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create admin_permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
    permissions JSONB DEFAULT '{}',
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create admin_activity_log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. EVENT MODERATION FIELDS
-- -----------------------------------------------------------------------------

-- Add moderation fields to events table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'moderated_at'
    ) THEN
        ALTER TABLE events
        ADD COLUMN moderated_at TIMESTAMPTZ,
        ADD COLUMN moderated_by UUID REFERENCES auth.users(id),
        ADD COLUMN moderation_reason TEXT;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. SYSTEM SETTINGS TABLE
-- -----------------------------------------------------------------------------

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default system settings
INSERT INTO system_settings (key, value, description, category) VALUES
    ('platform_name', '"FSTIVO"', 'Platform name', 'general'),
    ('platform_url', '"https://fstivo.com"', 'Platform URL', 'general'),
    ('support_email', '"support@fstivo.com"', 'Support email address', 'general'),
    ('commission_rate', '5', 'Platform commission rate (percentage)', 'payments'),
    ('require_email_verification', 'true', 'Require email verification for new users', 'security'),
    ('require_event_approval', 'true', 'Require admin approval for events', 'moderation'),
    ('enable_2fa_for_admins', 'true', 'Require 2FA for admin accounts', 'security'),
    ('max_file_size_mb', '10', 'Maximum file upload size in MB', 'uploads'),
    ('max_events_per_user', '50', 'Maximum events a user can create', 'limits')
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. ADMIN REPORTS TABLE (Optional)
-- -----------------------------------------------------------------------------

-- Create scheduled_reports table
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('revenue', 'users', 'events', 'transactions')),
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    recipients TEXT[] NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. INDEXES FOR PERFORMANCE
-- -----------------------------------------------------------------------------

-- Admin permissions indexes
CREATE INDEX IF NOT EXISTS idx_admin_permissions_user_id ON admin_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_role ON admin_permissions(role);

-- Admin activity log indexes
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_target ON admin_activity_log(target_type, target_id);

-- User status index
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_status ON user_profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin_role ON user_profiles(admin_role);

-- System settings index
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- Scheduled reports index
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_is_active ON scheduled_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run_at);

-- -----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------

-- Enable RLS on admin tables
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Admin permissions policies
CREATE POLICY "Users can view their own admin permissions"
    ON admin_permissions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all admin permissions"
    ON admin_permissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Super admins can insert admin permissions"
    ON admin_permissions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can update admin permissions"
    ON admin_permissions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- Admin activity log policies
CREATE POLICY "Admins can view activity log"
    ON admin_activity_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert activity log"
    ON admin_activity_log FOR INSERT
    WITH CHECK (true);

-- System settings policies
CREATE POLICY "Everyone can view system settings"
    ON system_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can update system settings"
    ON system_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Super admins can insert system settings"
    ON system_settings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE user_id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- Scheduled reports policies
CREATE POLICY "Admins can view scheduled reports"
    ON scheduled_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can create scheduled reports"
    ON scheduled_reports FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update own scheduled reports"
    ON scheduled_reports FOR UPDATE
    USING (created_by = auth.uid());

CREATE POLICY "Admins can delete own scheduled reports"
    ON scheduled_reports FOR DELETE
    USING (created_by = auth.uid());

-- -----------------------------------------------------------------------------
-- 7. HELPER FUNCTIONS
-- ------------------------------------------------------------------------------

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_permissions
        WHERE user_id = user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION has_admin_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM admin_permissions
    WHERE user_id = user_id;

    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Role hierarchy
    IF required_role = 'moderator' THEN
        RETURN user_role IN ('moderator', 'admin', 'super_admin');
    ELSIF required_role = 'admin' THEN
        RETURN user_role IN ('admin', 'super_admin');
    ELSIF required_role = 'super_admin' THEN
        RETURN user_role = 'super_admin';
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
    admin_id UUID,
    action TEXT,
    target_type TEXT DEFAULT NULL,
    target_id UUID DEFAULT NULL,
    details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details)
    VALUES (admin_id, action, target_type, target_id, details)
    RETURNING id INTO activity_id;

    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get platform stats
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'totalUsers', (SELECT COUNT(*) FROM user_profiles WHERE deleted_at IS NULL),
        'totalEvents', (SELECT COUNT(*) FROM events),
        'totalRevenue', (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'completed'),
        'totalUniversities', (SELECT COUNT(*) FROM universities),
        'activeUsers', (SELECT COUNT(*) FROM user_profiles WHERE account_status = 'active' AND deleted_at IS NULL),
        'pendingEvents', (SELECT COUNT(*) FROM events WHERE status = 'pending'),
        'publishedEvents', (SELECT COUNT(*) FROM events WHERE status = 'published'),
        'completedTransactions', (SELECT COUNT(*) FROM transactions WHERE status = 'completed')
    ) INTO stats;

    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Function to get revenue by month
CREATE OR REPLACE FUNCTION get_revenue_by_month(months INTEGER DEFAULT 12)
RETURNS TABLE (
    month TEXT,
    revenue NUMERIC,
    transactions INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        TO_CHAR(created_at, 'Mon YYYY') as month,
        COALESCE(SUM(amount), 0) as revenue,
        COUNT(*) as transactions
    FROM transactions
    WHERE status = 'completed'
    AND created_at > NOW() - (months || ' months')::INTERVAL
    GROUP BY TO_CHAR(created_at, 'Mon YYYY')
    ORDER BY MIN(created_at);
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 8. GRANTS
-- ------------------------------------------------------------------------------

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON admin_permissions TO authenticated;
GRANT SELECT ON admin_activity_log TO authenticated;
GRANT SELECT ON system_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON scheduled_reports TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_admin_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_activity(UUID, TEXT, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_by_month(INTEGER) TO authenticated;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
