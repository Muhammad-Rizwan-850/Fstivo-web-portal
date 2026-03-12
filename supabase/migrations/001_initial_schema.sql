-- ============================================================================
-- Fstivo Platform - Initial Database Schema
-- Core Tables: Users, Organizations, Events, Registrations
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User Roles
CREATE TYPE user_roles AS ENUM ('organizer', 'volunteer', 'sponsor', 'admin', 'attendee');

-- Organization Types
CREATE TYPE organization_type AS ENUM ('university', 'company', 'nonprofit', 'government', 'other');

-- Event Types
CREATE TYPE event_type AS ENUM ('conference', 'workshop', 'seminar', 'competition', 'networking', 'social', 'exhibition', 'other');

-- Event Status
CREATE TYPE event_status AS ENUM ('draft', 'published', 'ongoing', 'completed', 'cancelled');

-- Registration Status
CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'cancelled', 'attended');

-- Payment Status
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Event Categories
CREATE TABLE IF NOT EXISTS event_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  description TEXT,
  color VARCHAR(20),
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Fields/Subcategories
CREATE TABLE IF NOT EXISTS event_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES event_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  keywords TEXT[],
  industry_tags TEXT[],
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- Organizations Table (universities, companies, etc.)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(300) NOT NULL,
  type organization_type NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address JSONB,
  logo_url TEXT,
  website VARCHAR(500),
  description TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(300),
  avatar_url TEXT,
  phone VARCHAR(50),
  role user_roles DEFAULT 'attendee',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  bio TEXT,
  skills TEXT[],
  experience INT, -- years of experience
  location VARCHAR(200),
  website VARCHAR(500),
  social_links JSONB,
  date_of_birth DATE,
  education JSONB,
  resume_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  short_description VARCHAR(500),
  description TEXT NOT NULL,
  event_type event_type NOT NULL,
  status event_status DEFAULT 'draft',

  -- Dates
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  registration_opens_at TIMESTAMPTZ,
  registration_closes_at TIMESTAMPTZ,

  -- Location
  is_virtual BOOLEAN DEFAULT false,
  location JSONB,
  virtual_meeting_link VARCHAR(500),
  venue_name VARCHAR(300),
  venue_city VARCHAR(100),
  venue_address TEXT,

  -- Capacity & Pricing
  capacity INT,
  price DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'PKR',

  -- Category & Field
  category_id UUID,
  field_id UUID,

  -- Satellite & Partnership
  is_satellite BOOLEAN DEFAULT false,
  parent_conference VARCHAR(200),
  international_partner VARCHAR(200),

  -- Media
  cover_image_url TEXT,
  banner_image_url TEXT,

  -- Organizer
  organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Requirements
  required_skills TEXT[],
  eligibility_criteria TEXT,

  -- Metadata
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Ticket Types Table
CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity_available INT,
  quantity_sold INT DEFAULT 0,
  sale_start_date TIMESTAMPTZ,
  sale_end_date TIMESTAMPTZ,
  is_early_bird BOOLEAN DEFAULT false,
  max_per_order INT DEFAULT 10,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  benefits TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrations Table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE SET NULL,

  -- Registration Details
  registration_number VARCHAR(100) UNIQUE NOT NULL,
  status registration_status DEFAULT 'confirmed',
  payment_status payment_status DEFAULT 'pending',

  -- Payment
  payment_amount DECIMAL(10,2),
  payment_id VARCHAR(200),
  payment_method VARCHAR(50),
  payment_date TIMESTAMPTZ,

  -- Registration Data
  registration_data JSONB,
  custom_answers JSONB,
  emergency_contact JSONB,

  -- Check-in
  checked_in_at TIMESTAMPTZ,
  check_in_method VARCHAR(50),
  qr_code TEXT UNIQUE,

  -- Timestamps
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

-- Registration Attendees (for group registrations)
CREATE TABLE IF NOT EXISTS registration_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(300) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL;

-- Organizations indexes
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_is_verified ON organizations(is_verified);

