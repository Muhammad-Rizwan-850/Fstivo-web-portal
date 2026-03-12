-- Add new columns to registrations table for event registration
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT UNIQUE;

-- Create index on registration_number
CREATE INDEX IF NOT EXISTS idx_registrations_number ON registrations(registration_number);

-- Create attendees table for individual attendee information
CREATE TABLE IF NOT EXISTS attendees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  dietary_requirements TEXT,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for attendees
CREATE INDEX IF NOT EXISTS idx_attendees_registration ON attendees(registration_id);
CREATE INDEX IF NOT EXISTS idx_attendees_email ON attendees(email);

-- Enable RLS for attendees table
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendees
CREATE POLICY "Users can view attendees for their registrations" ON attendees FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM registrations r
    JOIN profiles p ON r.user_id = p.id
    WHERE r.id = attendees.registration_id AND p.id = auth.uid()
  )
);

CREATE POLICY "Users can insert attendees for their registrations" ON attendees FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.id = attendees.registration_id AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Organizers can view attendees for their events" ON attendees FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.id = attendees.registration_id AND e.organizer_id = auth.uid()
  )
);

-- Function to generate unique registration number
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'REG-' || upper(substring(encode(gen_random_bytes(12), 'base64'), 1, 9));
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate registration number
CREATE OR REPLACE FUNCTION set_registration_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.registration_number IS NULL THEN
    NEW.registration_number := generate_registration_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER registration_number_trigger
  BEFORE INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_registration_number();

-- Drop the unique constraint on event_id and user_id to allow multiple registrations
ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_event_id_user_id_key;

-- Add unique constraint on event_id, user_id, and ticket_type_id instead
-- This allows users to register multiple times with different ticket types
ALTER TABLE registrations
ADD CONSTRAINT registrations_unique_registration
UNIQUE (event_id, user_id, ticket_type_id);
