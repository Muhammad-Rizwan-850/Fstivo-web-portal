-- ============================================================================
-- International Conference Directory Migration
-- Fstivo Global Expansion - Partnership Tracking & Satellite Event Management
-- ============================================================================

-- International Conferences Table
CREATE TABLE IF NOT EXISTS international_conferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(300) NOT NULL,
  acronym VARCHAR(50),
  description TEXT,

  -- Organization Details
  organizing_body VARCHAR(300),
  website_url VARCHAR(500),
  contact_email VARCHAR(255),
  contact_person VARCHAR(255),

  -- Conference Details
  conference_type VARCHAR(50) NOT NULL, -- 'academic', 'professional', 'exhibition', 'summit'
  field_id UUID REFERENCES event_fields(id),
  category_id UUID REFERENCES event_categories(id),

  -- Location & Schedule
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  venue VARCHAR(300),
  is_virtual BOOLEAN DEFAULT false,
  virtual_platform VARCHAR(200),

  -- Typical Schedule (for recurring conferences)
  typical_month INT, -- Month when usually held (1-12)
  frequency VARCHAR(50), -- 'annual', 'bi-annual', 'quarterly'
  next_conf_date DATE,
  next_conf_deadline DATE,

  -- Scale
  typical_attendees INT,
  typical_countries INT,
  is_global BOOLEAN DEFAULT false,

  -- Opportunities
  has_student_volunteers BOOLEAN DEFAULT false,
  has_call_for_papers BOOLEAN DEFAULT false,
  has_sponsorship BOOLEAN DEFAULT false,
  has_exhibitions BOOLEAN DEFAULT false,
  has_satellite_opportunities BOOLEAN DEFAULT false,

  -- Partnership Tracking
  partnership_status VARCHAR(50) DEFAULT 'none', -- 'none', 'contacted', 'in_discussion', 'partnered', 'rejected', 'satellite_confirmed'
  partnership_tier VARCHAR(50), -- 'bronze', 'silver', 'gold', 'platinum'
  partnership_date DATE,
  partnership_notes TEXT,

  -- Fstivo Integration
  fstivo_contact_id UUID REFERENCES users(id),
  last_contact_date DATE,
  next_follow_up DATE,
  contact_count INT DEFAULT 0,

  -- Satellite Event Tracking
  satellite_events_hosted INT DEFAULT 0,
  total_satellite_attendees INT DEFAULT 0,

  -- Metadata
  logo_url VARCHAR(500),
  banner_image_url VARCHAR(500),
  established_year INT,
  social_media JSONB, -- { twitter, linkedin, facebook, instagram }

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Conference Partnerships Table
CREATE TABLE IF NOT EXISTS conference_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID REFERENCES international_conferences(id) ON DELETE CASCADE,

  -- Partnership Details
  partnership_type VARCHAR(100) NOT NULL, -- 'satellite_event', 'sponsorship', 'media_partner', 'content_partner', 'recruitment'
  status VARCHAR(50) DEFAULT 'prospect', -- 'prospect', 'contacted', 'negotiating', 'confirmed', 'active', 'completed', 'cancelled'

  -- Terms
  start_date DATE,
  end_date DATE,
  agreement_type VARCHAR(50), -- 'formal', 'informal', 'MOU'
  revenue_share DECIMAL(5,2), -- Percentage if applicable

  -- Responsibilities
  fstivo_responsibilities TEXT[],
  partner_responsibilities TEXT[],

  -- Financials
  upfront_payment DECIMAL(12,2),
  expected_revenue DECIMAL(12,2),
  actual_revenue DECIMAL(12,2),

  -- Satellite Event Specific
  satellite_event_id UUID REFERENCES events(id),
  satellite_capacity INT,
  satellite_registrations INT DEFAULT 0,

  -- Communication
  partner_contact_name VARCHAR(255),
  partner_contact_email VARCHAR(255),
  partner_contact_phone VARCHAR(50),

  -- Tracking
  last_contact_date DATE,
  next_action TEXT,
  next_action_date DATE,

  -- Notes
  notes TEXT,
  documents JSONB, -- { proposal, contract, MOU, etc. }

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Satellite Events Table (extends events table)
CREATE TABLE IF NOT EXISTS satellite_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_conference_id UUID REFERENCES international_conferences(id),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,

  -- Satellite Details
  satellite_type VARCHAR(100), -- 'watch_party', 'local_workshop', 'regional_meetup', 'university_chapter'
  theme VARCHAR(300),
  customization_details TEXT,

  -- Host Details
  host_university VARCHAR(300),
  host_organization VARCHAR(300),
  host_coordinator_id UUID REFERENCES users(id),

  -- Logistics
  venue_capacity INT,
  expected_attendees INT,
  actual_attendees INT DEFAULT 0,
  streaming_url VARCHAR(500),

  -- Content
  sessions_broadcasted INT[],
  local_sessions_count INT DEFAULT 0,

  -- Partnership
  partnership_id UUID REFERENCES conference_partnerships(id),
  approval_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approval_date DATE,
  brand_guidelines_url VARCHAR(500),

  -- Financial
  budget DECIMAL(12,2),
  sponsorship_amount DECIMAL(12,2),
  ticket_revenue DECIMAL(12,2) DEFAULT 0,

  -- Metrics
  satisfaction_score DECIMAL(3,2),
  nps_score INT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conference Activity Log
