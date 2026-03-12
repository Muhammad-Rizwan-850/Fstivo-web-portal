-- ============================================================================
-- FSTIVO: VOLUNTEER, CERTIFICATION & CORPORATE SYSTEMS
-- Migration: 002_volunteer_certification_corporate
-- ============================================================================

-- ============================================================================
-- VOLUNTEER MANAGEMENT SYSTEM
-- ============================================================================

-- Volunteer profiles table
CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  total_hours DECIMAL(10,2) DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  skills TEXT[],
  availability JSONB,
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  bio TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_volunteers_user_id ON volunteers(user_id);
CREATE INDEX idx_volunteers_tier ON volunteers(tier);
CREATE INDEX idx_volunteers_total_points ON volunteers(total_points DESC);

-- Volunteer activities table
CREATE TABLE IF NOT EXISTS volunteer_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL, -- setup, registration, tech_support, photography, coordination, etc.
  hours DECIMAL(5,2) NOT NULL,
  points_earned INTEGER NOT NULL,
  amount_earned DECIMAL(10,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  supervisor_id UUID REFERENCES users(id),
  supervisor_notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_volunteer_activities_volunteer_id ON volunteer_activities(volunteer_id);
CREATE INDEX idx_volunteer_activities_event_id ON volunteer_activities(event_id);
CREATE INDEX idx_volunteer_activities_status ON volunteer_activities(status);
CREATE INDEX idx_volunteer_activities_created_at ON volunteer_activities(created_at DESC);

-- Point system configuration
CREATE TABLE IF NOT EXISTS activity_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type VARCHAR(50) UNIQUE NOT NULL,
  base_points INTEGER NOT NULL,
  base_rate DECIMAL(10,2) NOT NULL, -- Cash value per point
  tier_multipliers JSONB DEFAULT '{"bronze": 1, "silver": 1.2, "gold": 1.4, "platinum": 1.6}',
  description TEXT,
  estimated_hours DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default point values
INSERT INTO activity_points (activity_type, base_points, base_rate, description, estimated_hours) VALUES
('event_setup', 100, 5.00, 'Event setup and preparation', 2.0),
('registration_desk', 150, 5.00, 'Registration desk management', 4.0),
('usher_guide', 120, 5.00, 'Ushering and guiding attendees', 4.0),
('social_media', 180, 5.00, 'Social media coverage and live posting', 4.0),
('photography', 250, 5.00, 'Event photography and videography', 6.0),
('tech_support', 200, 5.00, 'Technical support and AV management', 5.0),
('coordination', 300, 5.00, 'Event coordination and management', 8.0),
('speaker_management', 200, 5.00, 'Speaker management and hospitality', 5.0),
('sponsor_relations', 350, 5.00, 'Sponsor relations and management', 8.0),
('team_lead', 400, 5.00, 'Team leadership and volunteer management', 10.0)
ON CONFLICT (activity_type) DO NOTHING;

-- Volunteer payouts table
CREATE TABLE IF NOT EXISTS volunteer_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_points INTEGER NOT NULL,
  total_hours DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) CHECK (payment_method IN ('bank_transfer', 'jazzcash', 'easypaisa', 'crypto')),
  payment_details JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  transaction_id VARCHAR(200),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Create indexes
CREATE INDEX idx_volunteer_payouts_volunteer_id ON volunteer_payouts(volunteer_id);
CREATE INDEX idx_volunteer_payouts_status ON volunteer_payouts(status);
CREATE INDEX idx_volunteer_payouts_created_at ON volunteer_payouts(created_at DESC);

-- Payment methods table
CREATE TABLE IF NOT EXISTS volunteer_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  method_type VARCHAR(50) NOT NULL CHECK (method_type IN ('bank_transfer', 'jazzcash', 'easypaisa', 'crypto')),
  account_title VARCHAR(200),
  account_number VARCHAR(200),
  bank_name VARCHAR(100),
  jazzcash_number VARCHAR(20),
  easypaisa_number VARCHAR(20),
  crypto_address TEXT,
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_volunteer_payment_methods_volunteer_id ON volunteer_payment_methods(volunteer_id);

-- ============================================================================
-- CERTIFICATION SYSTEM
-- ============================================================================

-- Certification types configuration
CREATE TABLE IF NOT EXISTS certification_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  tier VARCHAR(50) NOT NULL, -- volunteer, coordinator, manager
  min_hours DECIMAL(10,2) NOT NULL,
  min_events INTEGER NOT NULL,
  min_rating DECIMAL(3,2),
  required_skills TEXT[],
  prerequisites TEXT[],
  validity_months INTEGER, -- NULL for lifetime certificates
  price DECIMAL(10,2) DEFAULT 0,
  template_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default certification types
