-- ============================================================================
-- FSTIVO PLATFORM - COMPLETE DATABASE SCHEMA
-- Version: 1.0.0
-- Description: Full database schema for Fstivo event management platform
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
-- CORE TABLES
-- ============================================================================

-- Event Categories
CREATE TABLE IF NOT EXISTS event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  description TEXT,
  color VARCHAR(20),
  parent_category_id UUID REFERENCES event_categories(id),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Fields/Subcategories
CREATE TABLE IF NOT EXISTS event_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES event_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  keywords TEXT[],
  industry_tags TEXT[],
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- Organizations Table (universities, companies, etc.)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(300),
  avatar_url TEXT,
  phone VARCHAR(50),
  role user_roles DEFAULT 'attendee',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  bio TEXT,
  skills TEXT[],
  experience INT,
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  category_id UUID REFERENCES event_categories(id),
  field_id UUID REFERENCES event_fields(id),

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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  total_amount DECIMAL(10,2),

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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(300) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- VOLUNTEER MANAGEMENT SYSTEM
-- ============================================================================

-- Volunteer profiles table
CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  total_hours DECIMAL(10,2) DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  skills TEXT[],
  availability JSONB,
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  bio TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  resume_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Volunteer activities table
CREATE TABLE IF NOT EXISTS volunteer_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL,
  hours DECIMAL(5,2) NOT NULL,
  points_earned INTEGER NOT NULL,
  amount_earned DECIMAL(10,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  supervisor_id UUID REFERENCES profiles(id),
  supervisor_notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- Point system configuration
CREATE TABLE IF NOT EXISTS activity_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type VARCHAR(50) UNIQUE NOT NULL,
  base_points INTEGER NOT NULL,
  base_rate DECIMAL(10,2) NOT NULL,
  tier_multipliers JSONB DEFAULT '{"bronze": 1, "silver": 1.2, "gold": 1.4, "platinum": 1.6}',
  description TEXT,
  estimated_hours DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Volunteer payouts table
CREATE TABLE IF NOT EXISTS volunteer_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_points INTEGER NOT NULL,
  total_hours DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) CHECK (payment_method IN ('bank_transfer', 'jazzcash', 'easypaisa', 'crypto')),
  payment_details JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  transaction_id VARCHAR(200),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS volunteer_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  method_type VARCHAR(50) NOT NULL CHECK (method_type IN ('bank_transfer', 'jazzcash', 'easypaisa', 'crypto')),
  account_title VARCHAR(200),
  account_number VARCHAR(200),
  bank_name VARCHAR(100),
  jazzcash_number VARCHAR(20),
  easypaisa_number VARCHAR(20),
  crypto_address TEXT,
  is_default BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CERTIFICATION SYSTEM
-- ============================================================================

-- Certification types configuration
CREATE TABLE IF NOT EXISTS certification_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  tier VARCHAR(50) NOT NULL,
  min_hours DECIMAL(10,2) NOT NULL,
  min_events INTEGER NOT NULL,
  min_rating DECIMAL(3,2),
  required_skills TEXT[],
  prerequisites TEXT[],
  validity_months INTEGER,
  price DECIMAL(10,2) DEFAULT 0,
  template_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  certification_type_id UUID REFERENCES certification_types(id),
  certificate_number VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  skills_covered TEXT[],
  hours_completed DECIMAL(10,2) NOT NULL,
  events_completed INTEGER NOT NULL,
  issuer VARCHAR(100) DEFAULT 'Fstivo',
  co_issuers TEXT[],
  issue_date DATE NOT NULL,
  expiry_date DATE,
  qr_code TEXT UNIQUE,
  blockchain_hash VARCHAR(200) UNIQUE,
  blockchain_tx_id TEXT,
  verification_url TEXT UNIQUE,
  pdf_url TEXT,
  linkedin_share_url TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'revoked')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificate endorsements
CREATE TABLE IF NOT EXISTS certificate_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID REFERENCES certifications(id) ON DELETE CASCADE,
  endorser_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endorser_name VARCHAR(200),
  endorser_title VARCHAR(200),
  endorser_organization VARCHAR(200),
  relationship VARCHAR(100),
  endorsement_text TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificate verification logs
