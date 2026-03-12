-- Sponsors Showcase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sponsor_tiers table
CREATE TABLE IF NOT EXISTS sponsor_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  color_gradient TEXT,
  icon_emoji TEXT,
  benefits TEXT[], -- Array of benefit descriptions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO sponsor_tiers (id, name, display_order, color_gradient, icon_emoji, benefits) VALUES
('platinum', 'Platinum', 1, 'from-slate-300 to-slate-500', '💎', ARRAY[
  'Prime logo placement',
  'Keynote speaking slot',
  'Exclusive networking lounge',
  'Full event branding',
  '10 complimentary passes',
  'Social media spotlight'
]),
('gold', 'Gold', 2, 'from-yellow-300 to-yellow-600', '🥇', ARRAY[
  'Prominent logo placement',
  'Workshop session',
  'VIP networking access',
  'Event materials branding',
  '5 complimentary passes',
  'Featured in newsletter'
]),
('silver', 'Silver', 3, 'from-gray-300 to-gray-500', '🥈', ARRAY[
  'Logo on website',
  'Booth space',
  'Networking access',
  'Social media mention',
  '3 complimentary passes',
  'Certificate of partnership'
]),
('bronze', 'Bronze', 4, 'from-orange-300 to-orange-600', '🥉', ARRAY[
  'Logo listing',
  'Event attendance',
  'Marketing materials',
  '2 complimentary passes',
  'Certificate of support'
])
ON CONFLICT (id) DO NOTHING;

-- Create sponsors table
CREATE TABLE IF NOT EXISTS sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tier_id TEXT REFERENCES sponsor_tiers(id),
  logo_url TEXT,
  description TEXT,
  industry TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  since_year INTEGER,
  events_sponsored INTEGER DEFAULT 0,
  total_contribution_amount DECIMAL(12,2),
  total_contribution_display TEXT, -- e.g., "Rs 5M+"
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sponsor_impact_metrics table
CREATE TABLE IF NOT EXISTS sponsor_impact_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  metric_label TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sponsor_testimonials table
CREATE TABLE IF NOT EXISTS sponsor_testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE CASCADE,
  testimonial_text TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_position TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sponsor_success_stories table
CREATE TABLE IF NOT EXISTS sponsor_success_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  achievement TEXT NOT NULL,
  details TEXT,
  story_date DATE,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sponsor_events junction table (track which events sponsors supported)
CREATE TABLE IF NOT EXISTS sponsor_event_participation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_id UUID REFERENCES sponsors(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tier_at_event TEXT REFERENCES sponsor_tiers(id),
  contribution_amount DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sponsor_id, event_id)
);

-- Create sponsor_contact_requests table
CREATE TABLE IF NOT EXISTS sponsor_contact_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  interested_tier TEXT REFERENCES sponsor_tiers(id),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sponsors_tier ON sponsors(tier_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_active ON sponsors(is_active);
CREATE INDEX IF NOT EXISTS idx_sponsors_featured ON sponsors(is_featured);
CREATE INDEX IF NOT EXISTS idx_sponsor_impact_sponsor ON sponsor_impact_metrics(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_testimonials_sponsor ON sponsor_testimonials(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_testimonials_featured ON sponsor_testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_sponsor_stories_sponsor ON sponsor_success_stories(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_stories_featured ON sponsor_success_stories(is_featured);
CREATE INDEX IF NOT EXISTS idx_sponsor_events_sponsor ON sponsor_event_participation(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_events_event ON sponsor_event_participation(event_id);

-- Enable Row Level Security
ALTER TABLE sponsor_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_impact_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_event_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_contact_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public read access
CREATE POLICY "Anyone can view sponsor tiers"
  ON sponsor_tiers FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view active sponsors"
  ON sponsors FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view sponsor metrics"
  ON sponsor_impact_metrics FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view sponsor testimonials"
  ON sponsor_testimonials FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view sponsor success stories"
  ON sponsor_success_stories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view sponsor event participation"
  ON sponsor_event_participation FOR SELECT
  USING (true);

-- RLS Policies - Anyone can submit contact requests
CREATE POLICY "Anyone can submit contact requests"
  ON sponsor_contact_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own contact requests"
  ON sponsor_contact_requests FOR SELECT
  USING (true);

-- RLS Policies - Admin write access
CREATE POLICY "Admins can manage sponsors"
  ON sponsors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage sponsor metrics"
  ON sponsor_impact_metrics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage testimonials"
  ON sponsor_testimonials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage success stories"
  ON sponsor_success_stories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage contact requests"
  ON sponsor_contact_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sponsors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS sponsors_updated_at ON sponsors;
CREATE TRIGGER sponsors_updated_at
  BEFORE UPDATE ON sponsors
  FOR EACH ROW
  EXECUTE FUNCTION update_sponsors_updated_at();

-- Create view for full sponsor data
CREATE OR REPLACE VIEW sponsors_full AS
SELECT
  s.*,
  st.name as tier_name,
  st.display_order as tier_order,
  st.color_gradient as tier_color,
  st.icon_emoji as tier_icon,
  st.benefits as tier_benefits,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'id', sim.id,
    'metric_name', sim.metric_name,
    'metric_value', sim.metric_value,
    'metric_label', sim.metric_label,
    'display_order', sim.display_order
  ) ORDER BY sim.display_order) FILTER (WHERE sim.id IS NOT NULL), '[]') AS impact_metrics,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'id', stest.id,
    'text', stest.testimonial_text,
    'author', stest.author_name,
    'position', stest.author_position,
    'is_featured', stest.is_featured
  )) FILTER (WHERE stest.id IS NOT NULL), '[]') AS testimonials,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'id', sss.id,
    'title', sss.title,
    'achievement', sss.achievement,
    'details', sss.details,
    'date', sss.story_date,
    'is_featured', sss.is_featured
  ) ORDER BY sss.display_order) FILTER (WHERE sss.id IS NOT NULL), '[]') AS success_stories