-- Event Categories indexes
CREATE INDEX idx_event_categories_slug ON event_categories(slug);
CREATE INDEX idx_event_categories_display_order ON event_categories(display_order);

-- Event Fields indexes
CREATE INDEX idx_event_fields_category_id ON event_fields(category_id);
CREATE INDEX idx_event_fields_slug ON event_fields(slug);

-- Events indexes
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_organization_id ON events(organization_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_is_published ON events(is_published);
CREATE INDEX idx_events_deleted_at ON events(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_category_id ON events(category_id);
CREATE INDEX idx_events_field_id ON events(field_id);
CREATE INDEX idx_events_is_satellite ON events(is_satellite);

-- Ticket types indexes
CREATE INDEX idx_ticket_types_event_id ON ticket_types(event_id);

-- Registrations indexes
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX idx_registrations_qr_code ON registrations(qr_code);
CREATE INDEX idx_registrations_registered_at ON registrations(registered_at);

-- Registration attendees indexes
CREATE INDEX idx_registration_attendees_registration_id ON registration_attendees(registration_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to generate registration number
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS VARCHAR(100) AS $$
DECLARE
  event_code TEXT;
  random_part TEXT;
  timestamp_part TEXT;
BEGIN
  -- Get event code from event title
  SELECT UPPER(SUBSTRING(REPLACE(title, ' ', ''), 1, 3))
  INTO event_code
  FROM events
  WHERE id = NEW.event_id;

  -- Generate random part
  random_part := UPPER(SUBSTRING(ENCODE(GEN_RANDOM_BYTES(3), 'hex'), 1, 6));

  -- Get timestamp part
  timestamp_part := TO_CHAR(NOW(), 'YYMMDD');

  RETURN 'FST-' || event_code || '-' || timestamp_part || '-' || random_part;
END;
$$ LANGUAGE plpgsql;

-- Function to generate QR code data
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'FSTIVO-' || NEW.id::TEXT || '-' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_types_updated_at BEFORE UPDATE ON ticket_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-generate registration number
CREATE TRIGGER generate_registration_number_trigger
  BEFORE INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION generate_registration_number();

-- Trigger to auto-generate QR code
CREATE TRIGGER generate_qr_code_trigger
  BEFORE INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION generate_qr_code();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Event Detail View
CREATE OR REPLACE VIEW event_details AS
SELECT
  e.*,
  o.full_name as organizer_name,
  o.email as organizer_email,
  o.phone as organizer_phone,
  org.name as organization_name,
  org.type as organization_type,
  org.logo_url as organization_logo,
  COUNT(DISTINCT r.id) as total_registrations,
  COUNT(DISTINCT CASE WHEN r.checked_in_at IS NOT NULL THEN r.id END) as total_checked_in,
  COALESCE(SUM(CASE WHEN r.payment_status = 'paid' THEN r.payment_amount ELSE 0 END), 0) as total_revenue,
  c.name as category_name,
  c.icon as category_icon,
  f.name as field_name
FROM events e
LEFT JOIN profiles o ON e.organizer_id = o.id
LEFT JOIN organizations org ON e.organization_id = org.id
LEFT JOIN registrations r ON e.id = r.event_id AND r.status != 'cancelled'
LEFT JOIN event_categories c ON e.category_id = c.id
LEFT JOIN event_fields f ON e.field_id = f.id
WHERE e.deleted_at IS NULL
GROUP BY e.id, o.id, org.id, c.id, f.id;

-- User Dashboard View
CREATE OR REPLACE VIEW user_event_summary AS
SELECT
  p.id as user_id,
  p.full_name,
  p.email,
  COUNT(DISTINCT CASE WHEN r.status = 'confirmed' THEN r.event_id END) as upcoming_events,
  COUNT(DISTINCT CASE WHEN r.status = 'attended' THEN r.event_id END) as attended_events,
  COALESCE(SUM(CASE WHEN r.payment_status = 'paid' THEN r.payment_amount ELSE 0 END), 0) as total_spent
FROM profiles p
LEFT JOIN registrations r ON p.id = r.user_id
WHERE p.is_active = true AND p.deleted_at IS NULL
GROUP BY p.id;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_attendees ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (deleted_at IS NULL);

-- Event Categories Policies
CREATE POLICY "Anyone can view event categories"
  ON event_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage event categories"
  ON event_categories TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Event Fields Policies
CREATE POLICY "Anyone can view event fields"
  ON event_fields FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage event fields"
  ON event_fields TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can do anything"
  ON profiles TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Organizations Policies
CREATE POLICY "Anyone can view organizations"
  ON organizations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Organization members can update"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND organization_id = organizations.id
    ) OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Events Policies
CREATE POLICY "Anyone can view published events"
  ON events FOR SELECT
  USING (is_published = true AND deleted_at IS NULL);

CREATE POLICY "Organizers can view their own events"
  ON events FOR SELECT
  USING (organizer_id = auth.uid());

CREATE POLICY "Organizers can create events"
  ON events FOR INSERT
  WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Organizers can update their own events"
  ON events FOR UPDATE
  USING (organizer_id = auth.uid());

CREATE POLICY "Organizers can delete their own events"
  ON events FOR DELETE
  USING (organizer_id = auth.uid());

CREATE POLICY "Admins can do anything on events"
  ON events TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Ticket Types Policies
CREATE POLICY "Anyone can view ticket types for published events"
  ON ticket_types FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = ticket_types.event_id
      AND events.is_published = true
    )
  );

