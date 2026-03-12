-- Team & Volunteers Showcase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TEAM MEMBERS TABLES
-- ============================================

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  bio TEXT,
  profile_image_url TEXT,
  cover_image_url TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  joined_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team_member_stats table
CREATE TABLE IF NOT EXISTS team_member_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  events_organized INTEGER DEFAULT 0,
  volunteers_managed INTEGER DEFAULT 0,
  hours_contributed DECIMAL(10,2) DEFAULT 0,
  projects_led INTEGER DEFAULT 0,
  mentoring_score INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_member_id)
);

-- Create team_member_achievements table
CREATE TABLE IF NOT EXISTS team_member_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  achievement_title TEXT NOT NULL,
  achievement_description TEXT,
  achievement_date DATE,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team_member_skills table
CREATE TABLE IF NOT EXISTS team_member_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_experience INTEGER,
  UNIQUE(team_member_id, skill_name)
);

-- Create team_member_social table
CREATE TABLE IF NOT EXISTS team_member_social (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT,
  username TEXT,
  UNIQUE(team_member_id, platform)
);

-- ============================================
-- VOLUNTEERS TABLES
-- ============================================

-- Create volunteer_levels table
CREATE TABLE IF NOT EXISTS volunteer_levels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL,
  max_points INTEGER,
  color_gradient TEXT,
  icon_emoji TEXT,
  benefits TEXT[],
  display_order INTEGER NOT NULL
);

-- Insert default volunteer levels
INSERT INTO volunteer_levels (id, name, min_points, max_points, color_gradient, icon_emoji, benefits, display_order) VALUES
('diamond', 'Diamond', 5000, NULL, 'from-cyan-300 to-blue-600', '💎', ARRAY[
  'Exclusive leadership opportunities',
  'VIP access to all events',
  'Priority mentorship',
  'Certificate of excellence',
  'Letter of recommendation',
  'Featured in annual report',
  'Networking with industry leaders',
  'Priority job placement support'
], 1),
('platinum', 'Platinum', 2000, 4999, 'from-slate-300 to-slate-500', '🏆', ARRAY[
  'Leadership opportunities',
  'VIP event access',
  'Mentorship program',
  'Certificate of achievement',
  'Job placement support',
  'Networking events'
], 2),
('gold', 'Gold', 1000, 1999, 'from-yellow-300 to-yellow-600', '🥇', ARRAY[
  'Team lead opportunities',
  'Priority volunteer selection',
  'Mentorship access',
  'Certificate',
  'Skill building workshops'
], 3),
('silver', 'Silver', 500, 999, 'from-gray-300 to-gray-500', '🥈', ARRAY[
  'Event coordination',
  'Skill development',
  'Certificate',
  'Networking access'
], 4),
('bronze', 'Bronze', 0, 499, 'from-orange-300 to-orange-600', '🥉', ARRAY[
  'Event participation',
  'Basic training',
  'Community access',
  'Volunteer certificate'
], 5)
ON CONFLICT (id) DO NOTHING;

-- Create volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  profile_image_url TEXT,
  bio TEXT,
  skills TEXT[],
  interests TEXT[],
  level_id TEXT REFERENCES volunteer_levels(id) DEFAULT 'bronze',
  total_points INTEGER DEFAULT 0,
  rank_position INTEGER,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  joined_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create volunteer_badges table
CREATE TABLE IF NOT EXISTS volunteer_badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_emoji TEXT,
  color TEXT,
  points_required INTEGER DEFAULT 0,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0
);

-- Insert default achievement badges
INSERT INTO volunteer_badges (id, name, description, icon_emoji, color, points_required, category, display_order) VALUES
('first_event', 'First Event', 'Completed your first event volunteering', '🎯', '#3B82F6', 50, 'milestone', 1),
('event_champion', 'Event Champion', 'Volunteered at 10+ events', '🏅', '#F59E0B', 500, 'milestone', 2),
('team_player', 'Team Player', 'Excellent teamwork in 5+ events', '🤝', '#10B981', 300, 'teamwork', 3),
('leader', 'Leader', 'Led a team of volunteers', '👑', '#8B5CF6', 1000, 'leadership', 4),
('mentor', 'Mentor', 'Mentored 5+ new volunteers', '📚', '#EC4899', 600, 'mentorship', 5),
('early_bird', 'Early Bird', 'Consistently arrived early to events', '🌅', '#FCD34D', 200, 'reliability', 6),
('super_volunteer', 'Super Volunteer', 'Completed 50+ hours of volunteering', '⚡', '#EF4444', 1000, 'dedication', 7),
('networker', 'Networker', 'Connected with 20+ partners', '🌐', '#06B6D4', 400, 'networking', 8),
('creative_mind', 'Creative Mind', 'Contributed creative solutions', '💡', '#A855F7', 350, 'innovation', 9),
('all_star', 'All Star', 'Achieved all other badges', '⭐', '#FBBF24', 5000, 'special', 10)
ON CONFLICT (id) DO NOTHING;

