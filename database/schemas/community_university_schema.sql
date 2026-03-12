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
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
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
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage universities" ON universities FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS community_partners_updated_at ON community_partners;
CREATE TRIGGER community_partners_updated_at
  BEFORE UPDATE ON community_partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS universities_updated_at ON universities;
CREATE TRIGGER universities_updated_at
  BEFORE UPDATE ON universities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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

-- ==========================================
-- VIEWS
-- ==========================================

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
-- STATS FUNCTIONS
-- ==========================================

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
-- SAMPLE DATA
-- ==========================================

-- Insert sample community partners
INSERT INTO community_partners (
  name, type_id, logo_url, description, location, since_year, partnership_level,
  website, email, phone, is_active, is_featured, display_order
) VALUES
(
  'Pakistan Software Houses Association (P@SHA)',
  'corporate',
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop',
  'Leading association representing Pakistan''s IT industry with 800+ member companies.',
  'Karachi, Pakistan',
  2022,
  'Strategic',
  'https://pasha.org.pk',
  'partnerships@pasha.org.pk',
  '+92-21-111-774-774',
  true,
  true,
  1
),
(
  'The Citizens Foundation (TCF)',
  'ngo',
  'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=200&h=200&fit=crop',
  'Pakistan''s leading non-profit organization focused on education for underprivileged communities.',
  'Karachi, Pakistan',
  2023,
  'Gold',
  'https://tcf.org.pk',
  'info@tcf.org.pk',
  NULL,
  true,
  true,
  2
),
(
  'Higher Education Commission (HEC)',
  'government',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&h=200&fit=crop',
  'Pakistan''s apex body responsible for regulating and overseeing higher education.',
  'Islamabad, Pakistan',
  2022,
  'Strategic',
  'https://hec.gov.pk',
  'info@hec.gov.pk',
  NULL,
  true,
  true,
  3
)
ON CONFLICT DO NOTHING;

-- Insert sample collaborations
INSERT INTO partner_collaborations (partner_id, collaboration_text, display_order)
SELECT
  id,
  collab_text,
  collab_order
FROM community_partners, (
  VALUES
    ('Pakistan Software Houses Association (P@SHA)', 'Co-hosted 15 tech conferences', 1),
    ('Pakistan Software Houses Association (P@SHA)', 'Facilitated 500+ job placements', 2),
    ('The Citizens Foundation (TCF)', 'Educational workshops for TCF students', 1),
    ('Higher Education Commission (HEC)', 'Accreditation support for events', 1)
) sample(id, collab_text, collab_order)
WHERE community_partners.name = sample.id
ON CONFLICT DO NOTHING;

-- Insert sample joint events
INSERT INTO partner_joint_events (partner_id, event_name, event_date, attendees)
SELECT
  cp.id,
  event_name,
  event_date::date,
  attendees
FROM community_partners cp
CROSS JOIN (
  VALUES
    ('Pakistan Software Houses Association (P@SHA)', 'Tech Summit 2024', '2024-03-15', 850),
    ('The Citizens Foundation (TCF)', 'Education Technology Fair', '2023-12-10', 600),
    ('Higher Education Commission (HEC)', 'National Research Symposium', '2024-02-20', 1200)
) events(partner_name, event_name, event_date, attendees)
WHERE cp.name = events.partner_name
ON CONFLICT DO NOTHING;

-- Insert sample impact metrics
INSERT INTO partner_impact_metrics (partner_id, metric_name, metric_value, display_order)
SELECT
  cp.id,
  metric_name,
  metric_value,
  metric_order
FROM community_partners cp
CROSS JOIN (
  VALUES
    ('Pakistan Software Houses Association (P@SHA)', 'eventsJoint', '15', 1),
    ('Pakistan Software Houses Association (P@SHA)', 'studentsReached', '5000', 2),
    ('The Citizens Foundation (TCF)', 'eventsJoint', '8', 1),
    ('Higher Education Commission (HEC)', 'universitiesConnected', '45', 1)
) metrics(partner_name, metric_name, metric_value, metric_order)
WHERE cp.name = metrics.partner_name
ON CONFLICT DO NOTHING;

