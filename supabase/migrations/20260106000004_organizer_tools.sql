-- =====================================================
-- ORGANIZER TOOLS & ANALYTICS - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Migration: 20260106000004
-- Features: Analytics, Email Marketing, Event Cloning, Seating Management
-- =====================================================

-- ============================================================================
-- SECTION 1: ADVANCED EVENT ANALYTICS
-- ============================================================================

-- Real-time attendance tracking
CREATE TABLE IF NOT EXISTS attendance_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_count INT NOT NULL DEFAULT 0,
  total_registered INT NOT NULL DEFAULT 0,
  attendance_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE WHEN total_registered > 0 
    THEN (checked_in_count::numeric / total_registered * 100) 
    ELSE 0 END
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attendance_tracking_event ON attendance_tracking(event_id);
CREATE INDEX idx_attendance_tracking_timestamp ON attendance_tracking(timestamp DESC);

-- Revenue analytics
CREATE TABLE IF NOT EXISTS revenue_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  gross_revenue NUMERIC(10, 2) NOT NULL DEFAULT 0,
  net_revenue NUMERIC(10, 2) NOT NULL DEFAULT 0,
  platform_fees NUMERIC(10, 2) NOT NULL DEFAULT 0,
  refunds NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ticket_sales_count INT NOT NULL DEFAULT 0,
  average_ticket_price NUMERIC(10, 2) GENERATED ALWAYS AS (
    CASE WHEN ticket_sales_count > 0 
    THEN gross_revenue / ticket_sales_count 
    ELSE 0 END
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, date)
);

CREATE INDEX idx_revenue_analytics_event ON revenue_analytics(event_id);
CREATE INDEX idx_revenue_analytics_date ON revenue_analytics(date DESC);

-- Marketing funnel tracking
CREATE TABLE IF NOT EXISTS marketing_funnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL CHECK (stage IN ('view', 'click', 'registration_started', 'registration_completed', 'payment_completed')),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  source VARCHAR(100),
  medium VARCHAR(100),
  campaign VARCHAR(100),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_marketing_funnel_event ON marketing_funnel(event_id);
CREATE INDEX idx_marketing_funnel_stage ON marketing_funnel(stage);
CREATE INDEX idx_marketing_funnel_timestamp ON marketing_funnel(timestamp DESC);
CREATE INDEX idx_marketing_funnel_source ON marketing_funnel(source);

-- Attendee demographics
CREATE TABLE IF NOT EXISTS attendee_demographics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  age_group VARCHAR(20),
  gender VARCHAR(20),
  location_city VARCHAR(100),
  location_country VARCHAR(100) DEFAULT 'Pakistan',
  university VARCHAR(200),
  profession VARCHAR(100),
  count INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_demographics_event ON attendee_demographics(event_id);
CREATE INDEX idx_demographics_age ON attendee_demographics(age_group);
CREATE INDEX idx_demographics_location ON attendee_demographics(location_city);

-- Engagement heatmaps (page interactions)
CREATE TABLE IF NOT EXISTS engagement_heatmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  page_section VARCHAR(100) NOT NULL,
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('click', 'scroll', 'hover', 'view')),
  x_coordinate INT,
  y_coordinate INT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id VARCHAR(100)
);

CREATE INDEX idx_engagement_event ON engagement_heatmaps(event_id);
CREATE INDEX idx_engagement_section ON engagement_heatmaps(page_section);
CREATE INDEX idx_engagement_type ON engagement_heatmaps(interaction_type);

-- Analytics reports
CREATE TABLE IF NOT EXISTS analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('attendance', 'revenue', 'demographics', 'marketing', 'comprehensive')),
  report_format VARCHAR(10) NOT NULL CHECK (report_format IN ('pdf', 'excel', 'csv')),
  file_url TEXT,
  parameters JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_reports_event ON analytics_reports(event_id);
CREATE INDEX idx_reports_created_by ON analytics_reports(created_by);
CREATE INDEX idx_reports_status ON analytics_reports(status);

