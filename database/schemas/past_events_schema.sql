-- Past Events Showcase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create past_events_showcase table
CREATE TABLE IF NOT EXISTS past_events_showcase (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  year INTEGER NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  attendees_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0.0,
  featured_image TEXT,
  video_url TEXT,
  highlights TEXT[], -- Array of highlight text
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_gallery table
CREATE TABLE IF NOT EXISTS event_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  showcase_event_id UUID REFERENCES past_events_showcase(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_testimonials table
CREATE TABLE IF NOT EXISTS event_testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  showcase_event_id UUID REFERENCES past_events_showcase(id) ON DELETE CASCADE,
  attendee_name TEXT NOT NULL,
  attendee_role TEXT,
  attendee_university TEXT,
  testimonial_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_impact_metrics table
CREATE TABLE IF NOT EXISTS event_impact_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  showcase_event_id UUID REFERENCES past_events_showcase(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  metric_description TEXT,
  icon_name TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_past_events_year ON past_events_showcase(year);
CREATE INDEX IF NOT EXISTS idx_past_events_category ON past_events_showcase(category);
CREATE INDEX IF NOT EXISTS idx_past_events_featured ON past_events_showcase(is_featured);
CREATE INDEX IF NOT EXISTS idx_past_events_rating ON past_events_showcase(rating DESC);
CREATE INDEX IF NOT EXISTS idx_event_gallery_showcase ON event_gallery(showcase_event_id);
CREATE INDEX IF NOT EXISTS idx_event_testimonials_showcase ON event_testimonials(showcase_event_id);
CREATE INDEX IF NOT EXISTS idx_event_testimonials_featured ON event_testimonials(is_featured);

-- Enable Row Level Security
ALTER TABLE past_events_showcase ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_impact_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public read access
CREATE POLICY "Anyone can view past events showcase"
  ON past_events_showcase FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view event gallery"
  ON event_gallery FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view testimonials"
  ON event_testimonials FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view impact metrics"
  ON event_impact_metrics FOR SELECT
  USING (true);

-- RLS Policies - Admin write access
CREATE POLICY "Admins can insert past events showcase"
  ON past_events_showcase FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update past events showcase"
  ON past_events_showcase FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete past events showcase"
  ON past_events_showcase FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Similar policies for other tables
CREATE POLICY "Admins can insert event gallery"
  ON event_gallery FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update event gallery"
  ON event_gallery FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete event gallery"
  ON event_gallery FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert testimonials"
  ON event_testimonials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update testimonials"
  ON event_testimonials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete testimonials"
  ON event_testimonials FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_past_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS past_events_updated_at ON past_events_showcase;
CREATE TRIGGER past_events_updated_at
  BEFORE UPDATE ON past_events_showcase
  FOR EACH ROW
  EXECUTE FUNCTION update_past_events_updated_at();

-- Create view for easy querying
CREATE OR REPLACE VIEW past_events_showcase_full AS
SELECT
  pes.*,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'id', eg.id,
    'image_url', eg.image_url,
    'caption', eg.caption,
    'display_order', eg.display_order
  )) FILTER (WHERE eg.id IS NOT NULL), '[]') AS gallery,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'id', et.id,
    'name', et.attendee_name,
    'role', et.attendee_role,
    'university', et.attendee_university,
    'text', et.testimonial_text,
    'rating', et.rating,
    'is_featured', et.is_featured
  )) FILTER (WHERE et.id IS NOT NULL), '[]') AS testimonials,
  COALESCE(json_agg(DISTINCT jsonb_build_object(
    'id', eim.id,
    'name', eim.metric_name,
    'value', eim.metric_value,
    'description', eim.metric_description,
    'icon', eim.icon_name
  )) FILTER (WHERE eim.id IS NOT NULL), '[]') AS impact_metrics
FROM past_events_showcase pes
LEFT JOIN event_gallery eg ON eg.showcase_event_id = pes.id
LEFT JOIN event_testimonials et ON et.showcase_event_id = pes.id
LEFT JOIN event_impact_metrics eim ON eim.showcase_event_id = pes.id
GROUP BY pes.id;
