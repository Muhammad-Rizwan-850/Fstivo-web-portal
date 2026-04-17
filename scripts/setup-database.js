#!/usr/bin/env node
/**
 * FSTIVO - Database Setup Script
 * Executes SQL schema via Supabase REST API
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = 'https://rdxvpeymkezsumkxjiui.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkeHZwZXlta2V6c3Vta3hqaXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MjExNTksImV4cCI6MjA5MTk5NzE1OX0.P5m85K8J9Bsc-zohv57qfJ55_Am9vFVnlk68gRmQ8BQ';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkeHZwZXlta2V6c3Vta3hqaXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQyMTE1OSwiZXhwIjoyMDkxOTk3MTU5fQ.FohBoT8lNdQ6lW67FVmgR6NVCtNqzIJMim0keiXo_Tc';

console.log('🚀 FSTIVO Database Setup\n');
console.log(`📍 Project: ${SUPABASE_URL}\n`);

// Read schema file
const schemaPath = path.join(__dirname, '../supabase/schema.sql');

if (!fs.existsSync(schemaPath)) {
  console.error('❌ Schema file not found:', schemaPath);
  process.exit(1);
}

const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

console.log('📄 Schema loaded. Please execute via SQL Editor:\n');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('MANUAL SETUP INSTRUCTIONS:\n');
console.log('1. Open SQL Editor:');
console.log(`   ${SUPABASE_URL}/sql/new\n`);
console.log('2. Copy the schema from:');
console.log(`   ${schemaPath}\n`);
console.log('3. Paste into SQL Editor and click "Run"\n`);
console.log('4. Verify tables created:');
console.log(`   ${SUPABASE_URL}/database/tables\n`);
console.log('═══════════════════════════════════════════════════════════════════\n');

// Create a minimal schema for quick setup
const minimalSchema = `
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(300),
  avatar_url TEXT,
  phone VARCHAR(50),
  role TEXT DEFAULT 'attendee',
  bio TEXT,
  location VARCHAR(200),
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location VARCHAR(500),
  venue_name VARCHAR(300),
  capacity INTEGER,
  status VARCHAR(50) DEFAULT 'draft',
  banner_url TEXT,
  organizer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrations
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  ticket_type VARCHAR(100),
  amount DECIMAL(10,2),
  payment_status VARCHAR(50) DEFAULT 'pending',
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'PKR',
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(100),
  title VARCHAR(500),
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check-ins
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES registrations(id),
  checked_in_by UUID REFERENCES profiles(id),
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  method VARCHAR(50) DEFAULT 'qr'
);

-- Volunteers
CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  role VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  hours_logged DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  certificate_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  unique_id VARCHAR(255) UNIQUE
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT TO public USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT TO public USING (true);
CREATE POLICY "Organizers can create events" ON events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Organizers can update own events" ON events FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can view own registrations" ON registrations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create registrations" ON registrations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own registrations" ON registrations FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can view own payments" ON payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Check-ins are viewable by authenticated users" ON check_ins FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own volunteer records" ON volunteers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own certificates" ON certificates FOR SELECT TO authenticated USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_event ON check_ins(event_id);
`;

console.log('═══════════════════════════════════════════════════════════════════');
console.log('QUICK START MINIMAL SCHEMA:\n');
console.log('Copy and paste this into the SQL Editor for a quick setup:\n');
console.log('═══════════════════════════════════════════════════════════════════');
console.log(minimalSchema);
console.log('═══════════════════════════════════════════════════════════════════\n');

console.log('✅ Setup guide complete!');
console.log('\nNext steps:');
console.log('1. Execute the schema in SQL Editor');
console.log('2. Enable Realtime for key tables');
console.log('3. Test connection: npm run dev');
