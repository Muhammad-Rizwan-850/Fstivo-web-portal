-- =====================================================
-- FSTIVO ADVANCED NOTIFICATION SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Version: 1.0
-- Created: 2026-01-01
-- Purpose: Multi-channel notification system with user preferences
-- Channels: Email, SMS, Push, WhatsApp
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. NOTIFICATION CHANNELS
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    requires_verification BOOLEAN DEFAULT false,
    cost_per_message DECIMAL(10, 4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert default channels
INSERT INTO notification_channels (name, display_name, description, icon, requires_verification, cost_per_message) VALUES
('email', 'Email', 'Receive notifications via email', 'Mail', true, 0),
('sms', 'SMS', 'Receive text messages on your phone', 'MessageSquare', true, 0.05),
('push', 'Push Notifications', 'Browser and mobile app notifications', 'Bell', false, 0),
('whatsapp', 'WhatsApp', 'Get messages on WhatsApp', 'MessageCircle', true, 0.03)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 2. NOTIFICATION TYPES
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    default_enabled BOOLEAN DEFAULT true,
    icon VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert notification types
INSERT INTO notification_types (name, display_name, description, category, default_enabled, icon, priority) VALUES
-- Event notifications
('event_reminder_1day', 'Event Reminder (1 Day)', 'Get notified 1 day before event', 'event', true, 'Calendar', 'high'),
('event_reminder_1hour', 'Event Reminder (1 Hour)', 'Get notified 1 hour before event', 'event', true, 'Clock', 'high'),
('event_reminder_now', 'Event Starting Now', 'Notification when event is starting', 'event', true, 'PlayCircle', 'critical'),
('event_cancelled', 'Event Cancelled', 'When an event is cancelled', 'event', true, 'XCircle', 'critical'),
('event_updated', 'Event Details Updated', 'When event details change', 'event', true, 'Edit', 'medium'),
('event_new_similar', 'Similar Events', 'New events matching your interests', 'event', true, 'Sparkles', 'low'),

-- Ticket notifications
('ticket_purchased', 'Ticket Purchase Confirmation', 'Confirmation of ticket purchase', 'ticket', true, 'ShoppingBag', 'high'),
('ticket_transferred', 'Ticket Transfer', 'When tickets are transferred', 'ticket', true, 'Send', 'medium'),
('ticket_refunded', 'Refund Processed', 'When refund is completed', 'ticket', true, 'DollarSign', 'high'),
('ticket_reminder', 'Bring Your Ticket', 'Reminder to bring ticket/QR code', 'ticket', true, 'Ticket', 'medium'),

-- Social notifications
('friend_registered', 'Friend Registered Event', 'When a friend registers for an event', 'social', false, 'Users', 'low'),
('new_message', 'New Message', 'Someone sent you a message', 'social', true, 'MessageSquare', 'medium'),
('connection_request', 'Connection Request', 'Someone wants to connect', 'social', true, 'UserPlus', 'medium'),
('event_discussion', 'Event Discussion', 'New activity in event discussions', 'social', false, 'MessageCircle', 'low'),

-- System notifications
('account_created', 'Welcome to Fstivo', 'Account creation confirmation', 'system', true, 'UserCheck', 'high'),
('password_changed', 'Password Changed', 'Security notification', 'system', true, 'Lock', 'critical'),
('login_new_device', 'New Login Detected', 'Login from new device/location', 'system', true, 'Shield', 'high'),

-- Marketing notifications
('newsletter', 'Newsletter', 'Weekly event highlights', 'marketing', false, 'Newspaper', 'low'),
('promotions', 'Special Offers', 'Discounts and promotions', 'marketing', false, 'Tag', 'low'),
('platform_updates', 'Platform Updates', 'New features and improvements', 'marketing', false, 'Sparkles', 'low')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 3. USER NOTIFICATION PREFERENCES
-- =====================================================
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type_id UUID NOT NULL REFERENCES notification_types(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, notification_type_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_user_notif_prefs_user ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notif_prefs_type ON user_notification_preferences(notification_type_id);

-- =====================================================
-- 4. USER CONTACT VERIFICATION
-- =====================================================
CREATE TABLE IF NOT EXISTS user_contact_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,
    contact_value VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    verification_sent_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_verification_user ON user_contact_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_verification_token ON user_contact_verification(verification_token);

-- =====================================================
-- 5. NOTIFICATION TEMPLATES
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_type_id UUID NOT NULL REFERENCES notification_types(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,
    subject_template TEXT,
    body_template TEXT NOT NULL,
    html_template TEXT,
    variables JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(notification_type_id, channel_id)
);

-- =====================================================
-- 6. NOTIFICATION QUEUE
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type_id UUID NOT NULL REFERENCES notification_types(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    html_body TEXT,
    data JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    scheduled_for TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notif_queue_scheduled ON notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notif_queue_user ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_queue_priority ON notification_queue(priority, scheduled_for);

-- =====================================================
-- 7. NOTIFICATION LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type_id UUID NOT NULL REFERENCES notification_types(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body TEXT,
    status VARCHAR(50) NOT NULL,
    external_id VARCHAR(255),
    cost DECIMAL(10, 4) DEFAULT 0,
    metadata JSONB,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_log_user ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_log_type ON notification_log(notification_type_id);
CREATE INDEX IF NOT EXISTS idx_notif_log_channel ON notification_log(channel_id);
CREATE INDEX IF NOT EXISTS idx_notif_log_status ON notification_log(status);
CREATE INDEX IF NOT EXISTS idx_notif_log_sent_at ON notification_log(sent_at);

-- =====================================================
-- 8. EVENT REMINDERS
-- =====================================================
CREATE TABLE IF NOT EXISTS event_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_event_reminders_scheduled ON event_reminders(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_event_reminders_user ON event_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_event ON event_reminders(event_id);

-- =====================================================
-- 9. PUSH NOTIFICATION SUBSCRIPTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);

-- =====================================================
-- 10. NOTIFICATION SETTINGS GLOBAL
-- =====================================================
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    global_enabled BOOLEAN DEFAULT true,
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    timezone VARCHAR(50) DEFAULT 'Asia/Karachi',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_notif_settings_user ON user_notification_settings(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contact_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Public read for channels and types
CREATE POLICY "Public can view notification channels"
    ON notification_channels FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public can view notification types"
    ON notification_types FOR SELECT
    USING (true);

-- Users can manage their own preferences
CREATE POLICY "Users can view own preferences"
    ON user_notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
    ON user_notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
    ON user_notification_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
    ON user_notification_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- Users can manage contact verification
CREATE POLICY "Users can view own contact verification"
    ON user_contact_verification FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contact verification"
    ON user_contact_verification FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contact verification"
    ON user_contact_verification FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can view notification log
CREATE POLICY "Users can view own notification log"
    ON notification_log FOR SELECT
    USING (auth.uid() = user_id);

-- Users can manage event reminders
CREATE POLICY "Users can view own reminders"
    ON event_reminders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
    ON event_reminders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
    ON event_reminders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
    ON event_reminders FOR DELETE
    USING (auth.uid() = user_id);

-- Users can manage push subscriptions
CREATE POLICY "Users can view own push subscriptions"
    ON push_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
    ON push_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions"
    ON push_subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
    ON push_subscriptions FOR DELETE
    USING (auth.uid() = user_id);

-- Users can manage notification settings
CREATE POLICY "Users can view own notification settings"
    ON user_notification_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
    ON user_notification_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
    ON user_notification_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- Service role policies
CREATE POLICY "Service role can manage notification queue"
    ON notification_queue FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage templates"
    ON notification_templates FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get user's notification preferences
CREATE OR REPLACE FUNCTION get_user_notification_preferences(p_user_id UUID)
RETURNS TABLE (
    notification_type VARCHAR,
    notification_display_name VARCHAR,
    category VARCHAR,
    email_enabled BOOLEAN,
    sms_enabled BOOLEAN,
    push_enabled BOOLEAN,
    whatsapp_enabled BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        nt.name AS notification_type,
        nt.display_name AS notification_display_name,
        nt.category,
        COALESCE(
            (SELECT unp.is_enabled
             FROM user_notification_preferences unp
             JOIN notification_channels nc ON nc.id = unp.channel_id
             WHERE unp.user_id = p_user_id
             AND unp.notification_type_id = nt.id
             AND nc.name = 'email'
             LIMIT 1),
            nt.default_enabled
        ) AS email_enabled,
        COALESCE(
            (SELECT unp.is_enabled
             FROM user_notification_preferences unp
             JOIN notification_channels nc ON nc.id = unp.channel_id
             WHERE unp.user_id = p_user_id
             AND unp.notification_type_id = nt.id
             AND nc.name = 'sms'
             LIMIT 1),
            nt.default_enabled
        ) AS sms_enabled,
        COALESCE(
            (SELECT unp.is_enabled
             FROM user_notification_preferences unp
             JOIN notification_channels nc ON nc.id = unp.channel_id
             WHERE unp.user_id = p_user_id
             AND unp.notification_type_id = nt.id
             AND nc.name = 'push'
             LIMIT 1),
            nt.default_enabled
        ) AS push_enabled,
        COALESCE(
            (SELECT unp.is_enabled
             FROM user_notification_preferences unp
             JOIN notification_channels nc ON nc.id = unp.channel_id
             WHERE unp.user_id = p_user_id
             AND unp.notification_type_id = nt.id
             AND nc.name = 'whatsapp'
             LIMIT 1),
            nt.default_enabled
        ) AS whatsapp_enabled
    FROM notification_types nt
    ORDER BY nt.category, nt.display_name;
END;
$$ LANGUAGE plpgsql;

-- Function to schedule event reminders
CREATE OR REPLACE FUNCTION schedule_event_reminders(
    p_event_id UUID,
    p_user_id UUID,
    p_event_start_time TIMESTAMPTZ
)
RETURNS void AS $$
BEGIN
    -- 1 day reminder
    INSERT INTO event_reminders (event_id, user_id, reminder_type, scheduled_for)
    VALUES (p_event_id, p_user_id, '1_day', p_event_start_time - INTERVAL '1 day')
    ON CONFLICT (event_id, user_id, reminder_type) DO NOTHING;

    -- 1 hour reminder
    INSERT INTO event_reminders (event_id, user_id, reminder_type, scheduled_for)
    VALUES (p_event_id, p_user_id, '1_hour', p_event_start_time - INTERVAL '1 hour')
    ON CONFLICT (event_id, user_id, reminder_type) DO NOTHING;

    -- Event starting now
    INSERT INTO event_reminders (event_id, user_id, reminder_type, scheduled_for)
    VALUES (p_event_id, p_user_id, 'now', p_event_start_time)
    ON CONFLICT (event_id, user_id, reminder_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE TEMPLATES
-- =====================================================

INSERT INTO notification_templates (notification_type_id, channel_id, subject_template, body_template, html_template, variables)
SELECT
    nt.id,
    nc.id,
    'Event Reminder: {{event_name}} is tomorrow!',
    'Hi {{user_name}},

Just a friendly reminder that {{event_name}} is happening tomorrow at {{event_time}}.

Event Details:
- Name: {{event_name}}
- Date: {{event_date}}
- Time: {{event_time}}
- Venue: {{event_venue}}

We look forward to seeing you there!

Best regards,
Fstivo Team',
    '<html><body style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #E879F9 0%, #8B5CF6 100%);">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px;">
            <h2 style="color: #8B5CF6;">Event Reminder</h2>
            <p>Hi {{user_name}},</p>
            <p>Just a friendly reminder that <strong>{{event_name}}</strong> is happening tomorrow!</p>
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>📅 Date:</strong> {{event_date}}</p>
                <p><strong>🕐 Time:</strong> {{event_time}}</p>
                <p><strong>📍 Venue:</strong> {{event_venue}}</p>
            </div>
            <p>We look forward to seeing you there!</p>
        </div>
    </body></html>',
    '["user_name", "event_name", "event_date", "event_time", "event_venue"]'::jsonb
FROM notification_types nt
CROSS JOIN notification_channels nc
WHERE nt.name = 'event_reminder_1day' AND nc.name = 'email'
ON CONFLICT (notification_type_id, channel_id) DO NOTHING;

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
-- Total Tables: 10
-- Total Indexes: 18
-- Total Functions: 2
-- RLS Policies: 20+
-- =====================================================
