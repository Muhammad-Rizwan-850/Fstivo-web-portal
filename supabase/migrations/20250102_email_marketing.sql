-- =====================================================
-- FSTIVO EMAIL MARKETING CAMPAIGNS - DATABASE SCHEMA
-- =====================================================
-- Version: 1.0
-- Purpose: Built-in email campaigns for event promotion
-- Features: Template builder, segmentation, A/B testing
-- =====================================================

-- =====================================================
-- 1. EMAIL TEMPLATES
-- =====================================================
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES auth.users(id),
    event_id UUID, -- NULL for general templates

    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    preview_text VARCHAR(200),

    -- Template content
    html_content TEXT NOT NULL,
    json_design JSONB, -- For drag-and-drop builder

    -- Template metadata
    category VARCHAR(100), -- promotion, reminder, thank_you, follow_up
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT false, -- Share in marketplace

    -- Variables used in template
    variables JSONB DEFAULT '[]', -- ["event_name", "event_date", etc.]

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_templates_organizer ON email_templates(organizer_id);
CREATE INDEX idx_email_templates_event ON email_templates(event_id);
CREATE INDEX idx_email_templates_category ON email_templates(category);

-- =====================================================
-- 2. AUDIENCE SEGMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS audience_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES auth.users(id),
    event_id UUID,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Segment criteria
    criteria JSONB NOT NULL, -- { ticket_type: [], location: [], age_range: [], etc. }

    -- Calculated stats
    estimated_size INTEGER DEFAULT 0,
    last_calculated TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_segments_organizer ON audience_segments(organizer_id);
CREATE INDEX idx_segments_event ON audience_segments(event_id);

-- =====================================================
-- 3. EMAIL CAMPAIGNS
-- =====================================================
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES auth.users(id),
    event_id UUID,

    name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL, -- one_time, recurring, automated
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sending, sent, paused, cancelled

    -- Template
    template_id UUID REFERENCES email_templates(id),
    subject VARCHAR(500) NOT NULL,
    from_name VARCHAR(255),
    from_email VARCHAR(255),
    reply_to VARCHAR(255),

    -- Audience
    segment_ids JSONB DEFAULT '[]', -- Array of segment IDs
    total_recipients INTEGER DEFAULT 0,

    -- Scheduling
    send_at TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR(50) DEFAULT 'Asia/Karachi',

    -- A/B Testing
    is_ab_test BOOLEAN DEFAULT false,
    ab_test_config JSONB, -- { variant_a, variant_b, split_percentage, winner_criteria }

    -- Performance metrics
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,

    -- Calculated rates
    delivery_rate DECIMAL(5, 2) DEFAULT 0,
    open_rate DECIMAL(5, 2) DEFAULT 0,
    click_rate DECIMAL(5, 2) DEFAULT 0,
    bounce_rate DECIMAL(5, 2) DEFAULT 0,

    -- Revenue tracking
    revenue_generated DECIMAL(12, 2) DEFAULT 0,
    tickets_sold INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaigns_organizer ON email_campaigns(organizer_id);
CREATE INDEX idx_campaigns_event ON email_campaigns(event_id);
CREATE INDEX idx_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_campaigns_send_at ON email_campaigns(send_at);

-- =====================================================
-- 4. CAMPAIGN VARIANTS (for A/B Testing)
-- =====================================================
CREATE TABLE IF NOT EXISTS campaign_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,

    variant_name VARCHAR(50) NOT NULL, -- A, B, C
    subject VARCHAR(500) NOT NULL,
    template_id UUID REFERENCES email_templates(id),

    -- Split allocation
    percentage INTEGER DEFAULT 50, -- % of audience to receive this variant

    -- Performance
    sent_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    open_rate DECIMAL(5, 2) DEFAULT 0,
    click_rate DECIMAL(5, 2) DEFAULT 0,

    is_winner BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_variants_campaign ON campaign_variants(campaign_id);

-- =====================================================
-- 5. CAMPAIGN SENDS (Individual Email Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS campaign_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES campaign_variants(id),
    user_id UUID REFERENCES auth.users(id),

    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),

    -- Personalization data
    merge_fields JSONB DEFAULT '{}',

    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, bounced, failed

    -- Engagement tracking
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    first_click_at TIMESTAMP WITH TIME ZONE,

    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,

    -- External IDs
    external_id VARCHAR(255), -- From email service provider

    -- Error handling
    error_message TEXT,
    bounce_type VARCHAR(50), -- hard, soft

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sends_campaign ON campaign_sends(campaign_id);
CREATE INDEX idx_sends_user ON campaign_sends(user_id);
CREATE INDEX idx_sends_status ON campaign_sends(status);
CREATE INDEX idx_sends_email ON campaign_sends(recipient_email);

