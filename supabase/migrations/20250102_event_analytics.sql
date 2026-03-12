-- =====================================================
-- FSTIVO ADVANCED EVENT ANALYTICS - DATABASE SCHEMA
-- =====================================================
-- Version: 1.0
-- Purpose: Deep insights into event performance
-- Features: Real-time tracking, revenue, demographics, heatmaps
-- =====================================================

-- =====================================================
-- 1. EVENT ANALYTICS OVERVIEW
-- =====================================================
CREATE TABLE IF NOT EXISTS event_analytics_overview (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,

    -- Attendance Metrics
    total_tickets_sold INTEGER DEFAULT 0,
    total_tickets_available INTEGER DEFAULT 0,
    total_attendees INTEGER DEFAULT 0,
    checked_in_count INTEGER DEFAULT 0,
    no_show_count INTEGER DEFAULT 0,
    waitlist_count INTEGER DEFAULT 0,

    -- Revenue Metrics
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    average_ticket_price DECIMAL(10, 2) DEFAULT 0,
    revenue_by_ticket_type JSONB DEFAULT '{}',
    refund_amount DECIMAL(12, 2) DEFAULT 0,
    net_revenue DECIMAL(12, 2) DEFAULT 0,

    -- Conversion Metrics
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5, 2) DEFAULT 0,
    add_to_cart_count INTEGER DEFAULT 0,
    abandoned_cart_count INTEGER DEFAULT 0,

    -- Engagement Metrics
    average_time_on_page INTEGER DEFAULT 0, -- seconds
    social_shares INTEGER DEFAULT 0,
    email_opens INTEGER DEFAULT 0,
    email_clicks INTEGER DEFAULT 0,

    -- Time-based metrics
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_analytics_event ON event_analytics_overview(event_id);

-- =====================================================
-- 2. REAL-TIME ATTENDANCE TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    user_id UUID,
    ticket_id UUID,

    action_type VARCHAR(50) NOT NULL, -- checked_in, checked_out, no_show
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    check_in_method VARCHAR(50), -- qr_code, manual, nfc, facial_recognition

    -- Location data
    check_in_location JSONB, -- { lat, lng, venue_section }
    device_info JSONB, -- { device_type, os, browser }

    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_time ON attendance_logs(check_in_time);

-- =====================================================
-- 3. REVENUE ANALYTICS
-- =====================================================
CREATE TABLE IF NOT EXISTS revenue_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,

    -- Daily breakdown
    date DATE NOT NULL,
    tickets_sold INTEGER DEFAULT 0,
    revenue DECIMAL(12, 2) DEFAULT 0,
    refunds DECIMAL(12, 2) DEFAULT 0,
    net_revenue DECIMAL(12, 2) DEFAULT 0,

    -- Ticket type breakdown
    revenue_by_type JSONB DEFAULT '{}',

    -- Payment method breakdown
    payment_method_breakdown JSONB DEFAULT '{}',

    -- Discount usage
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    promo_codes_used JSONB DEFAULT '[]',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, date)
);

CREATE INDEX IF NOT EXISTS idx_revenue_event ON revenue_analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_analytics(date);

-- =====================================================
-- 4. MARKETING FUNNEL ANALYTICS
-- =====================================================
CREATE TABLE IF NOT EXISTS marketing_funnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,

    -- Funnel stages
    impressions INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    ticket_selections INTEGER DEFAULT 0,
    add_to_cart INTEGER DEFAULT 0,
    checkout_started INTEGER DEFAULT 0,
    checkout_completed INTEGER DEFAULT 0,

    -- Conversion rates
    view_to_selection_rate DECIMAL(5, 2) DEFAULT 0,
    selection_to_cart_rate DECIMAL(5, 2) DEFAULT 0,
    cart_to_checkout_rate DECIMAL(5, 2) DEFAULT 0,
    checkout_completion_rate DECIMAL(5, 2) DEFAULT 0,
    overall_conversion_rate DECIMAL(5, 2) DEFAULT 0,

    -- Traffic sources
    traffic_sources JSONB DEFAULT '{}', -- { organic, paid, social, email, referral }

    -- Date tracking
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, date)
);