CREATE POLICY "Organizers can manage their event tickets"
  ON ticket_types TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = ticket_types.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Registrations Policies
CREATE POLICY "Users can view their own registrations"
  ON registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Organizers can view registrations for their events"
  ON registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = registrations.event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Users can create registrations"
  ON registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organizers can update registrations for their events"
  ON registrations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = registrations.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Registration Attendees Policies
CREATE POLICY "Users can view attendees for their registrations"
  ON registration_attendees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM registrations
      WHERE registrations.id = registration_attendees.registration_id
      AND registrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can view attendees for their events"
  ON registration_attendees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      JOIN events e ON e.id = r.event_id
      WHERE r.id = registration_attendees.registration_id
      AND e.organizer_id = auth.uid()
    )
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default organizations (optional)
INSERT INTO organizations (name, type, email, is_verified) VALUES
  ('FAST National University', 'university', 'info@nu.edu.pk', true),
  ('LUMS', 'university', 'info@lums.edu.pk', true),
  ('IBA Karachi', 'university', 'info@iba.edu.pk', true)
ON CONFLICT DO NOTHING;

-- Insert event categories
INSERT INTO event_categories (id, name, slug, icon, description, color, display_order) VALUES
  (gen_random_uuid(), 'Technology', 'technology', '💻', 'Technology events, hackathons, workshops', '#6366f1', 1),
  (gen_random_uuid(), 'Business', 'business', '💼', 'Business conferences, career fairs, networking', '#8b5cf6', 2),
  (gen_random_uuid(), 'Healthcare', 'healthcare', '🏥', 'Healthcare symposiums, medical events', '#ef4444', 3),
  (gen_random_uuid(), 'Engineering', 'engineering', '⚙️', 'Engineering expos, technical workshops', '#f59e0b', 4),
  (gen_random_uuid(), 'Arts & Design', 'arts-design', '🎨', 'Arts exhibitions, design conferences', '#ec4899', 5),
  (gen_random_uuid(), 'Sciences', 'sciences', '🔬', 'Science fairs, research symposiums', '#10b981', 6),
  (gen_random_uuid(), 'Social Impact', 'social-impact', '🌍', 'Social impact events, community service', '#06b6d4', 7)
ON CONFLICT (name) DO NOTHING;

-- Insert event fields (subcategories)
-- Get category IDs dynamically
DO $$
DECLARE
  tech_cat UUID;
  business_cat UUID;
  healthcare_cat UUID;
  eng_cat UUID;
  arts_cat UUID;
  science_cat UUID;
  social_cat UUID;