CREATE TABLE IF NOT EXISTS certificate_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID REFERENCES certifications(id) ON DELETE CASCADE,
  verified_by VARCHAR(200),
  verification_type VARCHAR(50) CHECK (verification_type IN ('qr_scan', 'manual', 'api', 'link')),
  ip_address INET,
  user_agent TEXT,
  location JSONB,
  verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CORPORATE PARTNERSHIP SYSTEM
-- ============================================================================

-- Corporate partners table
CREATE TABLE IF NOT EXISTS corporate_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  industry VARCHAR(100),
  logo_url TEXT,
  banner_url TEXT,
  website VARCHAR(200),
  description TEXT,
  company_size VARCHAR(50),
  founded_year INTEGER,
  headquarters_location VARCHAR(200),
  contact_person_name VARCHAR(200),
  contact_person_email VARCHAR(200),
  contact_person_phone VARCHAR(50),
  partnership_tier VARCHAR(50) DEFAULT 'bronze' CHECK (partnership_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  partnership_start_date DATE,
  partnership_end_date DATE,
  services JSONB,
  annual_budget DECIMAL(12,2),
  total_spent DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company representatives
CREATE TABLE IF NOT EXISTS company_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES corporate_partners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(100) DEFAULT 'representative',
  is_primary BOOLEAN DEFAULT false,
  can_post_jobs BOOLEAN DEFAULT true,
  can_view_applications BOOLEAN DEFAULT true,
  can_manage_sponsorships BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Job postings table
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES corporate_partners(id) ON DELETE CASCADE,
  posted_by UUID REFERENCES profiles(id),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[],
  responsibilities TEXT[],
  benefits TEXT[],
  location VARCHAR(200),
  location_type VARCHAR(50) CHECK (location_type IN ('on-site', 'remote', 'hybrid')),
  job_type VARCHAR(50) CHECK (job_type IN ('full-time', 'part-time', 'internship', 'contract', 'freelance')),
  experience_level VARCHAR(50) CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
  salary_min DECIMAL(12,2),
  salary_max DECIMAL(12,2),
  salary_currency VARCHAR(10) DEFAULT 'PKR',
  application_deadline DATE,
  required_skills TEXT[],
  preferred_skills TEXT[],
  preferred_certifications TEXT[],
  applicants_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'paused', 'filled')),
  is_featured BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Job applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resume_url TEXT,
  cover_letter TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  volunteer_profile_id UUID REFERENCES volunteers(id),
  certifications UUID[],
  answers JSONB,
  status VARCHAR(50) DEFAULT 'applied' CHECK (status IN ('applied', 'under_review', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn')),
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  interview_scheduled_at TIMESTAMPTZ,
  interviewed_at TIMESTAMPTZ,
  offered_at TIMESTAMPTZ,
  hired_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  metadata JSONB
);

-- Booth bookings table
CREATE TABLE IF NOT EXISTS booth_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES corporate_partners(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  booked_by UUID REFERENCES profiles(id),
  booth_number VARCHAR(50),
  booth_size VARCHAR(50) CHECK (booth_size IN ('small', 'medium', 'large', 'premium')),
  booth_location VARCHAR(100),
  dimensions VARCHAR(100),
  cost DECIMAL(10,2) NOT NULL,
  special_requirements TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  setup_instructions TEXT,
  contact_at_event VARCHAR(200),
  contact_phone_at_event VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INTERNATIONAL CONFERENCE DIRECTORY
-- ============================================================================

-- International Conferences Table
CREATE TABLE IF NOT EXISTS international_conferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(300) NOT NULL,
  acronym VARCHAR(50),
  description TEXT,

  -- Organization Details
  organizing_body VARCHAR(300),
  website_url VARCHAR(500),
  contact_email VARCHAR(255),
  contact_person VARCHAR(255),

  -- Conference Details
  conference_type VARCHAR(50) NOT NULL,
  field_id UUID REFERENCES event_fields(id),
  category_id UUID REFERENCES event_categories(id),

  -- Location & Schedule
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  venue VARCHAR(300),
  is_virtual BOOLEAN DEFAULT false,
  virtual_platform VARCHAR(200),

  -- Typical Schedule
  typical_month INT,
  frequency VARCHAR(50),
  next_conf_date DATE,
  next_conf_deadline DATE,

  -- Scale
  typical_attendees INT,
  typical_countries INT,
  is_global BOOLEAN DEFAULT false,

  -- Opportunities
  has_student_volunteers BOOLEAN DEFAULT false,
  has_call_for_papers BOOLEAN DEFAULT false,
  has_sponsorship BOOLEAN DEFAULT false,
  has_exhibitions BOOLEAN DEFAULT false,
  has_satellite_opportunities BOOLEAN DEFAULT false,

  -- Partnership Tracking
  partnership_status VARCHAR(50) DEFAULT 'none',
  partnership_tier VARCHAR(50),
  partnership_date DATE,
  partnership_notes TEXT,

  -- Fstivo Integration
  fstivo_contact_id UUID REFERENCES profiles(id),
  last_contact_date DATE,
  next_follow_up DATE,
  contact_count INT DEFAULT 0,

  -- Satellite Event Tracking
  satellite_events_hosted INT DEFAULT 0,
  total_satellite_attendees INT DEFAULT 0,

  -- Metadata
  logo_url VARCHAR(500),
  banner_image_url VARCHAR(500),
  established_year INT,
  social_media JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Conference Partnerships Table
CREATE TABLE IF NOT EXISTS conference_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID REFERENCES international_conferences(id) ON DELETE CASCADE,

  partnership_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'prospect',

  -- Terms
  start_date DATE,
  end_date DATE,
  agreement_type VARCHAR(50),
  revenue_share DECIMAL(5,2),

  -- Responsibilities
  fstivo_responsibilities TEXT[],
  partner_responsibilities TEXT[],

  -- Financials
  upfront_payment DECIMAL(12,2),
  expected_revenue DECIMAL(12,2),
  actual_revenue DECIMAL(12,2),

  -- Satellite Event Specific
  satellite_event_id UUID REFERENCES events(id),
  satellite_capacity INT,
  satellite_registrations INT DEFAULT 0,

  -- Communication
  partner_contact_name VARCHAR(255),
  partner_contact_email VARCHAR(255),
  partner_contact_phone VARCHAR(50),

  -- Tracking
  last_contact_date DATE,
  next_action TEXT,
  next_action_date DATE,

  notes TEXT,
  documents JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Satellite Events Table
CREATE TABLE IF NOT EXISTS satellite_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_conference_id UUID REFERENCES international_conferences(id),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,

  satellite_type VARCHAR(100),
  theme VARCHAR(300),
  customization_details TEXT,

  -- Host Details
  host_university VARCHAR(300),
  host_organization VARCHAR(300),
  host_coordinator_id UUID REFERENCES profiles(id),

  -- Logistics
  venue_capacity INT,
  expected_attendees INT,
  actual_attendees INT DEFAULT 0,
  streaming_url VARCHAR(500),

  -- Content
  sessions_broadcasted INT[],
  local_sessions_count INT DEFAULT 0,

  -- Partnership
  partnership_id UUID REFERENCES conference_partnerships(id),
  approval_status VARCHAR(50) DEFAULT 'pending',
  approval_date DATE,
  brand_guidelines_url VARCHAR(500),

  -- Financial
  budget DECIMAL(12,2),
  sponsorship_amount DECIMAL(12,2),
  ticket_revenue DECIMAL(12,2) DEFAULT 0,

  -- Metrics
  satisfaction_score DECIMAL(3,2),
  nps_score INT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conference Activity Log
CREATE TABLE IF NOT EXISTS conference_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID REFERENCES international_conferences(id) ON DELETE CASCADE,
  partnership_id UUID REFERENCES conference_partnerships(id) ON DELETE CASCADE,

  activity_type VARCHAR(100) NOT NULL,
  activity_date TIMESTAMPTZ DEFAULT NOW(),

  title VARCHAR(300),
  description TEXT,
  outcome TEXT,

  -- Follow-up
  requires_follow_up BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_task TEXT,

  attachments JSONB,

  created_by UUID REFERENCES profiles(id),
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

-- Volunteer indexes
CREATE INDEX idx_volunteers_user_id ON volunteers(user_id);
CREATE INDEX idx_volunteers_tier ON volunteers(tier);
CREATE INDEX idx_volunteers_total_points ON volunteers(total_points DESC);
CREATE INDEX idx_volunteer_activities_volunteer_id ON volunteer_activities(volunteer_id);
CREATE INDEX idx_volunteer_activities_event_id ON volunteer_activities(event_id);
CREATE INDEX idx_volunteer_activities_status ON volunteer_activities(status);
CREATE INDEX idx_volunteer_payouts_volunteer_id ON volunteer_payouts(volunteer_id);
CREATE INDEX idx_volunteer_payouts_status ON volunteer_payouts(status);
CREATE INDEX idx_volunteer_payment_methods_volunteer_id ON volunteer_payment_methods(volunteer_id);

-- Certification indexes
CREATE INDEX idx_certifications_user_id ON certifications(user_id);
CREATE INDEX idx_certifications_certificate_number ON certifications(certificate_number);
CREATE INDEX idx_certifications_status ON certifications(status);
CREATE INDEX idx_certifications_issue_date ON certifications(issue_date DESC);
CREATE INDEX idx_certificate_endorsements_certificate_id ON certificate_endorsements(certificate_id);
CREATE INDEX idx_certificate_verifications_certificate_id ON certificate_verifications(certificate_id);
CREATE INDEX idx_certificate_verifications_verified_at ON certificate_verifications(verified_at DESC);

-- Corporate partners indexes
CREATE INDEX idx_corporate_partners_slug ON corporate_partners(slug);
CREATE INDEX idx_corporate_partners_tier ON corporate_partners(partnership_tier);
CREATE INDEX idx_corporate_partners_status ON corporate_partners(status);
CREATE INDEX idx_corporate_partners_industry ON corporate_partners(industry);
CREATE INDEX idx_company_representatives_company_id ON company_representatives(company_id);
CREATE INDEX idx_company_representatives_user_id ON company_representatives(user_id);

-- Job postings indexes
CREATE INDEX idx_job_postings_company_id ON job_postings(company_id);
CREATE INDEX idx_job_postings_slug ON job_postings(slug);
CREATE INDEX idx_job_postings_status ON job_postings(status);
CREATE INDEX idx_job_postings_created_at ON job_postings(created_at DESC);
CREATE INDEX idx_job_postings_location_type ON job_postings(location_type);
CREATE INDEX idx_job_postings_job_type ON job_postings(job_type);
CREATE INDEX idx_job_postings_featured ON job_postings(is_featured) WHERE is_featured = true;

-- Job applications indexes
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_applied_at ON job_applications(applied_at DESC);

-- Booth bookings indexes
CREATE INDEX idx_booth_bookings_company_id ON booth_bookings(company_id);
CREATE INDEX idx_booth_bookings_event_id ON booth_bookings(event_id);
CREATE INDEX idx_booth_bookings_status ON booth_bookings(status);

-- International conferences indexes
CREATE INDEX idx_international_conferences_country ON international_conferences(country);
CREATE INDEX idx_international_conferences_field_id ON international_conferences(field_id);
CREATE INDEX idx_international_conferences_partnership_status ON international_conferences(partnership_status);
CREATE INDEX idx_international_conferences_next_conf_date ON international_conferences(next_conf_date);
CREATE INDEX idx_international_conferences_is_global ON international_conferences(is_global);
CREATE INDEX idx_conference_partnerships_conference_id ON conference_partnerships(conference_id);
CREATE INDEX idx_conference_partnerships_status ON conference_partnerships(status);
CREATE INDEX idx_conference_partnerships_type ON conference_partnerships(partnership_type);
CREATE INDEX idx_satellite_events_parent_conference_id ON satellite_events(parent_conference_id);
CREATE INDEX idx_satellite_events_event_id ON satellite_events(event_id);
CREATE INDEX idx_satellite_events_approval_status ON satellite_events(approval_status);
CREATE INDEX idx_conference_activity_log_conference_id ON conference_activity_log(conference_id);
CREATE INDEX idx_conference_activity_log_activity_date ON conference_activity_log(activity_date);

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
  SELECT UPPER(SUBSTRING(REPLACE(title, ' ', ''), 1, 3))
  INTO event_code
  FROM events
  WHERE id = NEW.event_id;

  random_part := UPPER(SUBSTRING(ENCODE(GEN_RANDOM_BYTES(3), 'hex'), 1, 6));
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

-- Function to update volunteer tier based on points
CREATE OR REPLACE FUNCTION update_volunteer_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_points >= 5000 THEN
    NEW.tier := 'platinum';
  ELSIF NEW.total_points >= 1500 THEN
    NEW.tier := 'gold';
  ELSIF NEW.total_points >= 500 THEN
    NEW.tier := 'silver';
  ELSE
    NEW.tier := 'bronze';
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment job applicants count
CREATE OR REPLACE FUNCTION increment_job_applicants()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE job_postings
  SET applicants_count = applicants_count + 1
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment conference contact count
CREATE OR REPLACE FUNCTION increment_conference_contact_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE international_conferences
  SET contact_count = contact_count + 1,
      last_contact_date = NEW.activity_date::DATE
  WHERE id = NEW.conference_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
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

-- Trigger to auto-update volunteer tier
CREATE TRIGGER update_volunteer_tier_trigger
  BEFORE UPDATE ON volunteers
  FOR EACH ROW
  WHEN (NEW.total_points IS DISTINCT FROM OLD.total_points)
  EXECUTE FUNCTION update_volunteer_tier();

-- Trigger for job application
CREATE TRIGGER increment_job_applicants_trigger
  AFTER INSERT ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION increment_job_applicants();

-- Trigger to increment conference contact count
CREATE TRIGGER increment_conference_contact_count_trigger
  AFTER INSERT ON conference_activity_log
  FOR EACH ROW
  WHEN (NEW.activity_type IN ('email_sent', 'call_made', 'meeting_completed'))
  EXECUTE FUNCTION increment_conference_contact_count();

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

-- Active partnership opportunities view
CREATE OR REPLACE VIEW active_partnership_opportunities AS
SELECT
  ic.id,
  ic.name,
  ic.acronym,
  ic.country,
  ic.conference_type,
  ic.next_conf_date,
  ic.typical_attendees,
  ic.has_satellite_opportunities,
  ic.partnership_status,
  ec.name as category_name,
  ec.icon as category_icon,
  ef.name as field_name,
  ic.contact_email,
  ic.website_url
FROM international_conferences ic
LEFT JOIN event_categories ec ON ic.category_id = ec.id
LEFT JOIN event_fields ef ON ic.field_id = ef.id
WHERE ic.deleted_at IS NULL
  AND ic.partnership_status NOT IN ('rejected', 'partnered')
ORDER BY ic.next_conf_date ASC NULLS LAST;

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
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE booth_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE international_conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE satellite_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Event Categories Policies
CREATE POLICY "Anyone can view event categories" ON event_categories FOR SELECT USING (true);

-- Event Fields Policies
CREATE POLICY "Anyone can view event fields" ON event_fields FOR SELECT USING (true);

-- Organizations Policies
CREATE POLICY "Anyone can view organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create organizations" ON organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Events Policies
CREATE POLICY "Anyone can view published events" ON events FOR SELECT USING (is_published = true AND deleted_at IS NULL);
CREATE POLICY "Organizers can view their own events" ON events FOR SELECT USING (organizer_id = auth.uid());
CREATE POLICY "Organizers can create events" ON events FOR INSERT WITH CHECK (organizer_id = auth.uid());
CREATE POLICY "Organizers can update their own events" ON events FOR UPDATE USING (organizer_id = auth.uid());

-- Registrations Policies
CREATE POLICY "Users can view their own registrations" ON registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Organizers can view registrations for their events" ON registrations FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = registrations.event_id AND events.organizer_id = auth.uid())
);
CREATE POLICY "Users can create registrations" ON registrations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Volunteers Policies
CREATE POLICY "Users can view own volunteer profile" ON volunteers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own volunteer profile" ON volunteers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own volunteer profile" ON volunteers FOR UPDATE USING (auth.uid() = user_id);

-- Volunteer Activities Policies
CREATE POLICY "Volunteers can view own activities" ON volunteer_activities FOR SELECT USING (
  EXISTS (SELECT 1 FROM volunteers WHERE id = volunteer_id AND user_id = auth.uid())
);

-- Certificates Policies
CREATE POLICY "Everyone can view active certificates" ON certifications FOR SELECT USING (status = 'active');
CREATE POLICY "Users can manage own certificates" ON certifications FOR ALL USING (auth.uid() = user_id);

-- Corporate Partners Policies
CREATE POLICY "Everyone can view corporate partners" ON corporate_partners FOR SELECT USING (true);

-- Job Postings Policies
CREATE POLICY "Everyone can view active job postings" ON job_postings FOR SELECT USING (status = 'active');

-- Job Applications Policies
CREATE POLICY "Applicants can manage own applications" ON job_applications FOR ALL USING (auth.uid() = applicant_id);

-- International Conferences Policies
CREATE POLICY "Anyone can view international conferences" ON international_conferences FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Authenticated users can create conferences" ON international_conferences FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update conferences they manage" ON international_conferences FOR UPDATE USING (fstivo_contact_id = auth.uid());

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert event categories
INSERT INTO event_categories (name, slug, icon, description, color, display_order) VALUES
  ('Technology', 'technology', '💻', 'Technology events, hackathons, workshops', '#6366f1', 1),
  ('Business', 'business', '💼', 'Business conferences, career fairs, networking', '#8b5cf6', 2),
  ('Healthcare', 'healthcare', '🏥', 'Healthcare symposiums, medical events', '#ef4444', 3),
  ('Engineering', 'engineering', '⚙️', 'Engineering expos, technical workshops', '#f59e0b', 4),
  ('Arts & Design', 'arts-design', '🎨', 'Arts exhibitions, design conferences', '#ec4899', 5),
  ('Sciences', 'sciences', '🔬', 'Science fairs, research symposiums', '#10b981', 6),
  ('Social Impact', 'social-impact', '🌍', 'Social impact events, community service', '#06b6d4', 7)
ON CONFLICT (name) DO NOTHING;

-- Insert activity points for volunteers
INSERT INTO activity_points (activity_type, base_points, base_rate, description, estimated_hours) VALUES
  ('event_setup', 100, 5.00, 'Event setup and preparation', 2.0),
  ('registration_desk', 150, 5.00, 'Registration desk management', 4.0),
  ('usher_guide', 120, 5.00, 'Ushering and guiding attendees', 4.0),
  ('social_media', 180, 5.00, 'Social media coverage and live posting', 4.0),
  ('photography', 250, 5.00, 'Event photography and videography', 6.0),
  ('tech_support', 200, 5.00, 'Technical support and AV management', 5.0),
  ('coordination', 300, 5.00, 'Event coordination and management', 8.0),
  ('speaker_management', 200, 5.00, 'Speaker management and hospitality', 5.0),
  ('sponsor_relations', 350, 5.00, 'Sponsor relations and management', 8.0),
  ('team_lead', 400, 5.00, 'Team leadership and volunteer management', 10.0)
ON CONFLICT (activity_type) DO NOTHING;

-- Insert certification types
INSERT INTO certification_types (name, code, description, tier, min_hours, min_events, min_rating, required_skills, validity_months, price) VALUES
  ('Event Volunteer Certificate', 'VOL-BASIC', 'Recognition for completing volunteer hours at Fstivo events', 'volunteer', 20.0, 3, NULL, ARRAY['teamwork', 'communication', 'event_operations'], NULL, 500),
  ('Event Coordinator Certificate', 'VOL-COORD', 'Advanced certification for volunteers who have led multiple events', 'coordinator', 100.0, 5, 4.5, ARRAY['project_management', 'team_leadership', 'event_planning', 'crisis_management'], 36, 2000),
  ('Professional Event Manager', 'VOL-MGR', 'Professional credential for experienced event managers', 'manager', 500.0, 20, 4.7, ARRAY['strategic_planning', 'vendor_management', 'budget_management', 'stakeholder_management'], NULL, 5000)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