CREATE INDEX IF NOT EXISTS idx_funnel_event ON marketing_funnel(event_id);
CREATE INDEX IF NOT EXISTS idx_funnel_date ON marketing_funnel(date);

-- =====================================================
-- 5. ATTENDEE DEMOGRAPHICS
-- =====================================================
CREATE TABLE IF NOT EXISTS attendee_demographics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,

    -- Age distribution
    age_distribution JSONB DEFAULT '{}', -- { "18-24": 45, "25-34": 120, ... }

    -- Gender distribution
    gender_distribution JSONB DEFAULT '{}', -- { male: 150, female: 180, other: 20 }

    -- Location distribution
    city_distribution JSONB DEFAULT '{}',
    country_distribution JSONB DEFAULT '{}',

    -- Professional background
    industry_distribution JSONB DEFAULT '{}',
    job_title_distribution JSONB DEFAULT '{}',

    -- Ticket types by demographic
    ticket_type_by_demographic JSONB DEFAULT '{}',

    -- Engagement scores
    avg_engagement_score DECIMAL(5, 2) DEFAULT 0,

    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id)
);

CREATE INDEX IF NOT EXISTS idx_demographics_event ON attendee_demographics(event_id);

-- =====================================================
-- 6. ENGAGEMENT HEATMAPS
-- =====================================================
CREATE TABLE IF NOT EXISTS engagement_heatmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,

    -- Page engagement
    section_views JSONB DEFAULT '{}', -- { header: 1200, tickets: 800, schedule: 600 }
    click_heatmap JSONB DEFAULT '{}', -- { x, y, clicks } coordinates
    scroll_depth JSONB DEFAULT '{}', -- { "0-25%": 1000, "25-50%": 800, ... }

    -- Time-based engagement
    time_on_section JSONB DEFAULT '{}', -- avg seconds per section
    peak_traffic_hours JSONB DEFAULT '{}',

    -- Device breakdown
    device_engagement JSONB DEFAULT '{}', -- desktop vs mobile behavior

    -- Session data
    avg_session_duration INTEGER DEFAULT 0, -- seconds
    bounce_rate DECIMAL(5, 2) DEFAULT 0,
    pages_per_session DECIMAL(5, 2) DEFAULT 0,

    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, date)
);

CREATE INDEX IF NOT EXISTS idx_heatmap_event ON engagement_heatmaps(event_id);
CREATE INDEX IF NOT EXISTS idx_heatmap_date ON engagement_heatmaps(date);

-- =====================================================
-- 7. COMPARATIVE ANALYTICS
-- =====================================================
CREATE TABLE IF NOT EXISTS comparative_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    comparison_event_id UUID, -- NULL for category averages
    comparison_type VARCHAR(50) NOT NULL, -- previous_event, similar_events, category_average

    -- Metrics comparison
    metric_name VARCHAR(100) NOT NULL,
    current_value DECIMAL(12, 2),
    comparison_value DECIMAL(12, 2),
    percentage_difference DECIMAL(5, 2),
    trend VARCHAR(20), -- up, down, neutral

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comparative_event ON comparative_analytics(event_id);

-- =====================================================
-- 8. ANALYTICS EXPORTS
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    user_id UUID,

    export_type VARCHAR(50) NOT NULL, -- pdf, excel, csv
    report_type VARCHAR(100) NOT NULL, -- overview, revenue, demographics, etc.

    file_url TEXT,
    file_size INTEGER, -- bytes

    date_range_start DATE,
    date_range_end DATE,

    filters_applied JSONB DEFAULT '{}',

    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_exports_event ON analytics_exports(event_id);
CREATE INDEX IF NOT EXISTS idx_exports_user ON analytics_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_exports_status ON analytics_exports(status);

-- =====================================================
-- 9. TRAFFIC SOURCES TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS traffic_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,

    source VARCHAR(100) NOT NULL, -- google, facebook, instagram, email, direct
    medium VARCHAR(100), -- organic, cpc, social, email
    campaign VARCHAR(200),

    visitors INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5, 2) DEFAULT 0,
    revenue DECIMAL(12, 2) DEFAULT 0,

    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, source, medium, campaign, date)
);