-- Create volunteer_badges_earned table
CREATE TABLE IF NOT EXISTS volunteer_badges_earned (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  badge_id TEXT REFERENCES volunteer_badges(id) ON DELETE CASCADE,
  earned_date TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(volunteer_id, badge_id)
);

-- Create volunteer_contributions table
CREATE TABLE IF NOT EXISTS volunteer_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  contribution_type TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  description TEXT,
  contribution_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create volunteer_event_participation table
CREATE TABLE IF NOT EXISTS volunteer_event_participation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  role TEXT,
  hours_contributed DECIMAL(5,2) DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
  feedback TEXT,
  participated_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(volunteer_id, event_id)
);

-- Create appreciation_messages table
CREATE TABLE IF NOT EXISTS appreciation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_featured ON team_members(is_featured);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_member_stats_member ON team_member_stats(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_member_achievements_member ON team_member_achievements(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_member_achievements_featured ON team_member_achievements(is_featured);
CREATE INDEX IF NOT EXISTS idx_team_member_skills_member ON team_member_skills(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_member_social_member ON team_member_social(team_member_id);

-- Volunteers indexes
CREATE INDEX IF NOT EXISTS idx_volunteers_level ON volunteers(level_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_active ON volunteers(is_active);
CREATE INDEX IF NOT EXISTS idx_volunteers_featured ON volunteers(is_featured);
CREATE INDEX IF NOT EXISTS idx_volunteers_points ON volunteers(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_volunteers_rank ON volunteers(rank_position);
CREATE INDEX IF NOT EXISTS idx_volunteer_badges_earned_volunteer ON volunteer_badges_earned(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_badges_earned_badge ON volunteer_badges_earned(badge_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_contributions_volunteer ON volunteer_contributions(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_contributions_type ON volunteer_contributions(contribution_type);
CREATE INDEX IF NOT EXISTS idx_volunteer_event_participation_volunteer ON volunteer_event_participation(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_event_participation_event ON volunteer_event_participation(event_id);
CREATE INDEX IF NOT EXISTS idx_appreciation_messages_volunteer ON appreciation_messages(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_appreciation_messages_team_member ON appreciation_messages(team_member_id);
CREATE INDEX IF NOT EXISTS idx_appreciation_messages_status ON appreciation_messages(status);
CREATE INDEX IF NOT EXISTS idx_appreciation_messages_public ON appreciation_messages(is_public, is_featured);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_social ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_badges_earned ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_event_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE appreciation_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - Public Read Access
-- ============================================

CREATE POLICY "Anyone can view team members"
  ON team_members FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view team member stats"
  ON team_member_stats FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view team member achievements"
  ON team_member_achievements FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view team member skills"
  ON team_member_skills FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view team member social"
  ON team_member_social FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view volunteer levels"
  ON volunteer_levels FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view volunteers"
  ON volunteers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view volunteer badges"
  ON volunteer_badges FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view earned badges"
  ON volunteer_badges_earned FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view volunteer contributions"
  ON volunteer_contributions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view event participation"
  ON volunteer_event_participation FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view approved appreciation messages"
  ON appreciation_messages FOR SELECT
  USING (is_public = true AND status = 'approved');

-- ============================================
-- RLS POLICIES - Public Submit Appreciation
-- ============================================

CREATE POLICY "Anyone can submit appreciation"
  ON appreciation_messages FOR INSERT
  WITH CHECK (true);

-- ============================================
-- RLS POLICIES - Admin Write Access
-- ============================================

CREATE POLICY "Admins can manage team members"
  ON team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage team stats"
  ON team_member_stats FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage team achievements"
  ON team_member_achievements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage team skills"
  ON team_member_skills FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage team social"
  ON team_member_social FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage volunteers"
  ON volunteers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage volunteer badges"
  ON volunteer_badges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage earned badges"
  ON volunteer_badges_earned FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage contributions"
  ON volunteer_contributions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage event participation"
  ON volunteer_event_participation FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage appreciation messages"
  ON appreciation_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER volunteers_updated_at
  BEFORE UPDATE ON volunteers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate and update volunteer level
CREATE OR REPLACE FUNCTION update_volunteer_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level_id TEXT;
BEGIN
  -- Determine level based on total_points
  SELECT id INTO new_level_id
  FROM volunteer_levels
  WHERE NEW.total_points >= min_points
  ORDER BY min_points DESC
  LIMIT 1;

  IF new_level_id IS NOT NULL THEN
    NEW.level_id := new_level_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for volunteer level updates
CREATE TRIGGER update_volunteer_level_trigger
  BEFORE INSERT OR UPDATE OF total_points ON volunteers
  FOR EACH ROW
  EXECUTE FUNCTION update_volunteer_level();

-- Function to calculate volunteer ranks
CREATE OR REPLACE FUNCTION calculate_volunteer_ranks()
RETURNS VOID AS $$
BEGIN
  WITH ranked_volunteers AS (
    UPDATE volunteers
    SET rank_position = ranks.rank
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC, created_at ASC) as rank
      FROM volunteers
      WHERE is_active = true
    ) ranks
    WHERE volunteers.id = ranks.id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR DATA AGGREGATION
-- ============================================

-- Create view for full team member data
CREATE OR REPLACE VIEW team_members_full AS
SELECT
  tm.*,
  tms.events_organized,
  tms.volunteers_managed,
  tms.hours_contributed,
  tms.projects_led,
  tms.mentoring_score,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'id', tma.id,
    'title', tma.achievement_title,
    'description', tma.achievement_description,
    'date', tma.achievement_date,
    'is_featured', tma.is_featured,
    'display_order', tma.display_order
  ) ORDER BY tma.display_order) FILTER (WHERE tma.id IS NOT NULL), '[]') AS achievements,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'skill_name', tmskill.skill_name,
    'skill_level', tmskill.skill_level,
    'years_experience', tmskill.years_experience
  )) FILTER (WHERE tmskill.id IS NOT NULL), '[]') AS skills,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'platform', tmsoc.platform,
    'url', tmsoc.url,
    'username', tmsoc.username
  )) FILTER (WHERE tmsoc.id IS NOT NULL), '[]') AS social_links
