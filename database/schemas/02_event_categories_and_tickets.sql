-- Event Categories table
CREATE TABLE IF NOT EXISTS event_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES event_categories(id) ON DELETE SET NULL;

-- Ticket Types table
CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'PKR',
  quantity_available INTEGER,
  quantity_sold INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, name)
);

-- Add additional fields to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS venue_name TEXT,
ADD COLUMN IF NOT EXISTS venue_city TEXT,
ADD COLUMN IF NOT EXISTS banner_image TEXT,
ADD COLUMN IF NOT EXISTS event_mode TEXT DEFAULT 'in-person' CHECK (event_mode IN ('in-person', 'virtual', 'hybrid')),
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

-- Insert sample categories
INSERT INTO event_categories (name, icon, description) VALUES
  ('Technology', '💻', 'Technology and software related events'),
  ('Business', '💼', 'Business and entrepreneurship events'),
  ('Science', '🔬', 'Science and research events'),
  ('Arts', '🎨', 'Arts and cultural events')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS for new tables
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_categories
CREATE POLICY "Anyone can view event categories" ON event_categories FOR SELECT USING (true);

-- RLS Policies for ticket_types
CREATE POLICY "Anyone can view ticket types" ON ticket_types FOR SELECT USING (true);
CREATE POLICY "Organizers can manage ticket types for their events" ON ticket_types FOR ALL USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = ticket_types.event_id AND events.organizer_id = auth.uid())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_mode ON events(event_mode);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(is_published);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON ticket_types(event_id);

-- Create a view for events with registration counts
CREATE OR REPLACE VIEW events_with_stats AS
SELECT
  e.*,
  ec.name AS category_name,
  ec.icon AS category_icon,
  COALESCE(COUNT(DISTINCT r.id), 0) AS registration_count
FROM events e
LEFT JOIN event_categories ec ON e.category_id = ec.id
LEFT JOIN registrations r ON r.event_id = e.id AND r.status IN ('confirmed', 'attended', 'pending')
GROUP BY e.id, ec.name, ec.icon;