CREATE INDEX IF NOT EXISTS idx_traffic_event ON traffic_sources(event_id);
CREATE INDEX IF NOT EXISTS idx_traffic_date ON traffic_sources(date);

-- =====================================================
-- 10. REAL-TIME ANALYTICS EVENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,

    event_type VARCHAR(100) NOT NULL, -- page_view, ticket_purchase, check_in, etc.
    user_id UUID,

    event_data JSONB DEFAULT '{}',
    session_id VARCHAR(255),

    user_agent TEXT,
    ip_address INET,

    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE event_analytics_overview ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendee_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_heatmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparative_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Organizers can view their event analytics
DROP POLICY IF EXISTS "Organizers can view analytics" ON event_analytics_overview;
CREATE POLICY "Organizers can view analytics"
    ON event_analytics_overview FOR SELECT
    USING (
        event_id IN (
            SELECT id FROM events WHERE organizer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Organizers can view attendance" ON attendance_logs;
CREATE POLICY "Organizers can view attendance"
    ON attendance_logs FOR SELECT
    USING (
        event_id IN (
            SELECT id FROM events WHERE organizer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Organizers can view revenue" ON revenue_analytics;
CREATE POLICY "Organizers can view revenue"
    ON revenue_analytics FOR SELECT
    USING (
        event_id IN (
            SELECT id FROM events WHERE organizer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Organizers can view funnel" ON marketing_funnel;
CREATE POLICY "Organizers can view funnel"
    ON marketing_funnel FOR SELECT
    USING (
        event_id IN (
            SELECT id FROM events WHERE organizer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Organizers can view demographics" ON attendee_demographics;
CREATE POLICY "Organizers can view demographics"
    ON attendee_demographics FOR SELECT
    USING (
        event_id IN (
            SELECT id FROM events WHERE organizer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Organizers can view heatmaps" ON engagement_heatmaps;
CREATE POLICY "Organizers can view heatmaps"
    ON engagement_heatmaps FOR SELECT
    USING (
        event_id IN (
            SELECT id FROM events WHERE organizer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Organizers can view traffic" ON traffic_sources;
CREATE POLICY "Organizers can view traffic"
    ON traffic_sources FOR SELECT
    USING (
        event_id IN (
            SELECT id FROM events WHERE organizer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Organizers can view events" ON analytics_events;
CREATE POLICY "Organizers can view events"
    ON analytics_events FOR SELECT
    USING (
        event_id IN (
            SELECT id FROM events WHERE organizer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Organizers can view comparative" ON comparative_analytics;
CREATE POLICY "Organizers can view comparative"
    ON comparative_analytics FOR SELECT
    USING (
        event_id IN (
            SELECT id FROM events WHERE organizer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Organizers can view exports" ON analytics_exports;
CREATE POLICY "Organizers can view exports"
    ON analytics_exports FOR SELECT
    USING (
        user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Organizers can insert exports" ON analytics_exports;
CREATE POLICY "Organizers can insert exports"
    ON analytics_exports FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
    );

-- Service role can manage all data
DROP POLICY IF EXISTS "Service role can manage analytics" ON event_analytics_overview;
CREATE POLICY "Service role can manage analytics"
    ON event_analytics_overview FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can manage attendance" ON attendance_logs;
CREATE POLICY "Service role can manage attendance"
    ON attendance_logs FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can manage revenue" ON revenue_analytics;
CREATE POLICY "Service role can manage revenue"
    ON revenue_analytics FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can manage funnel" ON marketing_funnel;
CREATE POLICY "Service role can manage funnel"
    ON marketing_funnel FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can manage demographics" ON attendee_demographics;
CREATE POLICY "Service role can manage demographics"
    ON attendee_demographics FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can manage heatmaps" ON engagement_heatmaps;
CREATE POLICY "Service role can manage heatmaps"
    ON engagement_heatmaps FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can manage traffic" ON traffic_sources;
CREATE POLICY "Service role can manage traffic"
    ON traffic_sources FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can manage events" ON analytics_events;
CREATE POLICY "Service role can manage events"
    ON analytics_events FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can manage comparative" ON comparative_analytics;
CREATE POLICY "Service role can manage comparative"
    ON comparative_analytics FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Update event analytics overview
CREATE OR REPLACE FUNCTION update_event_analytics(p_event_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO event_analytics_overview (event_id, last_updated)
    VALUES (p_event_id, CURRENT_TIMESTAMP)
    ON CONFLICT (event_id)
    DO UPDATE SET
        total_tickets_sold = (
            SELECT COALESCE(COUNT(*), 0) FROM registrations
            WHERE event_id = p_event_id AND status = 'confirmed'
        ),
        total_attendees = (
            SELECT COALESCE(COUNT(DISTINCT user_id), 0) FROM registrations
            WHERE event_id = p_event_id
        ),
        checked_in_count = (
            SELECT COALESCE(COUNT(*), 0) FROM attendance_logs
            WHERE event_id = p_event_id AND action_type = 'checked_in'
        ),
        page_views = (
            SELECT COALESCE(COUNT(*), 0) FROM analytics_events
            WHERE event_id = p_event_id AND event_type = 'page_view'
        ),
        last_updated = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate conversion rates
CREATE OR REPLACE FUNCTION calculate_conversion_rates(p_event_id UUID)
RETURNS TABLE (
    stage VARCHAR,
    count INTEGER,
    conversion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH funnel_data AS (
        SELECT
            COALESCE(impressions, 0) as impressions,
            COALESCE(page_views, 0) as page_views,
            COALESCE(add_to_cart, 0) as add_to_cart,
            COALESCE(checkout_completed, 0) as checkout_completed
        FROM marketing_funnel
        WHERE event_id = p_event_id
        ORDER BY date DESC
        LIMIT 1
    )
    SELECT 'Impressions'::VARCHAR, impressions::INTEGER, 100.00::DECIMAL
    FROM funnel_data
    UNION ALL
    SELECT 'Page Views'::VARCHAR, page_views::INTEGER,
           CASE WHEN impressions > 0 THEN (page_views::DECIMAL / impressions * 100) ELSE 0 END
    FROM funnel_data
    UNION ALL
    SELECT 'Add to Cart'::VARCHAR, add_to_cart::INTEGER,
           CASE WHEN page_views > 0 THEN (add_to_cart::DECIMAL / page_views * 100) ELSE 0 END
    FROM funnel_data
    UNION ALL
    SELECT 'Purchases'::VARCHAR, checkout_completed::INTEGER,
           CASE WHEN add_to_cart > 0 THEN (checkout_completed::DECIMAL / add_to_cart * 100) ELSE 0 END
    FROM funnel_data;
END;
$$ LANGUAGE plpgsql;

-- Function: Get top traffic sources
CREATE OR REPLACE FUNCTION get_top_traffic_sources(
    p_event_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    source VARCHAR,
    visitors INTEGER,
    conversions INTEGER,
    revenue DECIMAL,
    conversion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ts.source,
        SUM(ts.visitors)::INTEGER as visitors,
        SUM(ts.conversions)::INTEGER as conversions,
        SUM(ts.revenue)::DECIMAL as revenue,
        CASE
            WHEN SUM(ts.visitors) > 0
            THEN (SUM(ts.conversions)::DECIMAL / SUM(ts.visitors) * 100)
            ELSE 0
        END as conversion_rate
    FROM traffic_sources ts
    WHERE ts.event_id = p_event_id
    GROUP BY ts.source
    ORDER BY revenue DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample analytics overview
INSERT INTO event_analytics_overview (
    event_id,
    total_tickets_sold,
    total_tickets_available,
    total_attendees,
    checked_in_count,
    total_revenue,
    average_ticket_price,
    page_views,
    unique_visitors,
    conversion_rate
) VALUES (
    gen_random_uuid(),
    450,
    500,
    420,
    380,
    45000.00,
    100.00,
    12500,
    8900,
    3.6
) ON CONFLICT DO NOTHING;

-- =====================================================
-- ANALYTICS SCHEMA COMPLETE
-- =====================================================
-- Total Tables: 10
-- Total Indexes: 20
-- Total Functions: 3
-- RLS Policies: 20+
-- =====================================================
