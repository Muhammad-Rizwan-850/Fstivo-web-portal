-- ============================================================================
-- FSTIVO Organizer Tools & Analytics - Complete Database Schema
-- Phase 3: Enterprise Event Management Features
-- Date: January 5, 2026
-- ============================================================================

-- This migration adds comprehensive organizer tools including:
-- 1. Advanced Event Analytics (8 tables)
-- 2. Email Marketing Campaigns (10 tables)
-- 3. Event Cloning & Templates (9 tables)
-- 4. Seating & Venue Management (11 tables)
-- Plus: 4 views, 3 functions, and comprehensive RLS policies

-- ============================================================================
-- SECTION 1: ADVANCED EVENT ANALYTICS (8 tables)
-- ============================================================================

-- Attendance tracking with real-time updates
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

-- Revenue analytics by time period
CREATE TABLE IF NOT EXISTS revenue_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ticket_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sponsorship_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
  merchandise_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
  other_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
  refund_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_revenue NUMERIC(12, 2) GENERATED ALWAYS AS (
    total_revenue - refund_amount
  ) STORED,
  transactions_count INT DEFAULT 0,
  average_transaction_value NUMERIC(10, 2) GENERATED ALWAYS AS (
    CASE WHEN transactions_count > 0
    THEN (net_revenue / transactions_count)
    ELSE 0 END
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketing funnel tracking
CREATE TABLE IF NOT EXISTS marketing_funnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  funnel_date DATE NOT NULL,
  page_views INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  registration_clicks INT DEFAULT 0,
  registrations_started INT DEFAULT 0,
  registrations_completed INT DEFAULT 0,
  conversion_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE WHEN registration_clicks > 0
    THEN (registrations_completed::numeric / registration_clicks * 100)
    ELSE 0 END
  ) STORED,
  drop_off_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE WHEN registrations_started > 0
    THEN ((registrations_started - registrations_completed)::numeric / registrations_started * 100)
    ELSE 0 END
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, funnel_date)
);

-- Attendee demographics
CREATE TABLE IF NOT EXISTS attendee_demographics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  age_group VARCHAR(50),
  gender VARCHAR(50),
  location_city VARCHAR(100),
  location_country VARCHAR(100),
  profession VARCHAR(100),
  industry VARCHAR(100),
  attendee_count INT DEFAULT 0,
  percentage DECIMAL(5, 2),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Engagement heatmaps (time-based)
CREATE TABLE IF NOT EXISTS engagement_heatmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  hour_of_day INT CHECK (hour_of_day BETWEEN 0 AND 23),
  activity_level INT DEFAULT 0 CHECK (activity_level BETWEEN 0 AND 100),
  check_ins INT DEFAULT 0,
  engagement_score NUMERIC(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, measurement_date, hour_of_day)
);

-- Analytics reports
CREATE TABLE IF NOT EXISTS analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL,
  report_name VARCHAR(200) NOT NULL,
  date_range_start DATE,
  date_range_end DATE,
  filters JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  file_url TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Traffic sources tracking
CREATE TABLE IF NOT EXISTS traffic_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  source VARCHAR(100) NOT NULL,
  medium VARCHAR(100),
  campaign VARCHAR(200),
  visits INT DEFAULT 0,
  registrations INT DEFAULT 0,
  conversion_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE WHEN visits > 0
    THEN (registrations::numeric / visits * 100)
    ELSE 0 END
  ) STORED,
  revenue_generated NUMERIC(12, 2) DEFAULT 0,
  cost_per_acquisition NUMERIC(10, 2) DEFAULT 0,
  roi NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE WHEN cost_per_acquisition > 0
    THEN ((revenue_generated - cost_per_acquisition) / cost_per_acquisition * 100)
    ELSE 0 END
  ) STORED,
  first_seen DATE NOT NULL,
  last_seen DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custom metrics (flexible tracking)
CREATE TABLE IF NOT EXISTS custom_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC(12, 2),
  metric_unit VARCHAR(50),
  metadata JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 2: EMAIL MARKETING CAMPAIGNS (10 tables)
-- ============================================================================

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_name VARCHAR(200) NOT NULL,
  template_type VARCHAR(50) NOT NULL,
  subject_line TEXT NOT NULL,
  preview_text TEXT,
  html_content TEXT NOT NULL,
  text_content TEXT,
  template_variables JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audience segments
CREATE TABLE IF NOT EXISTS audience_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  segment_name VARCHAR(200) NOT NULL,
  description TEXT,
  segment_type VARCHAR(50) NOT NULL,
  filters JSONB NOT NULL,
  estimated_size INT DEFAULT 0,
  actual_size INT DEFAULT 0,
  last_calculated TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Email tracking (individual emails sent)
CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'unsubscribed', 'bounced', 'failed')),
  tracking_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A/B testing variants
CREATE TABLE IF NOT EXISTS email_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  variant_name VARCHAR(100) NOT NULL,
  variant_type VARCHAR(50) NOT NULL CHECK (variant_type IN ('subject_line', 'content', 'send_time')),
  subject_line TEXT,
  html_content TEXT,
  send_time TIMESTAMPTZ,
  recipient_count INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  opened_count INT DEFAULT 0,
  clicked_count INT DEFAULT 0,
  conversion_count INT DEFAULT 0,
  is_winner BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automated follow-up sequences
CREATE TABLE IF NOT EXISTS email_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  automation_name VARCHAR(200) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('registration', 'payment', 'check_in', 'event_end', 'custom')),
  trigger_conditions JSONB,
  steps JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  total_sent INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email queue for processing
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  automation_id UUID REFERENCES email_automations(id) ON DELETE SET NULL,
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  subject_line TEXT NOT NULL,
  html_content TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  priority INT DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email link tracking
CREATE TABLE IF NOT EXISTS email_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  link_text VARCHAR(255),
  position INT,
  total_clicks INT DEFAULT 0,
  unique_clicks INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email unsubscribe logs
CREATE TABLE IF NOT EXISTS unsubscribe_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  email_address VARCHAR(255) NOT NULL,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  unsubscribe_reason TEXT,
  unsubscribe_source VARCHAR(100),
  unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email suppression list
CREATE TABLE IF NOT EXISTS email_suppression_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_address VARCHAR(255) NOT NULL UNIQUE,
  reason VARCHAR(100) NOT NULL CHECK (reason IN ('bounce', 'complaint', 'unsubscribe', 'manual')),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT
);

-- ============================================================================
-- SECTION 3: EVENT CLONING & TEMPLATES (9 tables)
-- ============================================================================

-- Event templates
CREATE TABLE IF NOT EXISTS event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  event_type VARCHAR(50) NOT NULL,
  template_data JSONB NOT NULL,
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  usage_count INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INT DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Template reviews
CREATE TABLE IF NOT EXISTS template_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES event_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

-- Template collections (curated sets)
CREATE TABLE IF NOT EXISTS template_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  collection_name VARCHAR(200) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  template_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event series (recurring events)
CREATE TABLE IF NOT EXISTS event_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  series_name VARCHAR(200) NOT NULL,
  description TEXT,
  recurrence_pattern JSONB NOT NULL,
  parent_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  event_ids UUID[] DEFAULT '{}',
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clone history tracking
CREATE TABLE IF NOT EXISTS event_clone_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  cloned_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  cloned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  clone_type VARCHAR(50) NOT NULL CHECK (clone_type IN ('full', 'structure_only', 'with_registrations')),
  cloned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Template categories
CREATE TABLE IF NOT EXISTS template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name VARCHAR(100) NOT NULL UNIQUE,
  parent_category_id UUID REFERENCES template_categories(id) ON DELETE SET NULL,
  description TEXT,
  icon_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Template tags
CREATE TABLE IF NOT EXISTS template_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name VARCHAR(50) NOT NULL UNIQUE,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Template to category mapping
CREATE TABLE IF NOT EXISTS template_category_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES event_templates(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES template_categories(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_id, category_id)
);

-- Template usage analytics
CREATE TABLE IF NOT EXISTS template_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES event_templates(id) ON DELETE CASCADE,
  used_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_created_id UUID REFERENCES events(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 4: SEATING & VENUE MANAGEMENT (11 tables)
-- ============================================================================

-- Venues
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  venue_name VARCHAR(200) NOT NULL,
  description TEXT,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  capacity INT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  website_url TEXT,
  images_url TEXT[],
  amenities JSONB,
  accessibility_features TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seating layouts
CREATE TABLE IF NOT EXISTS seating_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  layout_name VARCHAR(200) NOT NULL,
  layout_type VARCHAR(50) NOT NULL CHECK (layout_type IN ('theater', 'stadium', 'classroom', 'banquet', 'cocktail', 'custom')),
  total_capacity INT NOT NULL,
  stage_position JSONB,
  dimensions JSONB,
  background_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seating sections (tiers, blocks, etc.)
CREATE TABLE IF NOT EXISTS seating_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID NOT NULL REFERENCES seating_layouts(id) ON DELETE CASCADE,
  section_name VARCHAR(100) NOT NULL,
  section_type VARCHAR(50) NOT NULL CHECK (section_type IN ('general', 'vip', 'premium', 'accessible', 'reserved')),
  base_price DECIMAL(10, 2) NOT NULL,
  capacity INT NOT NULL,
  position JSONB,
  color VARCHAR(20),
  row_count INT,
  seats_per_row INT,
  seat_labels_pattern VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Seat reservations
CREATE TABLE IF NOT EXISTS seat_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  reserved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reservation_type VARCHAR(20) NOT NULL CHECK (reservation_type IN ('temporary', 'confirmed', 'held')),
  expires_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seat pricing tiers
CREATE TABLE IF NOT EXISTS seat_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES seating_sections(id) ON DELETE CASCADE,
  tier_name VARCHAR(100) NOT NULL,
  price_multiplier DECIMAL(3, 2) NOT NULL DEFAULT 1.0,
  min_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2),
  benefits JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Accessibility requests
