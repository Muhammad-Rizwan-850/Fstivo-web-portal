-- Community Partners & University Network Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- COMMUNITY PARTNERS TABLES
-- ==========================================

-- Create partner_types table
CREATE TABLE IF NOT EXISTS partner_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default partner types
INSERT INTO partner_types (id, name, icon, display_order) VALUES
('corporate', 'Corporate', '🏢', 1),
('ngo', 'NGOs', '❤️', 2),
('government', 'Government', '🏛️', 3),
('educational', 'Educational', '🎓', 4),
('media', 'Media', '📺', 5)
ON CONFLICT (id) DO NOTHING;

-- Create community_partners table
CREATE TABLE IF NOT EXISTS community_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type_id TEXT REFERENCES partner_types(id),
  logo_url TEXT,
  description TEXT,
  location TEXT,
  since_year INTEGER,
  partnership_level TEXT CHECK (partnership_level IN ('Strategic', 'Gold', 'Silver', 'Bronze')),
  website TEXT,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partner_collaborations table
CREATE TABLE IF NOT EXISTS partner_collaborations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES community_partners(id) ON DELETE CASCADE,
  collaboration_text TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partner_joint_events table
CREATE TABLE IF NOT EXISTS partner_joint_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES community_partners(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  attendees INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partner_impact_metrics table
CREATE TABLE IF NOT EXISTS partner_impact_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES community_partners(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partner_testimonials table
CREATE TABLE IF NOT EXISTS partner_testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES community_partners(id) ON DELETE CASCADE,
  testimonial_text TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_position TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- UNIVERSITY NETWORK TABLES
-- ==========================================

-- Create university_tiers table
CREATE TABLE IF NOT EXISTS university_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL,
  color_gradient TEXT,
  display_order INTEGER NOT NULL,
  benefits TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default university tiers
INSERT INTO university_tiers (id, name, min_points, color_gradient, display_order, benefits) VALUES
('platinum', 'Platinum', 1000, 'from-slate-300 to-slate-500', 1, ARRAY['Premium features', 'Dedicated support', 'Featured placement', 'Custom branding']),
('gold', 'Gold', 500, 'from-yellow-400 to-yellow-600', 2, ARRAY['Advanced features', 'Priority support', 'Featured events']),
('silver', 'Silver', 200, 'from-gray-300 to-gray-500', 3, ARRAY['Standard features', 'Email support']),
('bronze', 'Bronze', 50, 'from-orange-400 to-orange-600', 4, ARRAY['Basic features'])
ON CONFLICT (id) DO NOTHING;

-- Create universities table
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  full_name TEXT,
  city TEXT NOT NULL,
  logo_url TEXT,
  tier_id TEXT REFERENCES university_tiers(id),
  rank INTEGER,
  students_active INTEGER DEFAULT 0,
  events_hosted INTEGER DEFAULT 0,
  ambassadors_count INTEGER DEFAULT 0,
  total_attendance INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0.0,
  joined_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create university_campuses table
CREATE TABLE IF NOT EXISTS university_campuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  campus_city TEXT NOT NULL,
  campus_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create university_achievements table
CREATE TABLE IF NOT EXISTS university_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  achievement_text TEXT NOT NULL,
  achievement_date DATE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create university_events table
CREATE TABLE IF NOT EXISTS university_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  event_id UUID,
  event_name TEXT NOT NULL,
  event_date DATE,
  attendees INTEGER,
  is_top_event BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student_organizations table
CREATE TABLE IF NOT EXISTS student_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  org_name TEXT NOT NULL,
  members_count INTEGER DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create campus_ambassadors table
CREATE TABLE IF NOT EXISTS campus_ambassadors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'alumni')),
  joined_date DATE DEFAULT CURRENT_DATE,
  events_organized INTEGER DEFAULT 0,
  students_reached INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inter_university_competitions table
CREATE TABLE IF NOT EXISTS inter_university_competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_name TEXT NOT NULL,
  winner_university_id UUID REFERENCES universities(id),
  competition_date DATE NOT NULL,
  participants_count INTEGER,
  prize_amount TEXT,
  description TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create university_competition_participants table (junction)