INSERT INTO certification_types (name, code, description, tier, min_hours, min_events, min_rating, required_skills, validity_months, price) VALUES
('Event Volunteer Certificate', 'VOL-BASIC', 'Recognition for completing volunteer hours at Fstivo events', 'volunteer', 20.0, 3, NULL, ARRAY['teamwork', 'communication', 'event_operations'], NULL, 500),
('Event Coordinator Certificate', 'VOL-COORD', 'Advanced certification for volunteers who have led multiple events', 'coordinator', 100.0, 5, 4.5, ARRAY['project_management', 'team_leadership', 'event_planning', 'crisis_management'], 36, 2000),
('Professional Event Manager', 'VOL-MGR', 'Professional credential for experienced event managers', 'manager', 500.0, 20, 4.7, ARRAY['strategic_planning', 'vendor_management', 'budget_management', 'stakeholder_management'], NULL, 5000)
ON CONFLICT (code) DO NOTHING;

-- Certificates table
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  certification_type_id UUID REFERENCES certification_types(id),
  certificate_number VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  skills_covered TEXT[],
  hours_completed DECIMAL(10,2) NOT NULL,
  events_completed INTEGER NOT NULL,
  issuer VARCHAR(100) DEFAULT 'Fstivo',
  co_issuers TEXT[], -- Partner organizations
  issue_date DATE NOT NULL,
  expiry_date DATE,
  qr_code TEXT UNIQUE,
  blockchain_hash VARCHAR(200) UNIQUE, -- For blockchain verification
  blockchain_tx_id TEXT,
  verification_url TEXT UNIQUE,
  pdf_url TEXT,
  linkedin_share_url TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'revoked')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_certifications_user_id ON certifications(user_id);
CREATE INDEX idx_certifications_certificate_number ON certifications(certificate_number);
CREATE INDEX idx_certifications_status ON certifications(status);
CREATE INDEX idx_certifications_issue_date ON certifications(issue_date DESC);

-- Certificate endorsements
CREATE TABLE IF NOT EXISTS certificate_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID REFERENCES certifications(id) ON DELETE CASCADE,
  endorser_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endorser_name VARCHAR(200),
  endorser_title VARCHAR(200),
  endorser_organization VARCHAR(200),
  relationship VARCHAR(100),
  endorsement_text TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_certificate_endorsements_certificate_id ON certificate_endorsements(certificate_id);

-- Certificate verification logs
CREATE TABLE IF NOT EXISTS certificate_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID REFERENCES certifications(id) ON DELETE CASCADE,
  verified_by VARCHAR(200),
  verification_type VARCHAR(50) CHECK (verification_type IN ('qr_scan', 'manual', 'api', 'link')),
  ip_address INET,
  user_agent TEXT,
  location JSONB,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_certificate_verifications_certificate_id ON certificate_verifications(certificate_id);
CREATE INDEX idx_certificate_verifications_verified_at ON certificate_verifications(verified_at DESC);

-- ============================================================================
-- CORPORATE PARTNERSHIP SYSTEM
-- ============================================================================

-- Corporate partners table
CREATE TABLE IF NOT EXISTS corporate_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  industry VARCHAR(100),
  logo_url TEXT,
  banner_url TEXT,
  website VARCHAR(200),
  description TEXT,
  company_size VARCHAR(50), -- startup, sme, enterprise
  founded_year INTEGER,
  headquarters_location VARCHAR(200),
  contact_person_name VARCHAR(200),
  contact_person_email VARCHAR(200),
  contact_person_phone VARCHAR(50),
  partnership_tier VARCHAR(50) DEFAULT 'bronze' CHECK (partnership_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  partnership_start_date DATE,
  partnership_end_date DATE,
  services JSONB, -- recruitment, booth, sponsorship, branding
  annual_budget DECIMAL(12,2),
  total_spent DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_corporate_partners_slug ON corporate_partners(slug);
CREATE INDEX idx_corporate_partners_tier ON corporate_partners(partnership_tier);
CREATE INDEX idx_corporate_partners_status ON corporate_partners(status);
CREATE INDEX idx_corporate_partners_industry ON corporate_partners(industry);

-- Job postings table
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES corporate_partners(id) ON DELETE CASCADE,
  posted_by UUID REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[],
  responsibilities TEXT[],
  benefits TEXT[],
  location VARCHAR(200),
  location_type VARCHAR(50) CHECK (location_type IN ('on-site', 'remote', 'hybrid')),
  job_type VARCHAR(50) CHECK (job_type IN ('full-time', 'part-time', 'internship', 'contract', 'freelance')),
  experience_level VARCHAR(50) CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
  salary_min DECIMAL(12,2),
  salary_max DECIMAL(12,2),
  salary_currency VARCHAR(10) DEFAULT 'PKR',
  application_deadline DATE,
  required_skills TEXT[],
  preferred_skills TEXT[],
  preferred_certifications TEXT[],
  applicants_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'paused', 'filled')),
  is_featured BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_job_postings_company_id ON job_postings(company_id);