-- =====================================================
-- 6. EMAIL CLICK TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS email_click_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_send_id UUID NOT NULL REFERENCES campaign_sends(id) ON DELETE CASCADE,

    url TEXT NOT NULL,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- User info
    user_agent TEXT,
    ip_address INET,
    device_type VARCHAR(50), -- desktop, mobile, tablet

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clicks_send ON email_click_tracking(campaign_send_id);
CREATE INDEX idx_clicks_url ON email_click_tracking(url);

-- =====================================================
-- 7. AUTOMATED CAMPAIGNS (Triggers)
-- =====================================================
CREATE TABLE IF NOT EXISTS automated_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,

    trigger_type VARCHAR(100) NOT NULL, -- ticket_purchase, event_reminder, post_event, abandoned_cart
    trigger_config JSONB NOT NULL, -- { delay: "1 hour", conditions: [] }

    is_active BOOLEAN DEFAULT true,

    -- Stats
    total_triggered INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_automated_campaign ON automated_campaigns(campaign_id);
CREATE INDEX idx_automated_trigger ON automated_campaigns(trigger_type);

-- =====================================================
-- 8. AUTOMATED CAMPAIGN QUEUE
-- =====================================================
CREATE TABLE IF NOT EXISTS automated_campaign_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automated_campaign_id UUID NOT NULL REFERENCES automated_campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),

    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, cancelled

    trigger_data JSONB, -- Context from the trigger event

    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auto_queue_campaign ON automated_campaign_queue(automated_campaign_id);
CREATE INDEX idx_auto_queue_scheduled ON automated_campaign_queue(scheduled_for, status);

-- =====================================================
-- 9. EMAIL UNSUBSCRIBES
-- =====================================================
CREATE TABLE IF NOT EXISTS email_unsubscribes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    email VARCHAR(255) NOT NULL,

    -- Unsubscribe context
    campaign_id UUID REFERENCES email_campaigns(id),
    organizer_id UUID REFERENCES auth.users(id),
    event_id UUID,

    unsubscribe_type VARCHAR(50) DEFAULT 'all', -- all, event_specific, organizer_specific
    reason VARCHAR(255),

    unsubscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(email, unsubscribe_type, organizer_id, event_id)
);

CREATE INDEX idx_unsubscribe_email ON email_unsubscribes(email);
CREATE INDEX idx_unsubscribe_organizer ON email_unsubscribes(organizer_id);

-- =====================================================
-- 10. CAMPAIGN PERFORMANCE REPORTS
-- =====================================================
CREATE TABLE IF NOT EXISTS campaign_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,

    report_date DATE NOT NULL,

    -- Daily metrics
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,

    -- Top links clicked
    top_links JSONB DEFAULT '[]',

    -- Engagement by time
    engagement_by_hour JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(campaign_id, report_date)
);

CREATE INDEX idx_reports_campaign ON campaign_reports(campaign_id);
CREATE INDEX idx_reports_date ON campaign_reports(report_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_click_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_campaign_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_reports ENABLE ROW LEVEL SECURITY;

-- Organizers can manage their own templates and campaigns
CREATE POLICY "Organizers can manage templates"
    ON email_templates FOR ALL
    USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can manage segments"
    ON audience_segments FOR ALL
    USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can manage campaigns"
    ON email_campaigns FOR ALL
    USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can manage variants"
    ON campaign_variants FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM email_campaigns
            WHERE email_campaigns.id = campaign_variants.campaign_id
            AND email_campaigns.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can manage sends"
    ON campaign_sends FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM email_campaigns
            WHERE email_campaigns.id = campaign_sends.campaign_id
            AND email_campaigns.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can manage clicks"
    ON email_click_tracking FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM campaign_sends
            JOIN email_campaigns ON email_campaigns.id = campaign_sends.campaign_id
            WHERE campaign_sends.id = email_click_tracking.campaign_send_id
            AND email_campaigns.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can manage automated campaigns"
    ON automated_campaigns FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM email_campaigns
            WHERE email_campaigns.id = automated_campaigns.campaign_id
            AND email_campaigns.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can manage queue"
    ON automated_campaign_queue FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM automated_campaigns
            JOIN email_campaigns ON email_campaigns.id = automated_campaigns.campaign_id
            WHERE automated_campaigns.id = automated_campaign_queue.automated_campaign_id
            AND email_campaigns.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can manage reports"
    ON campaign_reports FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM email_campaigns
            WHERE email_campaigns.id = campaign_reports.campaign_id
            AND email_campaigns.organizer_id = auth.uid()
        )
    );

