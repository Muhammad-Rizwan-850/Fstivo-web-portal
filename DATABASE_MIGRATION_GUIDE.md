# 🗄️ FSTIVO Database Migration Guide

Complete guide for setting up Supabase and migrating the FSTIVO database schema.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- [ ] Supabase account created (https://supabase.com)
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Your .env.local file ready

---

## 🚀 Step 1: Create Supabase Project (5 minutes)

### Option A: Via Dashboard (Recommended for first-time setup)

1. **Go to https://supabase.com**
2. **Click "Start your project"**
3. **Sign in with GitHub** (or create account)
4. **Create Organization:**
   - Name: `fstivo-org` (or your preferred name)
   - Region: `Southeast Asia (Singapore)` - Closest to Pakistan

5. **Create Project:**
   - Name: `fstivo-prod`
   - Database Password: **Generate and save this securely!**
   - Pricing: Free tier (500MB)
   - Wait ~2 minutes for provisioning

### Option B: Via CLI (For automated setup)

```bash
# Install Supabase CLI first
npm install -g supabase

# Login
supabase login

# Create project
supabase projects create \
  --name fstivo-prod \
  --org-id YOUR_ORG_ID \
  --db-password YOUR_SECURE_PASSWORD \
  --region ap-southeast-1
```

---

## 🔑 Step 2: Get Your Credentials (2 minutes)

After project creation, get your credentials:

1. **Go to:** Settings → API
2. **Copy these values:**

```
Project URL:      https://xxxxx.supabase.co
Anon public:      eyJhbGci...
service_role:     eyJhbGci... (Keep this secret!)
JWT Secret:       (From JWT secret section)
```

3. **Update your .env.local:**

```bash
# Replace these with your actual values
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_JWT_SECRET=your_jwt_secret
```

---

## 📦 Step 3: Install Supabase CLI (1 minute)

```bash
# Option 1: Using npm (recommended)
npm install -g supabase

# Option 2: Using homebrew (macOS)
brew install supabase/tap/supabase

# Option 3: Using curl (Linux)
curl -fsSL https://supabase.com/install.sh | bash

# Verify installation
supabase --version
```

---

## 🔗 Step 4: Link Your Project (1 minute)

```bash
# Navigate to project directory
cd /home/rizwan/attempt_02

# Link to your Supabase project
supabase link --project-ref xxxx-xxxx

# You'll be prompted for:
# - Project reference: (from your project URL)
# - Database password: (the one you created)
```

---

## 🚀 Step 5: Push Database Schema (5 minutes)

### Option A: Push Complete Schema (Recommended)

```bash
# Push the complete schema
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Or using the linked project
supabase db push
```

### Option B: Apply Migrations Individually

If you want to apply migrations in order:

```bash
# List all migrations
supabase migration list

# Apply specific migration
supabase migration up --file 001_initial_schema.sql

# Apply all pending migrations
supabase db push
```

### Option C: Copy-Paste via Dashboard (Fallback)

1. **Go to:** Supabase Dashboard → SQL Editor
2. **Open:** `supabase/schema.sql`
3. **Copy and paste** the entire schema
4. **Click "Run"**

---

## ✅ Step 6: Verify Schema (2 minutes)

Run these checks to ensure everything is set up correctly:

```bash
# Check if tables exist
supabase db remote commit

# View all tables
# Go to Dashboard → Database → Tables
# You should see:
# - profiles
# - events
# - registrations
# - tickets
# - payments
# - subscriptions
# - etc.
```

**Expected Tables (40+):**
- `profiles` - User profiles
- `events` - Event listings
- `registrations` - Event registrations
- `tickets` - Ticket information
- `payments` - Payment records
- `subscriptions` - User subscriptions
- `notifications` - Notification logs
- `check_ins` - Check-in records
- `volunteers` - Volunteer data
- `certificates` - Certificates issued
- And more...

---

## 🌱 Step 7: Seed Initial Data (Optional)

If you want to populate with sample data:

```bash
# Run seed script (if available)
npm run seed

# Or manually via SQL Editor
# Open: supabase/migrations/seed_data.sql
```

---

## 🔐 Step 8: Configure Row Level Security (RLS)

FSTIVO uses Supabase Auth with RLS. Ensure policies are created:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Enable RLS on key tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
```

**Note:** The schema.sql should include RLS policies. If not, add them:

```sql
-- Example: Users can view all profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
TO public
USING (true);

-- Example: Users can update own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);
```

---

## 🧪 Step 9: Test Database Connection

```bash
# Run database connection test
npm run test:database

# Or visit the test page
# http://localhost:3000/test-database
```

---

## 📊 Step 10: Enable Realtime Subscriptions

FSTIVO uses Supabase Realtime for live updates:

1. **Go to:** Database → Replication
2. **Enable Realtime for:**
   - `events`
   - `registrations`
   - `notifications`
   - `check_ins`
   - `volunteers`

---

## 🔧 Step 11: Configure Storage (For File Uploads)

Create storage buckets for images and files:

```sql
-- Create storage buckets via SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('event-banners', 'event-banners', true),
  ('avatars', 'avatars', true),
  ('documents', 'documents', false),
  ('certificates', 'certificates', true);

-- Add storage policies
CREATE POLICY "Public Access Event Banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-banners');

CREATE POLICY "Authenticated Upload Event Banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-banners');
```

---

## ✅ Post-Migration Checklist

- [ ] All tables created successfully
- [ ] RLS policies enabled
- [ ] Realtime subscriptions enabled
- [ ] Storage buckets created
- [ ] Environment variables updated
- [ ] Connection test passed
- [ ] Backup enabled (Settings → Database → Backups)

---

## 🆘 Troubleshooting

### Issue: "Connection refused"
**Fix:** Check your SUPABASE_URL format - should be `https://xxx.supabase.co`

### Issue: "Migration failed"
**Fix:**
1. Check migration order
2. Look for conflicting table names
3. Check for syntax errors in SQL

### Issue: "RLS policy not working"
**Fix:** Ensure RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`

### Issue: "Realtime not working"
**Fix:** Enable replication for specific tables in Dashboard → Database → Replication

---

## 📞 Support

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Discord:** https://supabase.com/discord
- **FSTIVO Issues:** GitHub Issues

---

## 🎯 Next Steps After Migration

1. **Configure Auth Providers** (Google, GitHub)
2. **Set up Payment Webhooks** (Stripe, JazzCash)
3. **Enable Email Templates** (Resend)
4. **Deploy to Vercel**
5. **Run smoke tests**

---

**Migration Status:** ⏳ Pending Supabase Project Creation
**Last Updated:** 2025-01-17