FROM team_members tm
LEFT JOIN team_member_stats tms ON tms.team_member_id = tm.id
LEFT JOIN team_member_achievements tma ON tma.team_member_id = tm.id
LEFT JOIN team_member_skills tmskill ON tmskill.team_member_id = tm.id
LEFT JOIN team_member_social tmsoc ON tmsoc.team_member_id = tm.id
WHERE tm.is_active = true
GROUP BY tm.id, tms.events_organized, tms.volunteers_managed, tms.hours_contributed,
         tms.projects_led, tms.mentoring_score;

-- Create view for full volunteer data
CREATE OR REPLACE VIEW volunteers_full AS
SELECT
  v.*,
  vl.name as level_name,
  vl.min_points as level_min_points,
  vl.max_points as level_max_points,
  vl.color_gradient as level_color,
  vl.icon_emoji as level_icon,
  vl.benefits as level_benefits,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'id', vb.id,
    'name', vb.name,
    'description', vb.description,
    'icon_emoji', vb.icon_emoji,
    'color', vb.color,
    'category', vb.category,
    'earned_date', vbe.earned_date
  ) ORDER BY vb.display_order) FILTER (WHERE vbe.id IS NOT NULL), '[]') AS badges,
  COALESCE(SUM(vep.hours_contributed), 0) as total_hours,
  COALESCE(COUNT(DISTINCT vep.event_id), 0) as events_participated
FROM volunteers v
LEFT JOIN volunteer_levels vl ON vl.id = v.level_id
LEFT JOIN volunteer_badges_earned vbe ON vbe.volunteer_id = v.id
LEFT JOIN volunteer_badges vb ON vb.id = vbe.badge_id
LEFT JOIN volunteer_event_participation vep ON vep.volunteer_id = v.id
WHERE v.is_active = true
GROUP BY v.id, vl.name, vl.min_points, vl.max_points, vl.color_gradient,
         vl.icon_emoji, vl.benefits;