CREATE TABLE IF NOT EXISTS conference_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID REFERENCES international_conferences(id) ON DELETE CASCADE,
  partnership_id UUID REFERENCES conference_partnerships(id) ON DELETE CASCADE,

  activity_type VARCHAR(100) NOT NULL, -- 'email_sent', 'call_made', 'meeting_scheduled', 'meeting_completed', 'proposal_sent', 'contract_signed', 'satellite_hosted'
  activity_date TIMESTAMPTZ DEFAULT NOW(),

  title VARCHAR(300),
  description TEXT,
  outcome TEXT,

  -- Follow-up
  requires_follow_up BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_task TEXT,

  -- Documents
  attachments JSONB,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_international_conferences_country ON international_conferences(country);
CREATE INDEX idx_international_conferences_field_id ON international_conferences(field_id);
CREATE INDEX idx_international_conferences_partnership_status ON international_conferences(partnership_status);
CREATE INDEX idx_international_conferences_next_conf_date ON international_conferences(next_conf_date);
CREATE INDEX idx_international_conferences_is_global ON international_conferences(is_global);

CREATE INDEX idx_conference_partnerships_conference_id ON conference_partnerships(conference_id);
CREATE INDEX idx_conference_partnerships_status ON conference_partnerships(status);
CREATE INDEX idx_conference_partnerships_type ON conference_partnerships(partnership_type);

CREATE INDEX idx_satellite_events_parent_conference_id ON satellite_events(parent_conference_id);
CREATE INDEX idx_satellite_events_event_id ON satellite_events(event_id);
CREATE INDEX idx_satellite_events_approval_status ON satellite_events(approval_status);

CREATE INDEX idx_conference_activity_log_conference_id ON conference_activity_log(conference_id);
CREATE INDEX idx_conference_activity_log_activity_date ON conference_activity_log(activity_date);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update conference partnership contact count
CREATE OR REPLACE FUNCTION increment_conference_contact_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE international_conferences
  SET contact_count = contact_count + 1,
      last_contact_date = NEW.activity_date::DATE
  WHERE id = NEW.conference_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment contact count when activity is logged
CREATE TRIGGER increment_conference_contact_count_trigger
  AFTER INSERT ON conference_activity_log
  FOR EACH ROW
  WHEN (NEW.activity_type IN ('email_sent', 'call_made', 'meeting_completed'))
  EXECUTE FUNCTION increment_conference_contact_count();

