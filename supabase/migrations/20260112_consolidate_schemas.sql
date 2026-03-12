-- Database Schema Consolidation Migration
-- Location: supabase/migrations/20260112_consolidate_schemas.sql

-- =====================================================
-- AUDIT & LOGGING TABLES
-- =====================================================
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  message TEXT NOT NULL,
  context JSONB,
  error_message TEXT,
  error_stack TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_level ON error_logs(level);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);

-- =====================================================
-- NOTIFICATION LOGGING TABLES
-- =====================================================
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  message TEXT NOT NULL,
  message_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'failed', 'queued')),
  error TEXT,
  priority TEXT DEFAULT 'normal',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sms_logs_recipient ON sms_logs(recipient);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_sent_at ON sms_logs(sent_at DESC);

CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  message TEXT NOT NULL,
  message_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  media_url TEXT,
  error TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_logs_recipient ON whatsapp_logs(recipient);
CREATE INDEX idx_whatsapp_logs_status ON whatsapp_logs(status);

CREATE TABLE IF NOT EXISTS push_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_endpoint TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  status_code INTEGER,
  error TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_push_logs_status ON push_logs(status);
CREATE INDEX idx_push_logs_sent_at ON push_logs(sent_at DESC);

-- =====================================================
-- PUSH SUBSCRIPTION MANAGEMENT
-- =====================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(active) WHERE active = true;

-- =====================================================
-- MONITORING VIEWS
-- =====================================================
CREATE OR REPLACE VIEW notification_health AS
SELECT
  'sms' as channel,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'delivered') / NULLIF(COUNT(*), 0), 2) as success_rate
FROM sms_logs
WHERE sent_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT
  'whatsapp' as channel,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'delivered') / NULLIF(COUNT(*), 0), 2) as success_rate
FROM whatsapp_logs
WHERE sent_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT
  'push' as channel,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'sent') as delivered,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'sent') / NULLIF(COUNT(*), 0), 2) as success_rate
FROM push_logs
WHERE sent_at > NOW() - INTERVAL '24 hours';

CREATE OR REPLACE VIEW error_summary AS
SELECT
  level,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as affected_users,
  MAX(timestamp) as last_occurred
FROM error_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY level
ORDER BY 
  CASE level
    WHEN 'fatal' THEN 1
    WHEN 'error' THEN 2
    WHEN 'warn' THEN 3
    WHEN 'info' THEN 4
    WHEN 'debug' THEN 5
  END;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view error logs" ON error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- CLEANUP & ARCHIVAL FUNCTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM error_logs WHERE timestamp < NOW() - INTERVAL '90 days';
  DELETE FROM sms_logs WHERE sent_at < NOW() - INTERVAL '90 days';
  DELETE FROM whatsapp_logs WHERE sent_at < NOW() - INTERVAL '90 days';
  DELETE FROM push_logs WHERE sent_at < NOW() - INTERVAL '90 days';
END;
$$;