BEGIN
  SELECT id INTO tech_cat FROM event_categories WHERE slug = 'technology';
  SELECT id INTO business_cat FROM event_categories WHERE slug = 'business';
  SELECT id INTO healthcare_cat FROM event_categories WHERE slug = 'healthcare';
  SELECT id INTO eng_cat FROM event_categories WHERE slug = 'engineering';
  SELECT id INTO arts_cat FROM event_categories WHERE slug = 'arts-design';
  SELECT id INTO science_cat FROM event_categories WHERE slug = 'sciences';
  SELECT id INTO social_cat FROM event_categories WHERE slug = 'social-impact';

  -- Technology Fields
  INSERT INTO event_fields (category_id, name, slug, keywords, industry_tags, description) VALUES
    (tech_cat, 'Software Development', 'software-dev', ARRAY['coding', 'programming', 'web', 'app'], ARRAY['IT', 'Software', 'Tech'], 'Programming, web development, mobile apps'),
    (tech_cat, 'Data & AI', 'data-ai', ARRAY['AI', 'machine learning', 'data', 'analytics'], ARRAY['AI', 'Data Science', 'ML'], 'Artificial intelligence, machine learning, data science'),
    (tech_cat, 'Cloud & DevOps', 'cloud-devops', ARRAY['cloud', 'aws', 'azure', 'devops'], ARRAY['Cloud', 'DevOps', 'Infrastructure'], 'Cloud computing, DevOps, infrastructure'),
    (tech_cat, 'Cybersecurity', 'cybersecurity', ARRAY['security', 'hacking', 'cyber', 'network'], ARRAY['Cybersecurity', 'Security'], 'Information security, ethical hacking')
  ON CONFLICT DO NOTHING;

  -- Business Fields
  INSERT INTO event_fields (category_id, name, slug, keywords, industry_tags, description) VALUES
    (business_cat, 'Entrepreneurship', 'entrepreneurship', ARRAY['startup', 'entrepreneur', 'pitch', 'funding'], ARRAY['Startups', 'Venture Capital'], 'Startup events, pitch competitions, funding'),
    (business_cat, 'Finance & Banking', 'finance', ARRAY['finance', 'banking', 'investment', 'trading'], ARRAY['Finance', 'Banking', 'Investment'], 'Finance, banking, investment, trading'),
    (business_cat, 'Marketing & Sales', 'marketing', ARRAY['marketing', 'sales', 'branding', 'digital'], ARRAY['Marketing', 'Sales', 'Branding'], 'Marketing strategies, sales, branding'),
    (business_cat, 'Management & Leadership', 'management', ARRAY['management', 'leadership', 'mba', 'executive'], ARRAY['Management', 'Leadership', 'MBA'], 'Business management, leadership, MBA')
  ON CONFLICT DO NOTHING;

  -- Healthcare Fields
  INSERT INTO event_fields (category_id, name, slug, keywords, industry_tags, description) VALUES
    (healthcare_cat, 'Medicine', 'medicine', ARRAY['medical', 'doctor', 'physician', 'healthcare'], ARRAY['Healthcare', 'Medical'], 'Medical conferences, healthcare events'),
    (healthcare_cat, 'Pharmaceutical', 'pharmacy', ARRAY['pharmacy', 'pharmaceutical', 'drug', 'medicine'], ARRAY['Pharmacy', 'Pharmaceutical'], 'Pharmacy, pharmaceutical sciences'),
    (healthcare_cat, 'Nursing & Allied Health', 'nursing', ARRAY['nursing', 'allied', 'health', 'medical'], ARRAY['Nursing', 'Allied Health'], 'Nursing, allied health professions'),
    (healthcare_cat, 'Health Tech', 'health-tech', ARRAY['health tech', 'medical devices', 'digital health'], ARRAY['HealthTech', 'Medical Devices'], 'Healthcare technology, medical devices')
  ON CONFLICT DO NOTHING;

  -- Engineering Fields
  INSERT INTO event_fields (category_id, name, slug, keywords, industry_tags, description) VALUES
    (eng_cat, 'Civil Engineering', 'civil-engineering', ARRAY['civil', 'construction', 'infrastructure'], ARRAY['Construction', 'Infrastructure'], 'Civil engineering, construction'),
    (eng_cat, 'Electrical Engineering', 'electrical-engineering', ARRAY['electrical', 'electronics', 'power'], ARRAY['Electrical', 'Electronics'], 'Electrical engineering, electronics'),
    (eng_cat, 'Mechanical Engineering', 'mechanical-engineering', ARRAY['mechanical', 'manufacturing', 'automotive'], ARRAY['Manufacturing', 'Automotive'], 'Mechanical engineering, manufacturing'),
    (eng_cat, 'Chemical Engineering', 'chemical-engineering', ARRAY['chemical', 'process', 'industrial'], ARRAY['Chemical', 'Process'], 'Chemical engineering, process industries')
  ON CONFLICT DO NOTHING;

  -- Arts & Design Fields
  INSERT INTO event_fields (category_id, name, slug, keywords, industry_tags, description) VALUES
    (arts_cat, 'Graphic Design', 'graphic-design', ARRAY['graphic', 'design', 'ui', 'ux', 'visual'], ARRAY['Design', 'UI/UX'], 'Graphic design, UI/UX, visual design'),
    (arts_cat, 'Fine Arts', 'fine-arts', ARRAY['painting', 'sculpture', 'art', 'fine arts'], ARRAY['Arts', 'Fine Arts'], 'Painting, sculpture, fine arts'),
    (arts_cat, 'Fashion & Design', 'fashion', ARRAY['fashion', 'design', 'textile', 'apparel'], ARRAY['Fashion', 'Textile'], 'Fashion design, textile, apparel'),
    (arts_cat, 'Media & Film', 'media-arts', ARRAY['film', 'media', 'photography', 'video'], ARRAY['Media', 'Film', 'Photography'], 'Film, media, photography, videography')
  ON CONFLICT DO NOTHING;

  -- Sciences Fields
  INSERT INTO event_fields (category_id, name, slug, keywords, industry_tags, description) VALUES
    (science_cat, 'Physics', 'physics', ARRAY['physics', 'quantum', 'mechanics'], ARRAY['Physics', 'Research'], 'Physics, quantum mechanics, research'),
    (science_cat, 'Chemistry', 'chemistry', ARRAY['chemistry', 'biochemistry', 'materials'], ARRAY['Chemistry', 'Research'], 'Chemistry, biochemistry, materials'),
    (science_cat, 'Biology & Life Sciences', 'biology', ARRAY['biology', 'biotech', 'genetics', 'life sciences'], ARRAY['Biology', 'Biotech'], 'Biology, biotechnology, life sciences'),
    (science_cat, 'Mathematics & Statistics', 'mathematics', ARRAY['math', 'statistics', 'data'], ARRAY['Mathematics', 'Statistics'], 'Mathematics, statistics, data science')
  ON CONFLICT DO NOTHING;

  -- Social Impact Fields
  INSERT INTO event_fields (category_id, name, slug, keywords, industry_tags, description) VALUES
    (social_cat, 'Environment & Sustainability', 'environment', ARRAY['environment', 'climate', 'sustainability', 'green'], ARRAY['Environment', 'Climate', 'Sustainability'], 'Environmental issues, climate change, sustainability'),
    (social_cat, 'Education', 'education', ARRAY['education', 'teaching', 'learning', 'edtech'], ARRAY['Education', 'EdTech'], 'Education, teaching, learning, EdTech'),
    (social_cat, 'Community Service', 'community-service', ARRAY['volunteer', 'community', 'service', 'ngo'], ARRAY['NGO', 'Nonprofit'], 'Volunteering, community service, NGO work'),
    (social_cat, 'Social Justice', 'social-justice', ARRAY['human rights', 'justice', 'advocacy'], ARRAY['Human Rights', 'Advocacy'], 'Human rights, social justice, advocacy')
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