CREATE TABLE IF NOT EXISTS university_competition_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID REFERENCES inter_university_competitions(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  team_name TEXT,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competition_id, university_id)
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Community Partners Indexes
CREATE INDEX IF NOT EXISTS idx_partners_type ON community_partners(type_id);
CREATE INDEX IF NOT EXISTS idx_partners_active ON community_partners(is_active);
CREATE INDEX IF NOT EXISTS idx_partners_featured ON community_partners(is_featured);
CREATE INDEX IF NOT EXISTS idx_partner_collaborations_partner ON partner_collaborations(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_joint_events_partner ON partner_joint_events(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_impact_partner ON partner_impact_metrics(partner_id);

-- University Network Indexes
CREATE INDEX IF NOT EXISTS idx_universities_city ON universities(city);
CREATE INDEX IF NOT EXISTS idx_universities_tier ON universities(tier_id);
CREATE INDEX IF NOT EXISTS idx_universities_rank ON universities(rank);
CREATE INDEX IF NOT EXISTS idx_universities_active ON universities(is_active);
CREATE INDEX IF NOT EXISTS idx_university_campuses_university ON university_campuses(university_id);
CREATE INDEX IF NOT EXISTS idx_university_achievements_university ON university_achievements(university_id);
CREATE INDEX IF NOT EXISTS idx_university_events_university ON university_events(university_id);
CREATE INDEX IF NOT EXISTS idx_student_orgs_university ON student_organizations(university_id);
CREATE INDEX IF NOT EXISTS idx_campus_ambassadors_university ON campus_ambassadors(university_id);
CREATE INDEX IF NOT EXISTS idx_competitions_featured ON inter_university_competitions(is_featured);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

-- Community Partners
ALTER TABLE partner_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_joint_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_impact_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_testimonials ENABLE ROW LEVEL SECURITY;

-- Universities
ALTER TABLE university_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE inter_university_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_competition_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view partner types" ON partner_types;
DROP POLICY IF EXISTS "Anyone can view active partners" ON community_partners;
DROP POLICY IF EXISTS "Anyone can view partner collaborations" ON partner_collaborations;
DROP POLICY IF EXISTS "Anyone can view partner events" ON partner_joint_events;
DROP POLICY IF EXISTS "Anyone can view partner metrics" ON partner_impact_metrics;
DROP POLICY IF EXISTS "Anyone can view partner testimonials" ON partner_testimonials;

DROP POLICY IF EXISTS "Anyone can view university tiers" ON university_tiers;
DROP POLICY IF EXISTS "Anyone can view active universities" ON universities;
DROP POLICY IF EXISTS "Anyone can view university campuses" ON university_campuses;
DROP POLICY IF EXISTS "Anyone can view university achievements" ON university_achievements;
DROP POLICY IF EXISTS "Anyone can view university events" ON university_events;
DROP POLICY IF EXISTS "Anyone can view student organizations" ON student_organizations;
DROP POLICY IF EXISTS "Anyone can view active ambassadors" ON campus_ambassadors;
DROP POLICY IF EXISTS "Anyone can view featured competitions" ON inter_university_competitions;
DROP POLICY IF EXISTS "Anyone can view competition participants" ON university_competition_participants;

DROP POLICY IF EXISTS "Admins can manage community partners" ON community_partners;
DROP POLICY IF EXISTS "Admins can manage universities" ON universities;

-- Public read policies
CREATE POLICY "Anyone can view partner types" ON partner_types FOR SELECT USING (true);
CREATE POLICY "Anyone can view active partners" ON community_partners FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view partner collaborations" ON partner_collaborations FOR SELECT USING (true);
CREATE POLICY "Anyone can view partner events" ON partner_joint_events FOR SELECT USING (true);
CREATE POLICY "Anyone can view partner metrics" ON partner_impact_metrics FOR SELECT USING (true);
CREATE POLICY "Anyone can view partner testimonials" ON partner_testimonials FOR SELECT USING (true);

CREATE POLICY "Anyone can view university tiers" ON university_tiers FOR SELECT USING (true);
CREATE POLICY "Anyone can view active universities" ON universities FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view university campuses" ON university_campuses FOR SELECT USING (true);
CREATE POLICY "Anyone can view university achievements" ON university_achievements FOR SELECT USING (true);
CREATE POLICY "Anyone can view university events" ON university_events FOR SELECT USING (true);
CREATE POLICY "Anyone can view student organizations" ON student_organizations FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active ambassadors" ON campus_ambassadors FOR SELECT USING (status = 'active');
CREATE POLICY "Anyone can view featured competitions" ON inter_university_competitions FOR SELECT USING (is_featured = true);
CREATE POLICY "Anyone can view competition participants" ON university_competition_participants FOR SELECT USING (true);

-- Admin write policies (both tables)
CREATE POLICY "Admins can manage community partners" ON community_partners FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage universities" ON universities FOR ALL
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('admin', 'super_admin')));

