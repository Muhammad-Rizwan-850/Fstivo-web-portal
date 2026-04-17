# 🚀 Quick Database Setup Guide

Your Supabase credentials are configured. Follow these steps to set up your database:

---

## ✅ Your Credentials (Already Configured)

```
Project URL: https://rdxvpeyimkezusukxjiu.supabase.co
Project Ref: rdxvpeyimkezusukxjiu
Anon Key: eyJhbGci... (configured)
Service Role: eyJhbGci... (configured)
```

---

## 📊 Option 1: Push Schema via Dashboard (Easiest - 2 minutes)

1. **Open Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/rdxvpeyimkezusukxjiu/sql/new
   ```

2. **Copy the schema:**
   ```bash
   cat supabase/schema.sql
   ```

3. **Paste into SQL Editor** and click "Run"

4. **Verify tables created:**
   ```
   https://supabase.com/dashboard/project/rdxvpeyimkezusukxjiu/database/tables
   ```

---

## 🔧 Option 2: Use Supabase CLI (Requires login)

1. **Login to Supabase:**
   ```bash
   ~/.local/bin/supabase login
   ```

2. **Link your project:**
   ```bash
   ~/.local/bin/supabase link --project-ref rdxvpeyimkezusukxjiu
   ```

3. **Push the schema:**
   ```bash
   ~/.local/bin/supabase db push
   ```

---

## ✅ Option 3: Quick Schema (Core Tables Only)

If the full schema is too large, run this minimal schema first:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(300),
  avatar_url TEXT,
  role TEXT DEFAULT 'attendee',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location VARCHAR(500),
  status VARCHAR(50) DEFAULT 'draft',
  organizer_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT TO public USING (true);

CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT TO public USING (true);

CREATE POLICY "Users can manage their registrations"
  ON registrations FOR ALL TO authenticated USING (auth.uid() = user_id);
```

---

## 🔍 After Setup - Verify Connection

```bash
# Start dev server
npm run dev

# Visit database test page
# http://localhost:3000/test-database
```

---

## 📋 Expected Tables

After setup, you should see:
- `profiles` - User profiles
- `events` - Event listings
- `registrations` - Event registrations
- `tickets` - Ticket information
- `payments` - Payment records
- `notifications` - Notification logs
- `check_ins` - Check-in records
- `volunteers` - Volunteer data
- `certificates` - Certificates
- `subscriptions` - User subscriptions
- And 30+ more tables...

---

## 🎯 Dashboard Links

- **Tables:** https://supabase.com/dashboard/project/rdxvpeyimkezusukxjiu/database/tables
- **API:** https://supabase.com/dashboard/project/rdxvpeyimkezusukxjiu/api
- **SQL Editor:** https://supabase.com/dashboard/project/rdxvpeyimkezusukxjiu/sql/new
- **Authentication:** https://supabase.com/dashboard/project/rdxvpeyimkezusukxjiu/auth/templates

---

**⚡ Fastest Method:** Use the SQL Editor link above and paste the schema.sql content.
