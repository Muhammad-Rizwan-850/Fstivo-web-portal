-- =====================================================
-- Migration: 20250104_security_compliance.sql
-- Description: GDPR compliance and 2FA security
-- Tables: 10 tables
-- =====================================================

-- 1. User Privacy Settings
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  marketing_emails BOOLEAN DEFAULT false,
  analytics_tracking BOOLEAN DEFAULT true,
  personalized_ads BOOLEAN DEFAULT false,
  data_sharing BOOLEAN DEFAULT false,
  profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'connections')),
  show_activity BOOLEAN DEFAULT true,
  show_location BOOLEAN DEFAULT false,
  allow_search_indexing BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Cookie Consents
CREATE TABLE IF NOT EXISTS cookie_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  ip_address INET,
  necessary_cookies BOOLEAN DEFAULT true,
  functional_cookies BOOLEAN DEFAULT false,
  analytics_cookies BOOLEAN DEFAULT false,
  marketing_cookies BOOLEAN DEFAULT false,
  consent_version VARCHAR(50) NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_consent UNIQUE(user_id, consent_version)
);

-- 3. Data Export Requests
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('full_export', 'personal_data', 'activity_logs', 'transactions')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  file_url TEXT,
  file_size_bytes BIGINT,
  expires_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Data Deletion Requests
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deletion_type VARCHAR(50) NOT NULL CHECK (deletion_type IN ('account', 'specific_data', 'activity_logs', 'all_data')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'canceled')),
  reason TEXT,
  data_to_delete JSONB,
  backup_created BOOLEAN DEFAULT false,
  backup_url TEXT,
  scheduled_deletion_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Consent History
CREATE TABLE IF NOT EXISTS consent_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('granted', 'revoked', 'updated')),
  previous_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'blocked')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Two-Factor Authentication
CREATE TABLE IF NOT EXISTS user_two_factor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  method VARCHAR(20) CHECK (method IN ('sms', 'authenticator', 'email')),
  phone_number VARCHAR(20),
  phone_verified BOOLEAN DEFAULT false,
  secret_key TEXT,
  backup_codes TEXT[],
  backup_codes_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Trusted Devices
CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  ip_address INET,
  is_trusted BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- 9. 2FA Verification Attempts
CREATE TABLE IF NOT EXISTS two_factor_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method VARCHAR(20) NOT NULL,
  code_sent VARCHAR(10),
  success BOOLEAN DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Privacy Policy Versions