-- Function to update satellite event attendees
CREATE OR REPLACE FUNCTION update_satellite_attendees()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE satellite_events
  SET actual_attendees = (
    SELECT COUNT(*)
    FROM registrations
    WHERE event_id = NEW.event_id AND checked_in_at IS NOT NULL
  )
  WHERE event_id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE international_conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE satellite_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies for international_conferences
CREATE POLICY "Anyone can view international conferences"
  ON international_conferences FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create conferences"
  ON international_conferences FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update conferences they created"
  ON international_conferences FOR UPDATE
  USING (fstivo_contact_id = auth.uid());

-- Policies for conference_partnerships
CREATE POLICY "Anyone can view partnerships"
  ON conference_partnerships FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create partnerships"
  ON conference_partnerships FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update partnerships they created"
  ON conference_partnerships FOR UPDATE
  USING (created_by = auth.uid());

-- Policies for satellite_events
CREATE POLICY "Anyone can view satellite events"
  ON satellite_events FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create satellite events"
  ON satellite_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update satellite events they coordinate"
  ON satellite_events FOR UPDATE
  USING (host_coordinator_id = auth.uid());

-- Policies for conference_activity_log
CREATE POLICY "Users can view activity logs for conferences they manage"
  ON conference_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM international_conferences
      WHERE id = conference_activity_log.conference_id
      AND fstivo_contact_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activity logs"
  ON conference_activity_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for active partnership opportunities
CREATE OR REPLACE VIEW active_partnership_opportunities AS
SELECT
  ic.id,
  ic.name,
  ic.acronym,
  ic.country,
  ic.conference_type,
  ic.next_conf_date,
  ic.typical_attendees,
  ic.has_satellite_opportunities,
  ic.partnership_status,
  ec.name as category_name,
  ec.icon as category_icon,
  ef.name as field_name,
  ic.contact_email,
  ic.website_url
FROM international_conferences ic
LEFT JOIN event_categories ec ON ic.category_id = ec.id
LEFT JOIN event_fields ef ON ic.field_id = ef.id
WHERE ic.deleted_at IS NULL
  AND ic.partnership_status NOT IN ('rejected', 'partnered')
ORDER BY ic.next_conf_date ASC NULLS LAST;

-- View for upcoming conferences with partnerships
CREATE OR REPLACE VIEW upcoming_partner_conferences AS
SELECT
  ic.id,
  ic.name,
  ic.acronym,
  ic.country,
  ic.city,
  ic.next_conf_date,
  ic.partnership_status,
  ic.partnership_tier,
  COUNT(DISTINCT se.id) as satellite_count,
  SUM(se.actual_attendees) as total_satellite_attendees
FROM international_conferences ic
LEFT JOIN satellite_events se ON ic.id = se.parent_conference_id
WHERE ic.deleted_at IS NULL
  AND ic.partnership_status = 'partnered'
  AND ic.next_conf_date >= CURRENT_DATE
GROUP BY ic.id
ORDER BY ic.next_conf_date ASC;

-- View for partnership pipeline
CREATE OR REPLACE VIEW partnership_pipeline AS
SELECT
  cp.id,
  cp.partnership_type,
  cp.status,
  ic.name as conference_name,
  ic.country,
  cp.expected_revenue,
  cp.actual_revenue,
  cp.start_date,
  cp.next_action,
  cp.next_action_date,
  ec.name as category_name
FROM conference_partnerships cp
JOIN international_conferences ic ON cp.conference_id = ic.id
LEFT JOIN event_categories ec ON ic.category_id = ec.id
WHERE cp.status NOT IN ('completed', 'cancelled')
ORDER BY
  CASE cp.status
    WHEN 'prospect' THEN 1
    WHEN 'contacted' THEN 2
    WHEN 'negotiating' THEN 3
    WHEN 'confirmed' THEN 4
    WHEN 'active' THEN 5
  END,
  cp.next_action_date ASC NULLS LAST;

-- ============================================================================
-- INITIAL DATA - SAMPLE INTERNATIONAL CONFERENCES
-- ============================================================================