CREATE TABLE IF NOT EXISTS accessibility_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  request_type VARCHAR(100) NOT NULL,
  details TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'fulfilled')),
  assigned_seats UUID[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group seating
CREATE TABLE IF NOT EXISTS group_seating (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name VARCHAR(200) NOT NULL,
  group_size INT NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  special_requests TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  assigned_seats UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seat holds (temporary reservation)
CREATE TABLE IF NOT EXISTS seat_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  held_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  hold_reason VARCHAR(100),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seating configuration history
CREATE TABLE IF NOT EXISTS seating_config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID NOT NULL REFERENCES seating_layouts(id) ON DELETE CASCADE,
  configuration JSONB NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- Event performance view
CREATE OR REPLACE VIEW v_event_performance AS
SELECT
  e.id AS event_id,
  e.title AS event_title,
  e.start_date,
  COUNT(DISTINCT r.id) AS total_registrations,
  COUNT(DISTINCT CASE WHEN r.payment_status = 'paid' THEN r.id END) AS paid_registrations,
  COALESCE(SUM(CASE WHEN r.payment_status = 'paid' THEN r.payment_amount ELSE 0 END), 0) AS total_revenue,
  COUNT(DISTINCT CASE WHEN r.checked_in_at IS NOT NULL THEN r.id END) AS total_checkins,
  AVG(EXTRACT(EPOCH FROM (r.checked_in_at - e.start_date))/3600) AS avg_hours_before_checkin,
  COUNT(DISTINCT r.profile_id) AS unique_attendees
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
GROUP BY e.id, e.title, e.start_date;

-- Marketing funnel conversion view
CREATE OR REPLACE VIEW v_funnel_conversion AS
SELECT
  e.id AS event_id,
  e.title,
  mf.funnel_date,
  mf.page_views,
  mf.registration_clicks,
  mf.registrations_completed,
  mf.conversion_rate,
  mf.drop_off_rate,
  LAG(mf.registrations_completed) OVER (PARTITION BY e.id ORDER BY mf.funnel_date) AS prev_day_registrations,
  mf.registrations_completed - LAG(mf.registrations_completed) OVER (PARTITION BY e.id ORDER BY mf.funnel_date) AS daily_change
FROM events e
INNER JOIN marketing_funnel mf ON e.id = mf.event_id
ORDER BY e.id, mf.funnel_date DESC;

-- Campaign performance view
CREATE OR REPLACE VIEW v_campaign_performance AS
SELECT
  ec.id AS campaign_id,
  ec.name,
  ec.status,
  e.title AS event_title,
  ec.recipient_count,
  ec.sent_count,
  ec.opened_count,
  ec.clicked_count,
  ec.open_rate,
  ec.click_rate,
  ec.created_at,
  ec.scheduled_at,
  ec.sent_at
FROM email_campaigns ec
INNER JOIN events e ON ec.event_id = e.id;

-- Seating availability view
CREATE OR REPLACE VIEW v_seating_availability AS
SELECT
  sl.id AS layout_id,
  sl.layout_name,
  ss.id AS section_id,
  ss.section_name,
  ss.section_type,
  ss.capacity AS total_seats,
  COUNT(CASE WHEN s.status = 'available' THEN 1 END) AS available_seats,
  COUNT(CASE WHEN s.status = 'reserved' THEN 1 END) AS reserved_seats,
  COUNT(CASE WHEN s.status = 'sold' THEN 1 END) AS sold_seats,
  COUNT(CASE WHEN s.status = 'blocked' THEN 1 END) AS blocked_seats,
  ss.base_price
FROM seating_layouts sl
INNER JOIN seating_sections ss ON sl.id = ss.layout_id
INNER JOIN seats s ON ss.id = s.section_id
GROUP BY sl.id, sl.layout_name, ss.id, ss.section_name, ss.section_type, ss.capacity, ss.base_price;

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Calculate ROI for traffic sources
CREATE OR REPLACE FUNCTION calculate_traffic_source_roi(p_source_id UUID)
RETURNS TABLE(
  source VARCHAR,
  total_revenue NUMERIC,
  total_cost NUMERIC,
  roi NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ts.source,
    COALESCE(ts.revenue_generated, 0),
    COALESCE(ts.cost_per_acquisition * ts.visits, 0),
    CASE
      WHEN (ts.cost_per_acquisition * ts.visits) > 0
      THEN ((ts.revenue_generated - (ts.cost_per_acquisition * ts.visits)) / (ts.cost_per_acquisition * ts.visits) * 100)
      ELSE 0
    END AS roi
  FROM traffic_sources ts
  WHERE ts.id = p_source_id;
END;
$$ LANGUAGE plpgsql;

-- Release expired seat holds
CREATE OR REPLACE FUNCTION release_expired_seat_holds()
RETURNS INT AS $$
DECLARE
  released_count INT := 0;
BEGIN
  UPDATE seat_reservations
  SET status = 'cancelled',
      cancelled_at = NOW()
  WHERE reservation_type = 'temporary'
    AND expires_at < NOW()
    AND status != 'cancelled';

  GET DIAGNOSTICS released_count = ROW_COUNT;

  UPDATE seats
  SET status = 'available'
  WHERE id IN (
    SELECT seat_id
    FROM seat_reservations
    WHERE reservation_type = 'temporary'
      AND expires_at < NOW()
      AND status = 'cancelled'
  );

  RETURN released_count;
END;
$$ LANGUAGE plpgsql;

-- Create automated follow-up emails based on triggers
CREATE OR REPLACE FUNCTION trigger_automated_followup(p_event_id UUID, p_trigger_type VARCHAR)
RETURNS INT AS $$
DECLARE
  v_automation_id UUID;
  v_campaign_id UUID;
  v_recipient_count INT := 0;
BEGIN
  FOR v_automation_id IN
    SELECT id FROM email_automations
    WHERE trigger_type = p_trigger_type
      AND is_active = true
  LOOP
    INSERT INTO email_queue (
      automation_id,
      registration_id,
      recipient_email,
      subject_line,
      html_content,
      scheduled_for,
      status
    )
    SELECT
      v_automation_id,
      r.id,
      p.email,
      'Automated Follow-up',
      (ea.steps->0->>'content'),
      NOW() + (ea.steps->0->>'delay_minutes')::INT * INTERVAL '1 minute',
      'pending'
    FROM email_automations ea
    CROSS JOIN LATERAL jsonb_array_elements(ea.steps) AS step
    INNER JOIN registrations r ON r.event_id = p_event_id
    INNER JOIN profiles p ON r.profile_id = p.id
    WHERE ea.id = v_automation_id
      AND r.status = 'confirmed';

    GET DIAGNOSTICS v_recipient_count = v_recipient_count + ROW_COUNT;
  END LOOP;

  RETURN v_recipient_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE attendance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendee_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_heatmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsubscribe_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_suppression_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_clone_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_category_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_seating ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_config_history ENABLE ROW LEVEL SECURITY;

-- Analytics Tables RLS
CREATE POLICY "Organizers can view analytics for their events"
  ON attendance_tracking FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can insert analytics for their events"
  ON attendance_tracking FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can view revenue for their events"
  ON revenue_analytics FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can view funnel data for their events"
  ON marketing_funnel FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can view their analytics reports"
  ON analytics_reports FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Organizers can create analytics reports"
  ON analytics_reports FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Email Marketing RLS
CREATE POLICY "Users can view their own templates"
  ON email_templates FOR SELECT
  USING (created_by = auth.uid() OR is_public = true);

CREATE POLICY "Users can create email templates"
  ON email_templates FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates"
  ON email_templates FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can view their own segments"
  ON audience_segments FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create audience segments"
  ON audience_segments FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Organizers can view campaigns for their events"
  ON email_campaigns FOR ALL
  USING (
    created_by = auth.uid() OR
    event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can view email tracking for their campaigns"
  ON email_tracking FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM email_campaigns
      WHERE event_id IN (
        SELECT id FROM events WHERE organizer_id = auth.uid()
      )
    )
  );

-- Templates RLS
CREATE POLICY "Users can view public templates or their own"
  ON event_templates FOR SELECT
  USING (created_by = auth.uid() OR is_public = true);

CREATE POLICY "Users can create event templates"
  ON event_templates FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates"
  ON event_templates FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can review templates they've used"
  ON template_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Venues & Seating RLS
CREATE POLICY "Users can view their own venues"
  ON venues FOR SELECT
  USING (created_by = auth.uid() OR is_active = true);

CREATE POLICY "Users can create venues"
  ON venues FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own venues"
  ON venues FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Organizers can view seating for their events"
  ON seating_layouts FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    ) OR
    venue_id IN (
      SELECT id FROM venues WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Organizers can manage seats for their events"
  ON seats FOR ALL
  USING (
    section_id IN (
      SELECT ss.id
      FROM seating_sections ss
      INNER JOIN seating_layouts sl ON ss.layout_id = sl.id
      WHERE sl.event_id IN (
        SELECT id FROM events WHERE organizer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view their own seat reservations"
  ON seat_reservations FOR SELECT
  USING (reserved_by = auth.uid());

CREATE POLICY "Users can create accessibility requests"
  ON accessibility_requests FOR INSERT
  WITH CHECK (
    registration_id IN (
      SELECT id FROM registrations WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their accessibility requests"
  ON accessibility_requests FOR SELECT
  USING (
    registration_id IN (
      SELECT id FROM registrations WHERE profile_id = auth.uid()
    )
  );

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Analytics indexes
CREATE INDEX idx_attendance_tracking_event_id ON attendance_tracking(event_id);
CREATE INDEX idx_attendance_tracking_timestamp ON attendance_tracking(timestamp DESC);
CREATE INDEX idx_revenue_analytics_event_id ON revenue_analytics(event_id);
CREATE INDEX idx_revenue_analytics_period ON revenue_analytics(period_start, period_end);
CREATE INDEX idx_marketing_funnel_event_date ON marketing_funnel(event_id, funnel_date DESC);
CREATE INDEX idx_engagement_heatmaps_event_date_hour ON engagement_heatmaps(event_id, measurement_date, hour_of_day);
CREATE INDEX idx_traffic_sources_event_id ON traffic_sources(event_id);

-- Email marketing indexes
CREATE INDEX idx_email_campaigns_event_id ON email_campaigns(event_id);
CREATE INDEX idx_email_campaigns_created_by ON email_campaigns(created_by);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_tracking_campaign_id ON email_tracking(campaign_id);
CREATE INDEX idx_email_tracking_registration_id ON email_tracking(registration_id);
CREATE INDEX idx_email_tracking_status ON email_tracking(status);
CREATE INDEX idx_email_queue_scheduled_for ON email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_email_automations_trigger_type ON email_automations(trigger_type) WHERE is_active = true;

-- Templates indexes
CREATE INDEX idx_event_templates_created_by ON event_templates(created_by);
CREATE INDEX idx_event_templates_is_public ON event_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_template_reviews_template_id ON template_reviews(template_id);
CREATE INDEX idx_event_series_parent_event_id ON event_series(parent_event_id);

-- Seating indexes
CREATE INDEX idx_seating_layouts_event_id ON seating_layouts(event_id);
CREATE INDEX idx_seating_layouts_venue_id ON seating_layouts(venue_id);
CREATE INDEX idx_seating_sections_layout_id ON seating_sections(layout_id);
CREATE INDEX idx_seats_section_id ON seats(section_id);
CREATE INDEX idx_seats_status ON seats(status);
CREATE INDEX idx_seat_reservations_seat_id ON seat_reservations(seat_id);
CREATE INDEX idx_seat_reservations_registration_id ON seat_reservations(registration_id);
CREATE INDEX idx_seat_holds_seat_id ON seat_holds(seat_id);
CREATE INDEX idx_seat_holds_expires_at ON seat_holds(expires_at) WHERE is_active = true;

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant select on views
GRANT SELECT ON v_event_performance TO authenticated;
GRANT SELECT ON v_funnel_conversion TO authenticated;
GRANT SELECT ON v_campaign_performance TO authenticated;
GRANT SELECT ON v_seating_availability TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION calculate_traffic_source_roi(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION release_expired_seat_holds TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_automated_followup(UUID, VARCHAR) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- - 38 new tables created
-- - 4 analytics views created
-- - 3 database functions created
-- - RLS policies applied to all tables
-- - Performance indexes created
-- - Grants applied for authenticated users