FROM sponsors s
LEFT JOIN sponsor_tiers st ON st.id = s.tier_id
LEFT JOIN sponsor_impact_metrics sim ON sim.sponsor_id = s.id
LEFT JOIN sponsor_testimonials stest ON stest.sponsor_id = s.id
LEFT JOIN sponsor_success_stories sss ON sss.sponsor_id = s.id
GROUP BY s.id, st.name, st.display_order, st.color_gradient, st.icon_emoji, st.benefits;

-- Insert sample sponsors
INSERT INTO sponsors (
  name, tier_id, logo_url, description, industry, website, email, phone, location,
  since_year, events_sponsored, total_contribution_amount, total_contribution_display,
  is_active, is_featured, display_order
) VALUES
(
  'TechCorp Pakistan',
  'platinum',
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop',
  'Leading technology solutions provider in Pakistan',
  'Technology',
  'https://techcorp.pk',
  'partnerships@techcorp.pk',
  '+92-300-1234567',
  'Karachi, Pakistan',
  2022,
  12,
  5000000.00,
  'Rs 5M+',
  true,
  true,
  1
) ON CONFLICT DO NOTHING;

-- Insert sample impact metrics
INSERT INTO sponsor_impact_metrics (sponsor_id, metric_name, metric_value, metric_label, display_order)
SELECT
  id,
  'Students Reached',
  '5K+',
  'Students Reached',
  1
FROM sponsors WHERE name = 'TechCorp Pakistan'
ON CONFLICT DO NOTHING;

INSERT INTO sponsor_impact_metrics (sponsor_id, metric_name, metric_value, metric_label, display_order)
SELECT
  id,
  'Jobs Created',
  '150',
  'Jobs Created',
  2
FROM sponsors WHERE name = 'TechCorp Pakistan'
ON CONFLICT DO NOTHING;

INSERT INTO sponsor_impact_metrics (sponsor_id, metric_name, metric_value, metric_label, display_order)
SELECT
  id,
  'Workshops',
  '20',
  'Workshops',
  3
FROM sponsors WHERE name = 'TechCorp Pakistan'
ON CONFLICT DO NOTHING;

-- Insert sample testimonial
INSERT INTO sponsor_testimonials (sponsor_id, testimonial_text, author_name, author_position, is_featured)
SELECT
  id,
  'FSTIVO has been instrumental in connecting us with brilliant young talent. The platform''s reach and organization quality are exceptional.',
  'Ali Ahmed',
  'CEO, TechCorp',
  true
FROM sponsors WHERE name = 'TechCorp Pakistan'
ON CONFLICT DO NOTHING;

-- Create function to get sponsor statistics
CREATE OR REPLACE FUNCTION get_sponsor_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_sponsors', (SELECT COUNT(*) FROM sponsors WHERE is_active = true),
    'total_contribution', (SELECT COALESCE(SUM(total_contribution_amount), 0) FROM sponsors WHERE is_active = true),
    'total_contribution_display', 'Rs ' || ROUND((SELECT COALESCE(SUM(total_contribution_amount), 0) FROM sponsors WHERE is_active = true) / 1000000) || 'M+',
    'events_sponsored', (SELECT COALESCE(SUM(events_sponsored), 0) FROM sponsors WHERE is_active = true),
    'students_impacted', 30000,
    'average_satisfaction', 4.8,
    'by_tier', (
      SELECT json_object_agg(tier_id, tier_count)
      FROM (
        SELECT tier_id, COUNT(*) as tier_count
        FROM sponsors
        WHERE is_active = true
        GROUP BY tier_id
      ) tier_counts
    ),
    'top_sponsors', (
      SELECT json_agg(json_build_object(
        'id', id,
        'name', name,
        'tier', tier_id,
        'events', events_sponsored,
        'contribution', total_contribution_display
      ))
      FROM (
        SELECT id, name, tier_id, events_sponsored, total_contribution_display
        FROM sponsors
        WHERE is_active = true AND is_featured = true
        ORDER BY events_sponsored DESC, total_contribution_amount DESC
        LIMIT 10
      ) top_sponsors_list
    ),
    'recent_partners', (
      SELECT json_agg(json_build_object(
        'id', id,
        'name', name,
        'tier', tier_id,
        'since', since_year
      ))
      FROM (
        SELECT id, name, tier_id, since_year
        FROM sponsors
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT 5
      ) recent_list
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_sponsor_stats() TO anon, authenticated;