-- Traffic sources
CREATE TABLE IF NOT EXISTS traffic_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  source VARCHAR(100) NOT NULL,
  medium VARCHAR(100),
  campaign VARCHAR(100),
  sessions INT NOT NULL DEFAULT 0,
  registrations INT NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE WHEN sessions > 0 
    THEN (registrations::numeric / sessions * 100) 
    ELSE 0 END
  ) STORED,
  date DATE NOT NULL,
  UNIQUE(event_id, source, medium, campaign, date)
);

CREATE INDEX idx_traffic_sources_event ON traffic_sources(event_id);
CREATE INDEX idx_traffic_sources_date ON traffic_sources(date DESC);

-- ============================================================================
-- SECTION 2: EMAIL MARKETING CAMPAIGNS
-- ============================================================================

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  subject_line TEXT NOT NULL,
  preview_text TEXT,
  html_content TEXT NOT NULL,
  json_content JSONB,
  is_public BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  usage_count INT DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_templates_created_by ON email_templates(created_by);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_public ON email_templates(is_public) WHERE is_public = true;

-- Audience segments
CREATE TABLE IF NOT EXISTS audience_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL,
  estimated_size INT DEFAULT 0,
  actual_size INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audience_segments_event ON audience_segments(event_id);
CREATE INDEX idx_audience_segments_created_by ON audience_segments(created_by);

-- Email campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  segment_id UUID REFERENCES audience_segments(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  subject_line TEXT NOT NULL,
  preview_text TEXT,
  html_content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipient_count INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  opened_count INT DEFAULT 0,
  clicked_count INT DEFAULT 0,
  unsubscribed_count INT DEFAULT 0,
  bounced_count INT DEFAULT 0,
  open_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE WHEN delivered_count > 0 
    THEN (opened_count::numeric / delivered_count * 100) 
    ELSE 0 END
  ) STORED,
  click_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE WHEN opened_count > 0 
    THEN (clicked_count::numeric / opened_count * 100) 
    ELSE 0 END
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_campaigns_event ON email_campaigns(event_id);
CREATE INDEX idx_email_campaigns_created_by ON email_campaigns(created_by);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled ON email_campaigns(scheduled_at);

-- A/B testing
CREATE TABLE IF NOT EXISTS email_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  variant_name VARCHAR(50) NOT NULL,
  subject_line TEXT NOT NULL,
  preview_text TEXT,
  html_content TEXT NOT NULL,
  recipient_percentage INT NOT NULL,
  sent_count INT DEFAULT 0,
  opened_count INT DEFAULT 0,
  clicked_count INT DEFAULT 0,
  is_winner BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ab_tests_campaign ON email_ab_tests(campaign_id);

-- Email tracking
CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_reason TEXT,
  click_count INT DEFAULT 0,
  open_count INT DEFAULT 0,
  links_clicked TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_tracking_campaign ON email_tracking(campaign_id);
CREATE INDEX idx_email_tracking_email ON email_tracking(recipient_email);
CREATE INDEX idx_email_tracking_status ON email_tracking(status);

-- Automated follow-ups
CREATE TABLE IF NOT EXISTS automated_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('registration', 'days_before_event', 'days_after_event', 'no_show', 'checkout_abandoned')),
  trigger_value INT,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  subject_line TEXT NOT NULL,
  html_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sent_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_followups_event ON automated_followups(event_id);
CREATE INDEX idx_followups_trigger ON automated_followups(trigger_type);
CREATE INDEX idx_followups_active ON automated_followups(is_active) WHERE is_active = true;

-- ============================================================================
-- SECTION 3: EVENT CLONING & TEMPLATES
-- ============================================================================

-- Event templates
CREATE TABLE IF NOT EXISTS event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  thumbnail_url TEXT,
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  usage_count INT DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0,
  price NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_templates_created_by ON event_templates(created_by);
CREATE INDEX idx_event_templates_category ON event_templates(category);
CREATE INDEX idx_event_templates_public ON event_templates(is_public) WHERE is_public = true;

-- Template reviews
CREATE TABLE IF NOT EXISTS template_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES event_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

CREATE INDEX idx_template_reviews_template ON template_reviews(template_id);
CREATE INDEX idx_template_reviews_user ON template_reviews(user_id);