-- ==========================================
-- VIEWS
-- ==========================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS community_partners_full;
DROP VIEW IF EXISTS universities_full;

-- Community Partners Full View
CREATE OR REPLACE VIEW community_partners_full AS
SELECT
  cp.*,
  pt.name as partner_type_name,
  pt.icon as partner_type_icon,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'text', pc.collaboration_text,
    'display_order', pc.display_order
  ) ORDER BY pc.display_order) FILTER (WHERE pc.id IS NOT NULL), '[]') AS collaborations,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'name', pje.event_name,
    'date', pje.event_date,
    'attendees', pje.attendees
  )) FILTER (WHERE pje.id IS NOT NULL), '[]') AS joint_events,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'metric_name', pim.metric_name,
    'metric_value', pim.metric_value
  ) ORDER BY pim.display_order) FILTER (WHERE pim.id IS NOT NULL), '[]') AS impact_metrics,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'text', pt2.testimonial_text,
    'author', pt2.author_name,
    'position', pt2.author_position
  )) FILTER (WHERE pt2.id IS NOT NULL), '[]') AS testimonials
FROM community_partners cp
LEFT JOIN partner_types pt ON pt.id = cp.type_id
LEFT JOIN partner_collaborations pc ON pc.partner_id = cp.id
LEFT JOIN partner_joint_events pje ON pje.partner_id = cp.id
LEFT JOIN partner_impact_metrics pim ON pim.partner_id = cp.id
LEFT JOIN partner_testimonials pt2 ON pt2.partner_id = cp.id
GROUP BY cp.id, pt.name, pt.icon;

-- Universities Full View
CREATE OR REPLACE VIEW universities_full AS
SELECT
  u.*,
  ut.name as tier_name,
  ut.color_gradient as tier_color,
  COALESCE(json_agg(DISTINCT uc.campus_city) FILTER (WHERE uc.id IS NOT NULL), '[]') AS campuses,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'text', ua.achievement_text,
    'date', ua.achievement_date
  ) ORDER BY ua.display_order) FILTER (WHERE ua.id IS NOT NULL), '[]') AS achievements,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'name', ue.event_name,
    'date', ue.event_date,
    'attendees', ue.attendees
  )) FILTER (WHERE ue.id IS NOT NULL AND ue.is_top_event = true), '[]') AS top_events,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'name', so.org_name,
    'members', so.members_count
  )) FILTER (WHERE so.id IS NOT NULL), '[]') AS student_orgs
FROM universities u
LEFT JOIN university_tiers ut ON ut.id = u.tier_id
LEFT JOIN university_campuses uc ON uc.university_id = u.id
LEFT JOIN university_achievements ua ON ua.university_id = u.id
LEFT JOIN university_events ue ON ue.university_id = u.id
LEFT JOIN student_organizations so ON so.university_id = u.id
GROUP BY u.id, ut.name, ut.color_gradient;

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS calculate_university_ranks();
DROP FUNCTION IF EXISTS get_community_partners_stats();
DROP FUNCTION IF EXISTS get_university_network_stats();