-- Function to get team and volunteer statistics
CREATE OR REPLACE FUNCTION get_team_volunteer_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'team', json_build_object(
      'total_members', (SELECT COUNT(*) FROM team_members WHERE is_active = true),
      'departments', (SELECT json_object_agg(department, dept_count) FROM (
        SELECT department, COUNT(*) as dept_count
        FROM team_members
        WHERE is_active = true AND department IS NOT NULL
        GROUP BY department
      ) dept_counts),
      'total_events_organized', (SELECT COALESCE(SUM(events_organized), 0) FROM team_member_stats),
      'total_volunteers_managed', (SELECT COALESCE(SUM(volunteers_managed), 0) FROM team_member_stats),
      'total_hours', (SELECT COALESCE(SUM(hours_contributed), 0) FROM team_member_stats)
    ),
    'volunteers', json_build_object(
      'total_volunteers', (SELECT COUNT(*) FROM volunteers WHERE is_active = true),
      'total_points', (SELECT COALESCE(SUM(total_points), 0) FROM volunteers WHERE is_active = true),
      'total_hours', (SELECT COALESCE(SUM(hours_contributed), 0) FROM volunteer_event_participation),
      'by_level', (
        SELECT json_object_agg(level_name, level_count)
        FROM (
          SELECT vl.name as level_name, COUNT(*) as level_count
          FROM volunteers v
          JOIN volunteer_levels vl ON vl.id = v.level_id
          WHERE v.is_active = true
          GROUP BY vl.name
        ) level_counts
      ),
      'badges_earned', (SELECT COUNT(*) FROM volunteer_badges_earned),
      'top_performers', (
        SELECT json_agg(json_build_object(
          'id', id,
          'name', name,
          'level', level_id,
          'points', total_points,
          'rank', rank_position,
          'events', events_participated,
          'hours', total_hours
        ))
        FROM volunteers_full
        WHERE is_active = true
        ORDER BY total_points DESC
        LIMIT 10
      )
    ),
    'achievements', json_build_object(
      'badges_available', (SELECT COUNT(*) FROM volunteer_badges WHERE is_active = true),
      'total_badges_earned', (SELECT COUNT(*) FROM volunteer_badges_earned),
      'appreciation_messages', (SELECT COUNT(*) FROM appreciation_messages WHERE status = 'approved')
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_team_volunteer_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_volunteer_ranks() TO anon, authenticated;

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert sample team members
INSERT INTO team_members (
  name, role, department, bio, email, phone, location,
  is_active, is_featured, display_order, joined_date
) VALUES
(
  'Fatima Hassan',
  'Executive Director',
  'Leadership',
  'Leading FSTIVO with 10+ years of experience in event management and youth empowerment.',
  'fatima.hassan@fstivo.com',
  '+92-300-1111111',
  'Lahore, Pakistan',
  true,
  true,
  1,
  '2020-01-15'
),
(
  'Ahmed Khan',
  'Technical Lead',
  'Technology',
  'Full-stack developer passionate about building scalable platforms for student success.',
  'ahmed.khan@fstivo.com',
  '+92-300-2222222',
  'Karachi, Pakistan',
  true,
  true,
  2,
  '2021-03-20'
),
(
  'Sara Ali',
  'Events Coordinator',
  'Operations',
  'Expert in organizing large-scale university events with attention to detail.',
  'sara.ali@fstivo.com',
  '+92-300-3333333',
  'Islamabad, Pakistan',
  true,
  true,
  3,
  '2021-06-10'
),
(
  'Usman Malik',
  'Volunteer Manager',
  'Community',
  'Building and leading volunteer teams across Pakistan.',
  'usman.malik@fstivo.com',
  '+92-300-4444444',
  'Faisalabad, Pakistan',
  true,
  false,
  4,
  '2022-02-01'
)
ON CONFLICT DO NOTHING;

-- Insert team member stats
INSERT INTO team_member_stats (team_member_id, events_organized, volunteers_managed, hours_contributed, projects_led, mentoring_score)
SELECT
  id,
  (CASE name
    WHEN 'Fatima Hassan' THEN 50
    WHEN 'Ahmed Khan' THEN 15
    WHEN 'Sara Ali' THEN 35
    WHEN 'Usman Malik' THEN 25
    ELSE 0
  END),
  (CASE name
    WHEN 'Fatima Hassan' THEN 500
    WHEN 'Usman Malik' THEN 350
    WHEN 'Sara Ali' THEN 200
    ELSE 50
  END),
  (CASE name
    WHEN 'Fatima Hassan' THEN 2500.00
    WHEN 'Sara Ali' THEN 1800.00
    WHEN 'Usman Malik' THEN 1500.00
    ELSE 800.00
  END),
  (CASE name
    WHEN 'Fatima Hassan' THEN 20
    WHEN 'Ahmed Khan' THEN 10
    WHEN 'Sara Ali' THEN 15
    ELSE 5
  END),
  (CASE name
    WHEN 'Fatima Hassan' THEN 95
    WHEN 'Usman Malik' THEN 90
    ELSE 85
  END)
FROM team_members
ON CONFLICT (team_member_id) DO NOTHING;

-- Insert team member skills
INSERT INTO team_member_skills (team_member_id, skill_name, skill_level, years_experience)
SELECT
  tm.id,
  s.skill_name,
  s.skill_level,
  s.years_experience
FROM team_members tm
CROSS JOIN (
  VALUES
    ('Fatima Hassan', 'Leadership', 'expert', 12),
    ('Fatima Hassan', 'Strategic Planning', 'expert', 10),
    ('Ahmed Khan', 'React', 'expert', 6),
    ('Ahmed Khan', 'TypeScript', 'expert', 5),
    ('Ahmed Khan', 'Node.js', 'advanced', 4),
    ('Sara Ali', 'Event Management', 'expert', 8),
    ('Sara Ali', 'Logistics', 'advanced', 6),
    ('Usman Malik', 'Team Building', 'expert', 7),
    ('Usman Malik', 'Public Speaking', 'advanced', 5)
) s(skill_name, skill_level, years_experience)
WHERE tm.name = s.skill_name
ON CONFLICT (team_member_id, skill_name) DO NOTHING;

-- Insert sample volunteers
INSERT INTO volunteers (
  name, email, phone, location, bio, level_id, total_points, is_active, is_featured, joined_date
) VALUES
(
  'Zainab Ahmed',
  'zainab.ahmed@student.com',
  '+92-301-5555555',
  'Lahore, Pakistan',
  'Passionate about event management and community service.',
  'gold',
  1200,
  true,
  true,
  '2023-01-10'
),
(
  'Ali Raza',
  'ali.raza@student.com',
  '+92-301-6666666',
  'Karachi, Pakistan',
  'Computer science student love helping with tech events.',
  'platinum',
  2500,
  true,
  true,
  '2022-09-15'
),
(
  'Hira Shah',
  'hira.shah@student.com',
  '+92-301-7777777',
  'Islamabad, Pakistan',
  'Dedicated volunteer with excellent organizational skills.',
  'gold',
  1450,
  true,
  true,
  '2023-03-20'
),
(
  'Bilal Malik',
  'bilal.malik@student.com',
  '+92-301-8888888',
  'Faisalabad, Pakistan',
  'Active community member and event enthusiast.',
  'silver',
  650,
  true,
  false,
  '2023-06-01'
)
ON CONFLICT DO NOTHING;

-- Insert volunteer badges earned
INSERT INTO volunteer_badges_earned (volunteer_id, badge_id)
SELECT
  v.id,
  b.badge_id
FROM volunteers v
CROSS JOIN (
  VALUES
    ('Zainab Ahmed', 'first_event'),
    ('Zainab Ahmed', 'team_player'),
    ('Zainab Ahmed', 'early_bird'),
    ('Ali Raza', 'first_event'),
    ('Ali Raza', 'event_champion'),
    ('Ali Raza', 'leader'),
    ('Ali Raza', 'mentor'),
    ('Hira Shah', 'first_event'),
    ('Hira Shah', 'team_player'),
    ('Bilal Malik', 'first_event')
) b(badge_id)
WHERE v.name = b.badge_id
ON CONFLICT (volunteer_id, badge_id) DO NOTHING;

-- Insert sample appreciation messages
INSERT INTO appreciation_messages (
  sender_name, sender_email, volunteer_id, message, is_public, is_featured, status
) VALUES
(
  'TechCorp Pakistan',
  'partnerships@techcorp.pk',
  (SELECT id FROM volunteers WHERE name = 'Ali Raza'),
  'Ali was exceptional at our tech workshop! His technical knowledge and willingness to help others made the event a huge success.',
  true,
  true,
  'approved'
),
(
  'University of Lahore',
  'events@uol.edu.pk',
  (SELECT id FROM volunteers WHERE name = 'Zainab Ahmed'),
  'Zainab''s organizational skills and positive attitude made our career fair memorable. Highly recommend!',
  true,
  true,
  'approved'
),
(
  'National Bank',
  'hr@nbp.com.pk',
  (SELECT id FROM volunteers WHERE name = 'Hira Shah'),
  'Professional, punctual, and proactive. Hira is an outstanding volunteer.',
  true,
  false,
  'approved'
)
ON CONFLICT DO NOTHING;

-- Update volunteer ranks
SELECT calculate_volunteer_ranks();