CREATE INDEX idx_job_postings_slug ON job_postings(slug);
CREATE INDEX idx_job_postings_status ON job_postings(status);
CREATE INDEX idx_job_postings_created_at ON job_postings(created_at DESC);
CREATE INDEX idx_job_postings_location_type ON job_postings(location_type);
CREATE INDEX idx_job_postings_job_type ON job_postings(job_type);
CREATE INDEX idx_job_postings_featured ON job_postings(is_featured) WHERE is_featured = true;

-- Job applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES users(id) ON DELETE CASCADE,
  resume_url TEXT,
  cover_letter TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  volunteer_profile_id UUID REFERENCES volunteers(id),
  certifications UUID[],
  answers JSONB, -- Application questions answers
  status VARCHAR(50) DEFAULT 'applied' CHECK (status IN ('applied', 'under_review', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn')),
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  interview_scheduled_at TIMESTAMP WITH TIME ZONE,
  interviewed_at TIMESTAMP WITH TIME ZONE,
  offered_at TIMESTAMP WITH TIME ZONE,
  hired_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_applied_at ON job_applications(applied_at DESC);

-- Booth bookings table
CREATE TABLE IF NOT EXISTS booth_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES corporate_partners(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  booked_by UUID REFERENCES users(id),
  booth_number VARCHAR(50),
  booth_size VARCHAR(50) CHECK (booth_size IN ('small', 'medium', 'large', 'premium')),
  booth_location VARCHAR(100),
  dimensions VARCHAR(100),
  cost DECIMAL(10,2) NOT NULL,
  special_requirements TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  setup_instructions TEXT,
  contact_at_event VARCHAR(200),
  contact_phone_at_event VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_booth_bookings_company_id ON booth_bookings(company_id);
CREATE INDEX idx_booth_bookings_event_id ON booth_bookings(event_id);
CREATE INDEX idx_booth_bookings_status ON booth_bookings(status);

-- ============================================================================
-- EVENT CATEGORIES & FIELDS
-- ============================================================================

-- Event categories
CREATE TABLE IF NOT EXISTS event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50),
  description TEXT,
  color VARCHAR(20),
  parent_category_id UUID REFERENCES event_categories(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO event_categories (name, slug, icon, description, color, display_order) VALUES
('Technology', 'technology', 'laptop', 'Technology events, hackathons, workshops', '#6366f1', 1),
('Business', 'business', 'briefcase', 'Business conferences, career fairs, networking', '#8b5cf6', 2),
('Healthcare', 'healthcare', 'heart-pulse', 'Healthcare symposiums, medical events', '#ef4444', 3),
('Engineering', 'engineering', 'cog', 'Engineering expos, technical workshops', '#f59e0b', 4),
('Arts & Design', 'arts-design', 'palette', 'Arts exhibitions, design conferences', '#ec4899', 5),
('Sciences', 'sciences', 'flask', 'Science fairs, research symposiums', '#10b981', 6),
('Social Impact', 'social-impact', 'users', 'Social impact events, community service', '#06b6d4', 7)
ON CONFLICT (slug) DO NOTHING;

-- Event fields/subcategories
CREATE TABLE IF NOT EXISTS event_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES event_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  keywords TEXT[],
  industry_tags TEXT[],
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- Add category_id to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES event_categories(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS field_id UUID REFERENCES event_fields(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_satellite BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS parent_conference VARCHAR(200);
ALTER TABLE events ADD COLUMN IF NOT EXISTS international_partner VARCHAR(200);

CREATE INDEX idx_events_category_id ON events(category_id);
CREATE INDEX idx_events_field_id ON events(field_id);
CREATE INDEX idx_events_is_satellite ON events(is_satellite);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS VARCHAR(100) AS $$
DECLARE
  cert_type VARCHAR(50);
  year_part VARCHAR(4);
  random_part VARCHAR(8);
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  random_part := UPPER(SUBSTR(ENCODE(GEN_RANDOM_BYTES(4), 'hex'), 1, 8));

  -- Get certification type code
  SELECT code INTO cert_type
  FROM certification_types
  WHERE id = (
     SELECT certification_type_id
     FROM certifications
     WHERE id IS NULL -- This will be set in trigger
     LIMIT 1
  )
  LIMIT 1;

  RETURN 'FST-' || year_part || '-' || COALESCE(cert_type, 'VOL') || '-' || random_part;
END;
$$ LANGUAGE plpgsql;

-- Function to update volunteer tier based on points
CREATE OR REPLACE FUNCTION update_volunteer_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Update tier based on total_points
  IF NEW.total_points >= 5000 THEN
    NEW.tier := 'platinum';
  ELSIF NEW.total_points >= 1500 THEN
    NEW.tier := 'gold';
  ELSIF NEW.total_points >= 500 THEN
    NEW.tier := 'silver';
  ELSE
    NEW.tier := 'bronze';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update volunteer tier
CREATE TRIGGER update_volunteer_tier_trigger
  BEFORE UPDATE ON volunteers
  FOR EACH ROW
  WHEN (NEW.total_points IS DISTINCT FROM OLD.total_points)
  EXECUTE FUNCTION update_volunteer_tier();

-- Function to increment job applicants count
CREATE OR REPLACE FUNCTION increment_job_applicants()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE job_postings
  SET applicants_count = applicants_count + 1
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for job application
CREATE TRIGGER increment_job_applicants_trigger
  AFTER INSERT ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION increment_job_applicants();

-- Function to increment job views
CREATE OR REPLACE FUNCTION increment_job_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE job_postings
  SET views_count = views_count + 1
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE booth_bookings ENABLE ROW LEVEL SECURITY;

-- Volunteers: Users can see their own profile, admins can see all
CREATE POLICY "Users can view own volunteer profile"
  ON volunteers FOR SELECT
  USING (auth.uid() = user_id OR
         EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert own volunteer profile"
  ON volunteers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own volunteer profile"
  ON volunteers FOR UPDATE
  USING (auth.uid() = user_id OR
         EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Volunteer activities
CREATE POLICY "Volunteers can view own activities"
  ON volunteer_activities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM volunteers WHERE id = volunteer_id AND user_id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Supervisors can view activities for their events"
  ON volunteer_activities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()
  ));

-- Certificates: Public view, user can manage own
CREATE POLICY "Everyone can view active certificates"
  ON certifications FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can manage own certificates"
  ON certifications FOR ALL
  USING (auth.uid() = user_id OR
         EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Job postings: Public view, companies can manage own
CREATE POLICY "Everyone can view active job postings"
  ON job_postings FOR SELECT
  USING (status = 'active' AND published_at <= NOW());

CREATE POLICY "Companies can manage own job postings"
  ON job_postings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM corporate_partners cp
      JOIN company_representatives cr ON cp.id = cr.company_id
      WHERE cp.id = job_postings.company_id AND cr.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Job applications
CREATE POLICY "Applicants can manage own applications"
  ON job_applications FOR ALL
  USING (auth.uid() = applicant_id);

CREATE POLICY "Companies can view applications for their jobs"
  ON job_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_postings jp
      JOIN corporate_partners cp ON jp.company_id = cp.id
      JOIN company_representatives cr ON cp.id = cr.company_id
      WHERE jp.id = job_applications.job_id AND cr.user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can update application status"
  ON job_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM job_postings jp
      JOIN corporate_partners cp ON jp.company_id = cp.id
      JOIN company_representatives cr ON cp.id = cr.company_id
      WHERE jp.id = job_applications.job_id AND cr.user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMPANY REPRESENTATIVES TABLE (for linking users to companies)
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES corporate_partners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(100) DEFAULT 'representative', -- recruiter, hiring_manager, admin
  is_primary BOOLEAN DEFAULT false,
  can_post_jobs BOOLEAN DEFAULT true,
  can_view_applications BOOLEAN DEFAULT true,
  can_manage_sponsorships BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

CREATE INDEX idx_company_representatives_company_id ON company_representatives(company_id);
CREATE INDEX idx_company_representatives_user_id ON company_representatives(user_id);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE volunteers IS 'Volunteer profiles with points, tiers, and earnings';
COMMENT ON TABLE volunteer_activities IS 'Individual volunteer activities with points and earnings';
COMMENT ON TABLE activity_points IS 'Point values for different volunteer activities';
COMMENT ON TABLE volunteer_payouts IS 'Payout records for volunteer earnings';
COMMENT ON TABLE certifications IS 'Issued certificates with verification';
COMMENT ON TABLE certification_types IS 'Certificate type definitions and requirements';
COMMENT ON TABLE corporate_partners IS 'Corporate partner companies and partnerships';
COMMENT ON TABLE job_postings IS 'Job postings from corporate partners';
COMMENT ON TABLE job_applications IS 'Job applications from students/volunteers';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