-- Users can view their own unsubscribe status
CREATE POLICY "Users can view own unsubscribes"
    ON email_unsubscribes FOR SELECT
    USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can unsubscribe"
    ON email_unsubscribes FOR INSERT
    WITH CHECK (true); -- Allow anyone to unsubscribe

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Calculate segment size
CREATE OR REPLACE FUNCTION calculate_segment_size(p_segment_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_criteria JSONB;
    v_count INTEGER;
BEGIN
    SELECT criteria INTO v_criteria FROM audience_segments WHERE id = p_segment_id;

    -- This is a simplified example - actual implementation would be more complex
    SELECT COUNT(DISTINCT user_id) INTO v_count
    FROM tickets
    WHERE event_id = (SELECT event_id FROM audience_segments WHERE id = p_segment_id)
    AND status = 'confirmed';

    -- Update segment
    UPDATE audience_segments
    SET estimated_size = v_count, last_calculated = CURRENT_TIMESTAMP
    WHERE id = p_segment_id;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Update campaign metrics
CREATE OR REPLACE FUNCTION update_campaign_metrics(p_campaign_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE email_campaigns
    SET
        sent_count = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = p_campaign_id AND status != 'failed'),
        delivered_count = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = p_campaign_id AND status = 'delivered'),
        opened_count = (SELECT COUNT(DISTINCT id) FROM campaign_sends WHERE campaign_id = p_campaign_id AND opened_at IS NOT NULL),
        clicked_count = (SELECT COUNT(DISTINCT campaign_send_id) FROM email_click_tracking ect
                        JOIN campaign_sends cs ON cs.id = ect.campaign_send_id
                        WHERE cs.campaign_id = p_campaign_id),
        bounced_count = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = p_campaign_id AND status = 'bounced'),
        delivery_rate = CASE
            WHEN (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = p_campaign_id AND status != 'failed') > 0
            THEN (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = p_campaign_id AND status = 'delivered')::DECIMAL /
                 (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = p_campaign_id AND status != 'failed') * 100
            ELSE 0
        END,
        open_rate = CASE
            WHEN (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = p_campaign_id AND status = 'delivered') > 0
            THEN (SELECT COUNT(DISTINCT id) FROM campaign_sends WHERE campaign_id = p_campaign_id AND opened_at IS NOT NULL)::DECIMAL /
                 (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = p_campaign_id AND status = 'delivered') * 100
            ELSE 0
        END,
        click_rate = CASE
            WHEN (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = p_campaign_id AND status = 'delivered') > 0
            THEN (SELECT COUNT(DISTINCT campaign_send_id) FROM email_click_tracking ect
                  JOIN campaign_sends cs ON cs.id = ect.campaign_send_id
                  WHERE cs.campaign_id = p_campaign_id)::DECIMAL /
                 (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = p_campaign_id AND status = 'delivered') * 100
            ELSE 0
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if user is unsubscribed
CREATE OR REPLACE FUNCTION is_user_unsubscribed(
    p_email VARCHAR,
    p_organizer_id UUID,
    p_event_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM email_unsubscribes
        WHERE email = p_email
        AND (
            unsubscribe_type = 'all'
            OR (unsubscribe_type = 'organizer_specific' AND organizer_id = p_organizer_id)
            OR (unsubscribe_type = 'event_specific' AND event_id = p_event_id)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample email template
INSERT INTO email_templates (
    organizer_id,
    name,
    subject,
    preview_text,
    html_content,
    category,
    variables
) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'Event Promotion - Standard',
    'Don''t Miss {{event_name}} - {{days_until}} Days to Go!',
    'Join us for an unforgettable experience',
    '<html><body style="font-family: Arial, sans-serif; background: linear-gradient(135deg, #E879F9 0%, #8B5CF6 100%); padding: 40px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px;">
            <h1 style="color: #8B5CF6; margin-bottom: 20px;">{{event_name}}</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">Join us for an amazing event on {{event_date}}!</p>
            <a href="{{ticket_url}}" style="display: inline-block; background: linear-gradient(135deg, #E879F9 0%, #8B5CF6 100%); color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">Get Your Tickets</a>
        </div>
    </body></html>',
    'promotion',
    '["event_name", "event_date", "days_until", "ticket_url"]'::jsonb
) ON CONFLICT DO NOTHING;

-- =====================================================
-- EMAIL MARKETING SCHEMA COMPLETE
-- =====================================================
-- Total Tables: 10
-- Total Indexes: 20+
-- Total Functions: 3
-- RLS Policies: 10+
-- =====================================================