-- Event series (recurring events)
CREATE TABLE IF NOT EXISTS event_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  recurrence_pattern VARCHAR(50) NOT NULL CHECK (recurrence_pattern IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom')),
  recurrence_config JSONB,
  start_date DATE NOT NULL,
  end_date DATE,
  max_occurrences INT,
  template_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_series_created_by ON event_series(created_by);
CREATE INDEX idx_event_series_pattern ON event_series(recurrence_pattern);

-- Series instances (generated events)
CREATE TABLE IF NOT EXISTS series_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES event_series(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  occurrence_number INT NOT NULL,
  is_cancelled BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_series_instances_series ON series_instances(series_id);
CREATE INDEX idx_series_instances_event ON series_instances(event_id);

-- Template collections
CREATE TABLE IF NOT EXISTS template_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category VARCHAR(100),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collections_featured ON template_collections(is_featured) WHERE is_featured = true;

-- Collection items
CREATE TABLE IF NOT EXISTS collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES template_collections(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES event_templates(id) ON DELETE CASCADE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(collection_id, template_id)
);

CREATE INDEX idx_collection_items_collection ON collection_items(collection_id);
CREATE INDEX idx_collection_items_order ON collection_items(display_order);

-- ============================================================================
-- SECTION 4: SEATING & VENUE MANAGEMENT
-- ============================================================================

-- Venues
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) DEFAULT 'Pakistan',
  total_capacity INT NOT NULL,
  description TEXT,
  amenities TEXT[],
  images TEXT[],
  contact_name VARCHAR(200),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_venues_created_by ON venues(created_by);
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_venues_active ON venues(is_active) WHERE is_active = true;

-- Seating layouts
CREATE TABLE IF NOT EXISTS seating_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  layout_type VARCHAR(50) NOT NULL CHECK (layout_type IN ('theater', 'classroom', 'banquet', 'cabaret', 'u_shape', 'boardroom', 'custom')),
  total_seats INT NOT NULL,
  layout_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seating_layouts_venue ON seating_layouts(venue_id);
CREATE INDEX idx_seating_layouts_event ON seating_layouts(event_id);

-- Seating sections (tiers)
CREATE TABLE IF NOT EXISTS seating_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID NOT NULL REFERENCES seating_layouts(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  section_type VARCHAR(50) NOT NULL CHECK (section_type IN ('vip', 'premium', 'standard', 'general', 'accessible')),
  color VARCHAR(20),
  capacity INT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  available_seats INT NOT NULL,
  position JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sections_layout ON seating_sections(layout_id);
CREATE INDEX idx_sections_type ON seating_sections(section_type);

-- Individual seats
CREATE TABLE IF NOT EXISTS seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES seating_sections(id) ON DELETE CASCADE,
  seat_number VARCHAR(50) NOT NULL,
  row_label VARCHAR(10),
  column_number INT,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'held', 'sold', 'blocked')),
  is_accessible BOOLEAN DEFAULT false,
  position JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(section_id, seat_number)
);

CREATE INDEX idx_seats_section ON seats(section_id);
CREATE INDEX idx_seats_status ON seats(status);
CREATE INDEX idx_seats_accessible ON seats(is_accessible) WHERE is_accessible = true;

-- Seat reservations
CREATE TABLE IF NOT EXISTS seat_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  attendee_id UUID REFERENCES registration_attendees(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'confirmed', 'cancelled', 'expired')),
  held_until TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reservations_seat ON seat_reservations(seat_id);
CREATE INDEX idx_reservations_registration ON seat_reservations(registration_id);
CREATE INDEX idx_reservations_status ON seat_reservations(status);
CREATE INDEX idx_reservations_held_until ON seat_reservations(held_until);

