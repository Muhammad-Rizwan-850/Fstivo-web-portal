-- Feature Flags System Migration
-- This migration creates tables for managing feature flags and their rules

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  user_groups TEXT[], -- Array of user groups that can access this feature
  environment VARCHAR(50) NOT NULL DEFAULT 'development' CHECK (environment IN ('development', 'staging', 'production')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feature_flag_rules table for user-specific overrides
CREATE TABLE IF NOT EXISTS feature_flag_rules (
  id SERIAL PRIMARY KEY,
  flag_id VARCHAR(255) NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  user_id VARCHAR(255), -- Specific user ID (optional)
  user_group VARCHAR(255), -- User group (optional)
  enabled BOOLEAN NOT NULL,
  conditions JSONB, -- Additional conditions for enabling the flag
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(flag_id, user_id), -- Prevent duplicate rules for same user
  UNIQUE(flag_id, user_group) -- Prevent duplicate rules for same group
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON feature_flags(environment);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flag_rules_flag_id ON feature_flag_rules(flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_rules_user_id ON feature_flag_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_rules_user_group ON feature_flag_rules(user_group);

-- Insert some default feature flags
INSERT INTO feature_flags (id, name, description, enabled, rollout_percentage, environment) VALUES
('qr_checkin', 'QR Code Check-in', 'Enable QR code based attendee check-in system', true, 100, 'production'),
('admin_dashboard', 'Admin Dashboard', 'Enable comprehensive admin dashboard', true, 100, 'production'),
('api_documentation', 'API Documentation', 'Enable Swagger API documentation', true, 100, 'production'),
('advanced_analytics', 'Advanced Analytics', 'Enable advanced analytics and reporting features', false, 50, 'production'),
('social_features', 'Social Features', 'Enable social networking features', true, 100, 'production'),
('mobile_app', 'Mobile App Features', 'Enable mobile-specific features and optimizations', false, 25, 'staging'),
('ai_recommendations', 'AI Recommendations', 'Enable AI-powered event recommendations', false, 10, 'development')
ON CONFLICT (id) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flag_rules_updated_at
    BEFORE UPDATE ON feature_flag_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only admins can manage feature flags)
CREATE POLICY "Allow admins to manage feature flags" ON feature_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.admin_role = true
        )
    );

CREATE POLICY "Allow admins to manage feature flag rules" ON feature_flag_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.admin_role = true
        )
    );

-- Create a view for active feature flags with user context
CREATE OR REPLACE VIEW active_feature_flags AS
SELECT
    ff.*,
    CASE
        WHEN ff.rollout_percentage = 100 THEN true
        WHEN ff.rollout_percentage = 0 THEN false
        ELSE (abs(hashtext(COALESCE(auth.uid()::text, 'anonymous'))) % 100) < ff.rollout_percentage
    END as is_enabled_for_current_user
FROM feature_flags ff
WHERE ff.enabled = true;

-- Grant permissions
GRANT SELECT ON active_feature_flags TO authenticated;
GRANT ALL ON feature_flags TO service_role;
GRANT ALL ON feature_flag_rules TO service_role;