CREATE TABLE IF NOT EXISTS privacy_policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  effective_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT false,
  requires_consent BOOLEAN DEFAULT true,
  changes_summary TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_user_id ON user_privacy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_user_id ON cookie_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_session_id ON cookie_consents(session_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_consent_history_user_id ON consent_history(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_history_created_at ON consent_history(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_two_factor_user_id ON user_two_factor(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_device_id ON trusted_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_attempts_user_id ON two_factor_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_attempts_created_at ON two_factor_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_privacy_policy_versions_is_active ON privacy_policy_versions(is_active);

-- RLS Policies
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_two_factor ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_policy_versions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own privacy settings
DROP POLICY IF EXISTS "Users can manage own privacy settings" ON user_privacy_settings;
CREATE POLICY "Users can manage own privacy settings" ON user_privacy_settings
  FOR ALL USING (auth.uid() = user_id);

-- Users can view their own consents
DROP POLICY IF EXISTS "Users can view own consents" ON cookie_consents;
CREATE POLICY "Users can view own consents" ON cookie_consents
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert own consents" ON cookie_consents;
CREATE POLICY "Users can insert own consents" ON cookie_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can manage their data export requests
DROP POLICY IF EXISTS "Users can manage own export requests" ON data_export_requests;
CREATE POLICY "Users can manage own export requests" ON data_export_requests
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their deletion requests
DROP POLICY IF EXISTS "Users can manage own deletion requests" ON data_deletion_requests;
CREATE POLICY "Users can manage own deletion requests" ON data_deletion_requests
  FOR ALL USING (auth.uid() = user_id);

-- Users can view their consent history
DROP POLICY IF EXISTS "Users can view own consent history" ON consent_history;
CREATE POLICY "Users can view own consent history" ON consent_history
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their audit logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their 2FA settings
DROP POLICY IF EXISTS "Users can manage own 2FA" ON user_two_factor;
CREATE POLICY "Users can manage own 2FA" ON user_two_factor
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their trusted devices
DROP POLICY IF EXISTS "Users can manage own trusted devices" ON trusted_devices;
CREATE POLICY "Users can manage own trusted devices" ON trusted_devices
  FOR ALL USING (auth.uid() = user_id);

-- Users can view their 2FA attempts
DROP POLICY IF EXISTS "Users can view own 2FA attempts" ON two_factor_attempts;
CREATE POLICY "Users can view own 2FA attempts" ON two_factor_attempts
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can view active privacy policy
DROP POLICY IF EXISTS "Anyone can view active privacy policy" ON privacy_policy_versions;
CREATE POLICY "Anyone can view active privacy policy" ON privacy_policy_versions
  FOR SELECT USING (is_active = true);

-- Insert default privacy policy
INSERT INTO privacy_policy_versions (
  version,
  title,
  content,
  effective_date,
  is_active,
  requires_consent
) VALUES (
  '1.0',
  'Privacy Policy',
  'Default privacy policy content. Replace with your actual privacy policy.',
  NOW(),
  true,
  true
) ON CONFLICT (version) DO NOTHING;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action VARCHAR,
  p_resource_type VARCHAR,
  p_resource_id UUID DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    changes,
    metadata
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_changes,
    p_metadata
  ) RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log consent change
CREATE OR REPLACE FUNCTION log_consent_change(
  p_user_id UUID,
  p_consent_type VARCHAR,
  p_action VARCHAR,
  p_previous_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_consent_id UUID;
BEGIN
  INSERT INTO consent_history (
    user_id,
    consent_type,
    action,
    previous_value,
    new_value
  ) VALUES (
    p_user_id,
    p_consent_type,
    p_action,
    p_previous_value,
    p_new_value
  ) RETURNING id INTO v_consent_id;

  RETURN v_consent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate backup codes
CREATE OR REPLACE FUNCTION generate_backup_codes()
RETURNS TEXT[] AS $$
DECLARE
  codes TEXT[];
  i INTEGER;
BEGIN
  codes := ARRAY[]::TEXT[];

  FOR i IN 1..10 LOOP
    codes := array_append(codes, upper(substring(md5(random()::text) from 1 for 8)));
  END LOOP;

  RETURN codes;
END;
$$ LANGUAGE plpgsql;

-- Function to verify backup code
CREATE OR REPLACE FUNCTION verify_backup_code(
  p_user_id UUID,
  p_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_codes TEXT[];
  v_code_exists BOOLEAN;
BEGIN
  -- Get backup codes
  SELECT backup_codes INTO v_codes
  FROM user_two_factor
  WHERE user_id = p_user_id;

  -- Check if code exists and hasn't been used
  v_code_exists := p_code = ANY(v_codes);

  IF v_code_exists THEN
    -- Remove used code
    UPDATE user_two_factor
    SET
      backup_codes = array_remove(backup_codes, p_code),
      backup_codes_used = backup_codes_used + 1
    WHERE user_id = p_user_id;

    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if device is trusted
CREATE OR REPLACE FUNCTION is_device_trusted(
  p_user_id UUID,
  p_device_id VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_trusted BOOLEAN;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT is_trusted, expires_at
  INTO v_is_trusted, v_expires_at
  FROM trusted_devices
  WHERE user_id = p_user_id
    AND device_id = p_device_id;

  IF v_is_trusted AND (v_expires_at IS NULL OR v_expires_at > NOW()) THEN
    -- Update last used
    UPDATE trusted_devices
    SET last_used_at = NOW()
    WHERE user_id = p_user_id AND device_id = p_device_id;

    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_privacy_settings_updated_at ON user_privacy_settings;
CREATE TRIGGER update_user_privacy_settings_updated_at
  BEFORE UPDATE ON user_privacy_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cookie_consents_updated_at ON cookie_consents;
CREATE TRIGGER update_cookie_consents_updated_at
  BEFORE UPDATE ON cookie_consents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_two_factor_updated_at ON user_two_factor;
CREATE TRIGGER update_user_two_factor_updated_at
  BEFORE UPDATE ON user_two_factor
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to anonymize user data (GDPR right to erasure)
CREATE OR REPLACE FUNCTION anonymize_user_data(
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Anonymize personal data but keep records for integrity
  -- This is a simplified version - expand based on your needs

  -- Update user profile
  UPDATE profiles
  SET
    full_name = 'Deleted User',
    email = concat('deleted_', p_user_id, '@anonymized.local'),
    phone = NULL,
    avatar_url = NULL,
    bio = NULL
  WHERE id = p_user_id;

  -- Log the anonymization
  PERFORM log_audit_event(
    p_user_id,
    'user_anonymized',
    'user',
    p_user_id,
    jsonb_build_object('reason', 'GDPR right to erasure')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