-- Insert sample universities
INSERT INTO universities (
  name, full_name, city, logo_url, tier_id, students_active, events_hosted,
  ambassadors_count, total_attendance, rating, joined_date, is_active, is_featured, display_order
) VALUES
(
  'FAST-NUCES',
  'National University of Computer & Emerging Sciences',
  'Karachi',
  'https://images.unsplash.com/photo-1562774053-701939374585?w=200&h=200&fit=crop',
  'platinum',
  2500,
  35,
  15,
  12000,
  4.9,
  '2022-01-15',
  true,
  true,
  1
),
(
  'LUMS',
  'Lahore University of Management Sciences',
  'Lahore',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&h=200&fit=crop',
  'platinum',
  2200,
  32,
  12,
  11000,
  4.8,
  '2022-02-01',
  true,
  true,
  2
),
(
  'NUST',
  'National University of Sciences & Technology',
  'Islamabad',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&h=200&fit=crop',
  'gold',
  1800,
  28,
  10,
  9500,
  4.7,
  '2022-03-10',
  true,
  true,
  3
)
ON CONFLICT DO NOTHING;

-- Insert sample campuses
INSERT INTO university_campuses (university_id, campus_city)
SELECT
  u.id,
  campus_city
FROM universities u
CROSS JOIN (
  VALUES
    ('FAST-NUCES', 'Karachi'),
    ('FAST-NUCES', 'Lahore'),
    ('FAST-NUCES', 'Islamabad'),
    ('LUMS', 'Lahore'),
    ('NUST', 'Islamabad')
) campuses(uni_name, campus_city)
WHERE u.name = campuses.uni_name
ON CONFLICT DO NOTHING;

-- Insert sample achievements
INSERT INTO university_achievements (university_id, achievement_text, display_order)
SELECT
  u.id,
  achievement_text,
  achievement_order
FROM universities u
CROSS JOIN (
  VALUES
    ('FAST-NUCES', 'Most Active University 2023', 1),
    ('FAST-NUCES', 'Tech Events Leader', 2),
    ('LUMS', 'Business Events Champion', 1),
    ('NUST', 'Engineering Excellence', 1)
) achievements(uni_name, achievement_text, achievement_order)
WHERE u.name = achievements.uni_name
ON CONFLICT DO NOTHING;

-- Insert sample student organizations
INSERT INTO student_organizations (university_id, org_name, members_count)
SELECT
  u.id,
  org_name,
  members_count
FROM universities u
CROSS JOIN (
  VALUES
    ('FAST-NUCES', 'ACM Chapter', 150),
    ('FAST-NUCES', 'IEEE', 200),
    ('LUMS', 'Entrepreneurship Society', 180),
    ('NUST', 'Robotics Club', 100)
) orgs(uni_name, org_name, members_count)
WHERE u.name = orgs.uni_name
ON CONFLICT DO NOTHING;

-- Calculate university rankings
SELECT calculate_university_ranks();

-- Insert sample competitions
INSERT INTO inter_university_competitions (
  competition_name, winner_university_id, competition_date, participants_count, prize_amount, is_featured
)
SELECT
  comp_name,
  u.id,
  comp_date::date,
  participants,
  prize,
  true
FROM universities u
CROSS JOIN (
  VALUES
    ('National Hackathon 2024', 'FAST-NUCES', '2024-03-01', 12, 'Rs 500K'),
    ('Business Case Competition', 'LUMS', '2024-02-15', 10, 'Rs 300K'),
    ('Robotics Championship', 'NUST', '2024-01-20', 8, 'Rs 400K')
) competitions(comp_name, uni_name, comp_date, participants, prize)
WHERE u.name = competitions.uni_name
ON CONFLICT DO NOTHING;