-- Accessibility requests
CREATE TABLE IF NOT EXISTS accessibility_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  requirement_type VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'denied')),
  assigned_seat_id UUID REFERENCES seats(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accessibility_event ON accessibility_requests(event_id);
CREATE INDEX idx_accessibility_user ON accessibility_requests(user_id);
CREATE INDEX idx_accessibility_status ON accessibility_requests(status);

-- Group seating reservations
CREATE TABLE IF NOT EXISTS group_seat_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES seating_sections(id) ON DELETE CASCADE,
  group_booking_id UUID REFERENCES group_bookings(id) ON DELETE SET NULL,
  organizer_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_name VARCHAR(200) NOT NULL,
  requested_seats INT NOT NULL,
  confirmed_seats INT DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'partial', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_group_seats_event ON group_seat_reservations(event_id);
CREATE INDEX idx_group_seats_section ON group_seat_reservations(section_id);

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- Event performance overview
CREATE OR REPLACE VIEW v_event_performance AS
SELECT 
  e.id as event_id,
  e.title as event_name,
  e.start_date,
  COUNT(DISTINCT r.id) as total_registrations,
  SUM(r.total_amount) as total_revenue,
  AVG(r.total_amount) as avg_ticket_price,
  COUNT(DISTINCT CASE WHEN r.status = 'checked_in' THEN r.id END) as checked_in_count,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN r.status = 'checked_in' THEN r.id END) / NULLIF(COUNT(DISTINCT r.id), 0), 2) as attendance_rate
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
GROUP BY e.id, e.title, e.start_date;

-- Marketing funnel conversion
CREATE OR REPLACE VIEW v_funnel_conversion AS
SELECT 
  event_id,
  COUNT(*) FILTER (WHERE stage = 'view') as views,
  COUNT(*) FILTER (WHERE stage = 'click') as clicks,
  COUNT(*) FILTER (WHERE stage = 'registration_started') as started,
  COUNT(*) FILTER (WHERE stage = 'registration_completed') as completed,
  COUNT(*) FILTER (WHERE stage = 'payment_completed') as paid,
  ROUND(100.0 * COUNT(*) FILTER (WHERE stage = 'click') / NULLIF(COUNT(*) FILTER (WHERE stage = 'view'), 0), 2) as view_to_click_rate,
  ROUND(100.0 * COUNT(*) FILTER (WHERE stage = 'registration_completed') / NULLIF(COUNT(*) FILTER (WHERE stage = 'registration_started'), 0), 2) as start_to_complete_rate,
  ROUND(100.0 * COUNT(*) FILTER (WHERE stage = 'payment_completed') / NULLIF(COUNT(*) FILTER (WHERE stage = 'registration_completed'), 0), 2) as complete_to_payment_rate
FROM marketing_funnel
GROUP BY event_id;

-- Email campaign performance
CREATE OR REPLACE VIEW v_campaign_performance AS
SELECT 
  ec.id,
  ec.name,
  ec.event_id,
  e.title as event_name,
  ec.sent_count,
  ec.delivered_count,
  ec.opened_count,
  ec.clicked_count,
  ec.open_rate,
  ec.click_rate,
  ec.sent_at,
  ROUND(100.0 * ec.delivered_count / NULLIF(ec.sent_count, 0), 2) as delivery_rate,
  ROUND(100.0 * ec.unsubscribed_count / NULLIF(ec.delivered_count, 0), 2) as unsubscribe_rate
FROM email_campaigns ec
JOIN events e ON ec.event_id = e.id
WHERE ec.status = 'sent';

-- Seating availability
CREATE OR REPLACE VIEW v_seating_availability AS
SELECT 
  sl.id as layout_id,
  sl.name as layout_name,
  sl.event_id,
  e.title as event_name,
  sl.total_seats,
  COUNT(s.id) as configured_seats,
  COUNT(s.id) FILTER (WHERE s.status = 'available') as available_seats,
  COUNT(s.id) FILTER (WHERE s.status = 'sold') as sold_seats,
  COUNT(s.id) FILTER (WHERE s.status = 'reserved') as reserved_seats,
  COUNT(s.id) FILTER (WHERE s.status = 'held') as held_seats,
  ROUND(100.0 * COUNT(s.id) FILTER (WHERE s.status = 'sold') / NULLIF(sl.total_seats, 0), 2) as occupancy_rate
