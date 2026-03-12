-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE user_roles AS ENUM ('organizer', 'volunteer', 'sponsor', 'admin', 'attendee');
CREATE TYPE organization_type AS ENUM ('university', 'company', 'nonprofit', 'government', 'other');
CREATE TYPE event_type AS ENUM ('conference', 'workshop', 'seminar', 'competition', 'networking', 'other');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'ongoing', 'completed', 'cancelled');
CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'cancelled', 'attended');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');

-- Organizations table
CREATE TABLE organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type organization_type NOT NULL,
  email TEXT,
  phone TEXT,
  address JSONB,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role user_roles DEFAULT 'attendee',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  bio TEXT,
  skills TEXT[],
  experience INTEGER,
  location TEXT,
  website TEXT,
  social_links JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  status event_status DEFAULT 'draft',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location JSONB,
  is_virtual BOOLEAN DEFAULT FALSE,
  virtual_meeting_link TEXT,
  capacity INTEGER,
  price DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'PKR',
  registration_opens_at TIMESTAMP WITH TIME ZONE,
  registration_closes_at TIMESTAMP WITH TIME ZONE,
  organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  cover_image_url TEXT,
  required_skills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registrations table
CREATE TABLE registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status registration_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  payment_amount DECIMAL(10,2),
  payment_id TEXT,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_in_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(event_id, user_id)
);

-- Volunteer opportunities table
CREATE TABLE volunteer_opportunities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  required_skills TEXT[],
  time_commitment TEXT,
  benefits TEXT[],
  capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create missing enums
CREATE TYPE volunteer_application_status AS ENUM ('pending', 'accepted', 'rejected', 'completed');
CREATE TYPE payment_method AS ENUM ('stripe', 'jazzcash', 'easypaisa', 'bank_transfer');
CREATE TYPE payment_status_type AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

-- Volunteer applications table
CREATE TABLE volunteer_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  opportunity_id UUID REFERENCES volunteer_opportunities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status volunteer_application_status DEFAULT 'pending',
  motivation TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(opportunity_id, user_id)
);

-- Payments table
CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'PKR',
  method payment_method NOT NULL,
  status payment_status_type DEFAULT 'pending',
  transaction_id TEXT,
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_volunteer_applications_opportunity ON volunteer_applications(opportunity_id);
CREATE INDEX idx_volunteer_applications_user ON volunteer_applications(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for organizations
CREATE POLICY "Anyone can view organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create organizations" ON organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for events
CREATE POLICY "Anyone can view published events" ON events FOR SELECT USING (status = 'published');
CREATE POLICY "Organizers can manage own events" ON events FOR ALL USING (organizer_id = auth.uid());

-- RLS Policies for registrations
CREATE POLICY "Users can view own registrations" ON registrations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create registrations" ON registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Organizers can view event registrations" ON registrations FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = registrations.event_id AND events.organizer_id = auth.uid())
);

-- Functions to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