-- Calculate university rankings
CREATE OR REPLACE FUNCTION calculate_university_ranks()
RETURNS void AS $$
BEGIN
  WITH ranked_universities AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        ORDER BY
          (events_hosted * 10 + students_active * 0.01 + total_attendance * 0.005 + rating * 100) DESC
      ) as new_rank
    FROM universities
    WHERE is_active = true
  )
  UPDATE universities u
  SET rank = ru.new_rank
  FROM ranked_universities ru
  WHERE u.id = ru.id;
END;
$$ LANGUAGE plpgsql;

-- Get community partners stats
CREATE OR REPLACE FUNCTION get_community_partners_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_partners', (SELECT COUNT(*) FROM community_partners WHERE is_active = true),
    'total_collaborations', (SELECT COUNT(*) FROM partner_collaborations),
    'students_impacted', 25000,
    'joint_events', (SELECT COUNT(*) FROM partner_joint_events),
    'funding_generated', 'Rs 15M',
    'by_type', (
      SELECT json_object_agg(type_id, type_count)
      FROM (
        SELECT type_id, COUNT(*) as type_count
        FROM community_partners
        WHERE is_active = true
        GROUP BY type_id
      ) type_counts
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- Get university network stats
CREATE OR REPLACE FUNCTION get_university_network_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_universities', (SELECT COUNT(*) FROM universities WHERE is_active = true),
    'total_students', (SELECT COALESCE(SUM(students_active), 0) FROM universities),
    'total_events', (SELECT COALESCE(SUM(events_hosted), 0) FROM universities),
    'total_ambassadors', (SELECT COUNT(*) FROM campus_ambassadors WHERE status = 'active'),
    'cities', (SELECT COUNT(DISTINCT city) FROM universities WHERE is_active = true),
    'by_tier', (
      SELECT json_object_agg(tier_id, tier_count)
      FROM (
        SELECT tier_id, COUNT(*) as tier_count
        FROM universities
        WHERE is_active = true AND tier_id IS NOT NULL
        GROUP BY tier_id
      ) tier_counts
    ),
    'top_universities', (
      SELECT json_agg(json_build_object(
        'id', id,
        'name', name,
        'rank', rank,
        'tier', tier_id,
        'events', events_hosted
      ))
      FROM (
        SELECT id, name, rank, tier_id, events_hosted
        FROM universities
        WHERE is_active = true
        ORDER BY rank
        LIMIT 10
      ) top_unis
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_university_ranks() TO authenticated;
GRANT EXECUTE ON FUNCTION get_community_partners_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_university_network_stats() TO anon, authenticated;

-- ==========================================
-- SAMPLE DATA INSERTION
-- ==========================================

-- Insert sample community partners
INSERT INTO community_partners (name, type_id, logo_url, description, location, since_year, partnership_level, website, email, phone) VALUES
('Pakistan Software Houses Association (P@SHA)', 'corporate', 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop', 'Leading association representing Pakistan''s IT industry with 800+ member companies.', 'Karachi, Pakistan', 2022, 'Strategic', 'https://pasha.org.pk', 'partnerships@pasha.org.pk', '+92-21-111-774-774'),
('The Citizens Foundation (TCF)', 'ngo', 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=200&h=200&fit=crop', 'Pakistan''s leading non-profit organization focused on education for underprivileged communities.', 'Karachi, Pakistan', 2023, 'Gold', 'https://tcf.org.pk', 'info@tcf.org.pk', NULL),
('Higher Education Commission (HEC)', 'government', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&h=200&fit=crop', 'Pakistan''s apex body responsible for regulating and overseeing higher education.', 'Islamabad, Pakistan', 2022, 'Strategic', 'https://hec.gov.pk', 'info@hec.gov.pk', NULL),
('Aga Khan University', 'educational', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&h=200&fit=crop', 'Leading private university offering world-class education and research opportunities.', 'Karachi, Pakistan', 2022, 'Gold', 'https://aku.edu', 'info@aku.edu', NULL),
('Dawn News', 'media', 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=200&h=200&fit=crop', 'Pakistan''s leading English news network providing comprehensive coverage.', 'Karachi, Pakistan', 2023, 'Silver', 'https://dawn.com', 'info@dawn.com', NULL)
ON CONFLICT DO NOTHING;

-- Get partner IDs for collaborations
DO $$
DECLARE
  pasha_id UUID;
  tcf_id UUID;
BEGIN
  SELECT id INTO pasha_id FROM community_partners WHERE name = 'Pakistan Software Houses Association (P@SHA)' LIMIT 1;
  SELECT id INTO tcf_id FROM community_partners WHERE name = 'The Citizens Foundation (TCF)' LIMIT 1;

  -- Insert collaborations for P@SHA
  IF pasha_id IS NOT NULL THEN
    INSERT INTO partner_collaborations (partner_id, collaboration_text, display_order) VALUES
    (pasha_id, 'Co-hosted 15 tech conferences', 1),
    (pasha_id, 'Facilitated 500+ job placements', 2),
    (pasha_id, 'Provided mentorship to 1000+ students', 3),
    (pasha_id, 'Sponsored hackathons worth Rs 5M', 4)
    ON CONFLICT DO NOTHING;

    INSERT INTO partner_joint_events (partner_id, event_name, event_date, attendees) VALUES
    (pasha_id, 'Tech Summit 2024', '2024-03-15', 850),
    (pasha_id, 'Startup Weekend Karachi', '2023-11-10', 300),
    (pasha_id, 'AI/ML Workshop Series', '2023-09-20', 450)
    ON CONFLICT DO NOTHING;

    INSERT INTO partner_impact_metrics (partner_id, metric_name, metric_value, display_order) VALUES
    (pasha_id, 'eventsJoint', '15', 1),
    (pasha_id, 'studentsReached', '5000', 2),
    (pasha_id, 'jobsCreated', '500', 3),
    (pasha_id, 'fundingProvided', 'Rs 5M', 4)
    ON CONFLICT DO NOTHING;

    INSERT INTO partner_testimonials (partner_id, testimonial_text, author_name, author_position) VALUES
    (pasha_id, 'FSTIVO has been an excellent partner in bridging the gap between industry and academia.', 'Sajjad Mustafa Syed', 'Chairman, P@SHA')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Insert collaborations for TCF
  IF tcf_id IS NOT NULL THEN
    INSERT INTO partner_collaborations (partner_id, collaboration_text, display_order) VALUES
    (tcf_id, 'Educational workshops for TCF students', 1),
    (tcf_id, 'Technology awareness programs', 2),
    (tcf_id, 'Scholarship program for TCF graduates', 3)
    ON CONFLICT DO NOTHING;

    INSERT INTO partner_impact_metrics (partner_id, metric_name, metric_value, display_order) VALUES
    (tcf_id, 'eventsJoint', '8', 1),
    (tcf_id, 'studentsReached', '2000', 2),
    (tcf_id, 'scholarshipsProvided', '25', 3)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert sample universities
INSERT INTO universities (name, full_name, city, logo_url, tier_id, students_active, events_hosted, ambassadors_count, total_attendance, rating, joined_date) VALUES
('FAST-NUCES', 'National University of Computer & Emerging Sciences', 'Karachi', 'https://images.unsplash.com/photo-1562774053-701939374585?w=200&h=200&fit=crop', 'platinum', 2500, 35, 15, 12000, 4.9, '2022-01-15'),
('LUMS', 'Lahore University of Management Sciences', 'Lahore', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&h=200&fit=crop', 'platinum', 2200, 32, 12, 11000, 4.8, '2022-02-20'),
('NUST', 'National University of Sciences & Technology', 'Islamabad', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&h=200&fit=crop', 'gold', 1800, 28, 10, 9500, 4.7, '2022-03-10'),
('IBA Karachi', 'Institute of Business Administration', 'Karachi', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&h=200&fit=crop', 'gold', 1500, 25, 8, 8000, 4.8, '2022-04-05'),
('University of Karachi', 'University of Karachi', 'Karachi', 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=200&h=200&fit=crop', 'silver', 1200, 20, 6, 6500, 4.6, '2022-06-15'),
('UET Lahore', 'University of Engineering & Technology', 'Lahore', 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=200&h=200&fit=crop', 'silver', 1100, 18, 7, 5800, 4.5, '2022-07-20')
ON CONFLICT DO NOTHING;

-- Calculate initial rankings
SELECT calculate_university_ranks();

-- Insert sample university data
DO $$
DECLARE
  fast_id UUID;
  lums_id UUID;
  nust_id UUID;
BEGIN
  SELECT id INTO fast_id FROM universities WHERE name = 'FAST-NUCES' LIMIT 1;
  SELECT id INTO lums_id FROM universities WHERE name = 'LUMS' LIMIT 1;
  SELECT id INTO nust_id FROM universities WHERE name = 'NUST' LIMIT 1;

  -- Add campuses for FAST
  IF fast_id IS NOT NULL THEN
    INSERT INTO university_campuses (university_id, campus_city) VALUES
    (fast_id, 'Karachi'),
    (fast_id, 'Lahore'),
    (fast_id, 'Islamabad'),
    (fast_id, 'Peshawar')
    ON CONFLICT DO NOTHING;

    INSERT INTO university_achievements (university_id, achievement_text, display_order) VALUES
    (fast_id, 'Most Active University 2023', 1),
    (fast_id, 'Tech Events Leader', 2),
    (fast_id, 'Innovation Champion', 3)
    ON CONFLICT DO NOTHING;

    INSERT INTO student_organizations (university_id, org_name, members_count) VALUES
    (fast_id, 'ACM Chapter', 150),
    (fast_id, 'IEEE', 200),
    (fast_id, 'Google DSC', 180)
    ON CONFLICT DO NOTHING;

    INSERT INTO university_events (university_id, event_name, event_date, attendees, is_top_event) VALUES
    (fast_id, 'Tech Summit 2024', '2024-03-15', 850, true),
    (fast_id, 'Hackathon 2023', '2023-11-20', 300, true),
    (fast_id, 'AI Workshop Series', '2023-09-10', 450, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Add campuses for LUMS
  IF lums_id IS NOT NULL THEN
    INSERT INTO university_achievements (university_id, achievement_text, display_order) VALUES
    (lums_id, 'Business Events Champion', 1),
    (lums_id, 'Entrepreneurship Hub', 2),
    (lums_id, 'Leadership Excellence', 3)
    ON CONFLICT DO NOTHING;

    INSERT INTO student_organizations (university_id, org_name, members_count) VALUES
    (lums_id, 'Entrepreneurship Society', 180),
    (lums_id, 'Debating Society', 120),
    (lums_id, 'Sports Society', 250)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Add campuses for NUST
  IF nust_id IS NOT NULL THEN
    INSERT INTO university_campuses (university_id, campus_city) VALUES
    (nust_id, 'Islamabad'),
    (nust_id, 'Rawalpindi'),
    (nust_id, 'Risalpur')
    ON CONFLICT DO NOTHING;

    INSERT INTO university_achievements (university_id, achievement_text, display_order) VALUES
    (nust_id, 'Engineering Excellence', 1),
    (nust_id, 'Research Leader', 2),
    (nust_id, 'Innovation Award', 3)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert sample competitions
INSERT INTO inter_university_competitions (competition_name, winner_university_id, competition_date, participants_count, prize_amount, is_featured) VALUES
('National Hackathon 2024', (SELECT id FROM universities WHERE name = 'FAST-NUCES' LIMIT 1), '2024-03-20', 12, 'Rs 500K', true),
('Business Case Competition', (SELECT id FROM universities WHERE name = 'LUMS' LIMIT 1), '2024-02-15', 10, 'Rs 300K', true),
('Robotics Championship', (SELECT id FROM universities WHERE name = 'NUST' LIMIT 1), '2024-01-10', 8, 'Rs 400K', true)
ON CONFLICT DO NOTHING;