FROM seating_layouts sl
JOIN events e ON sl.event_id = e.id
LEFT JOIN seating_sections ss ON sl.id = ss.layout_id
LEFT JOIN seats s ON ss.id = s.section_id
GROUP BY sl.id, sl.name, sl.event_id, e.title, sl.total_seats;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Calculate event ROI
CREATE OR REPLACE FUNCTION calculate_event_roi(p_event_id UUID)
RETURNS TABLE (
  revenue NUMERIC,
  costs NUMERIC,
  profit NUMERIC,
  roi_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(r.total_amount), 0) as revenue,
    COALESCE((SELECT SUM(amount) FROM event_expenses WHERE event_id = p_event_id), 0) as costs,
    COALESCE(SUM(r.total_amount), 0) - COALESCE((SELECT SUM(amount) FROM event_expenses WHERE event_id = p_event_id), 0) as profit,
    CASE 
      WHEN COALESCE((SELECT SUM(amount) FROM event_expenses WHERE event_id = p_event_id), 0) > 0
      THEN ROUND(100.0 * (COALESCE(SUM(r.total_amount), 0) - COALESCE((SELECT SUM(amount) FROM event_expenses WHERE event_id = p_event_id), 0)) / COALESCE((SELECT SUM(amount) FROM event_expenses WHERE event_id = p_event_id), 0), 2)
      ELSE 0
    END as roi_percentage
  FROM registrations r
  WHERE r.event_id = p_event_id AND r.payment_status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Release expired seat holds
CREATE OR REPLACE FUNCTION release_expired_seat_holds()
RETURNS INT AS $$
DECLARE
  released_count INT;
BEGIN
  WITH expired_holds AS (
    UPDATE seat_reservations
    SET status = 'expired'
    WHERE status = 'held'
    AND held_until < NOW()
    RETURNING seat_id
  )
  UPDATE seats
  SET status = 'available'
  WHERE id IN (SELECT seat_id FROM expired_holds);
  
  GET DIAGNOSTICS released_count = ROW_COUNT;
  RETURN released_count;
END;
$$ LANGUAGE plpgsql;

-- Auto-schedule follow-up emails
CREATE OR REPLACE FUNCTION trigger_automated_followups()
RETURNS INT AS $$
DECLARE
  sent_count INT := 0;
  followup RECORD;
  target_users RECORD;
BEGIN
  FOR followup IN 
    SELECT * FROM automated_followups WHERE is_active = true
  LOOP
    sent_count := sent_count + 1;
  END LOOP;
  
  RETURN sent_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE attendance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

-- Organizers can view their event analytics
CREATE POLICY "Organizers view own analytics" ON attendance_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = attendance_tracking.event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers view own revenue" ON revenue_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = revenue_analytics.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Email campaigns access
CREATE POLICY "Organizers manage campaigns" ON email_campaigns
  FOR ALL USING (auth.uid() = created_by);

-- Templates access
CREATE POLICY "Public templates viewable" ON event_templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users manage own templates" ON event_templates
  FOR ALL USING (auth.uid() = created_by);

-- Venue access
CREATE POLICY "Users view active venues" ON venues
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users manage own venues" ON venues
  FOR ALL USING (auth.uid() = created_by);

-- Seating access
CREATE POLICY "Anyone can view seating" ON seats
  FOR SELECT USING (true);

CREATE POLICY "Organizers manage seating" ON seats
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM seating_layouts sl
      JOIN events e ON sl.event_id = e.id
      JOIN seating_sections ss ON sl.id = ss.layout_id
      WHERE ss.id = seats.section_id
      AND e.organizer_id = auth.uid()
    )
  );

-- Marketing funnel tracking
CREATE POLICY "Organizers view own funnel" ON marketing_funnel
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = marketing_funnel.event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can track funnel" ON marketing_funnel
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users view own funnel entries" ON marketing_funnel
  FOR SELECT USING (user_id = auth.uid());

-- Email templates access
CREATE POLICY "Organizers manage own templates" ON email_templates
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Users view public templates" ON email_templates
  FOR SELECT USING (is_public = true);

-- Audience segments access
CREATE POLICY "Organizers manage own segments" ON audience_segments
  FOR ALL USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = audience_segments.event_id
      AND events.organizer_id = auth.uid()
    )
  );