-- Insert sample international conferences
INSERT INTO international_conferences (name, acronym, organizing_body, conference_type, category_id, field_id, country, city, typical_month, frequency, typical_attendees, typical_countries, is_global, has_student_volunteers, has_call_for_papers, has_sponsorship, has_satellite_opportunities, partnership_status, website_url) VALUES
-- Healthcare
('American Society of Health-System Pharmacists', 'ASHP', 'ASHP', 'professional', (SELECT id FROM event_categories WHERE slug = 'healthcare'), (SELECT id FROM event_fields WHERE slug = 'pharmacy'), 'United States', 'Various', 12, 'annual', 25000, 50, true, true, true, true, true, 'none', 'https://www.ashp.org'),
('International Pharmaceutical Federation', 'FIP', 'FIP', 'professional', (SELECT id FROM event_categories WHERE slug = 'healthcare'), (SELECT id FROM event_fields WHERE slug = 'pharmacy'), 'Netherlands', 'Various', 9, 'annual', 3000, 120, true, true, true, true, true, 'none', 'https://www.fip.org'),
('Healthcare Information and Management Systems Society', 'HIMSS', 'HIMSS', 'professional', (SELECT id FROM event_categories WHERE slug = 'healthcare'), (SELECT id FROM event_fields WHERE slug = 'health-tech'), 'United States', 'Various', 3, 'annual', 45000, 80, true, true, true, true, true, 'none', 'https://www.himss.org'),

-- Technology
('AWS re:Invent', 're:Invent', 'Amazon Web Services', 'professional', (SELECT id FROM event_categories WHERE slug = 'technology'), (SELECT id FROM event_fields WHERE slug = 'cloud-devops'), 'United States', 'Las Vegas', 12, 'annual', 60000, 150, true, true, true, true, true, 'none', 'https://reinvent.awsevents.com'),
('Google I/O', 'I/O', 'Google', 'professional', (SELECT id FROM event_categories WHERE slug = 'technology'), (SELECT id FROM event_fields WHERE slug = 'software-dev'), 'United States', 'Mountain View', 5, 'annual', 10000, 100, true, true, true, true, true, 'none', 'https://io.google'),
('Microsoft Build', 'Build', 'Microsoft', 'professional', (SELECT id FROM event_categories WHERE slug = 'technology'), (SELECT id FROM event_fields WHERE slug = 'software-dev'), 'United States', 'Seattle', 5, 'annual', 25000, 120, true, true, true, true, true, 'none', 'https://build.microsoft.com'),

-- Business
('World Economic Forum', 'WEF', 'WEF', 'summit', (SELECT id FROM event_categories WHERE slug = 'business'), (SELECT id FROM event_fields WHERE slug = 'management'), 'Switzerland', 'Davos', 1, 'annual', 3000, 150, true, false, false, true, true, 'none', 'https://www.weforum.org'),
('TED Global', 'TED', 'TED Conferences', 'professional', (SELECT id FROM event_categories WHERE slug = 'arts-design'), (SELECT id FROM event_fields WHERE slug = 'media-arts'), 'Various', 'Various', null, 'quarterly', 1500, 80, true, false, true, true, true, 'none', 'https://www.ted.com'),

-- Sciences
('AAAS Annual Meeting', 'AAAS', 'American Association for the Advancement of Science', 'academic', (SELECT id FROM event_categories WHERE slug = 'sciences'), (SELECT id FROM event_fields WHERE slug = 'biology'), 'United States', 'Various', 2, 'annual', 10000, 60, true, true, true, true, true, 'none', 'https://www.aaas.org'),
('International Conference on Machine Learning', 'ICML', 'ICML', 'academic', (SELECT id FROM event_categories WHERE slug = 'technology'), (SELECT id FROM event_fields WHERE slug = 'data-ai'), 'Various', 'Various', 7, 'annual', 5000, 80, true, true, true, true, true, 'none', 'https://icml.cc')

ON CONFLICT DO NOTHING;

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
