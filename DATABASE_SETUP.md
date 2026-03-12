# Fstivo Database Setup Instructions

## 1. Create Supabase Account
Go to https://supabase.com and create a free account

## 2. Create New Project
- Click 'New Project'
- Choose your organization
- Project name: 'fstivo-event-nexus'
- Database password: Choose a strong password
- Region: Select closest to your location

## 3. Get Project Credentials
After project creation (takes ~2 minutes):
- Go to Settings → API
- Copy the following values:

### Required Environment Variables:
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

## 4. Configure Authentication
In Supabase Dashboard:
- Go to Authentication → Providers
- Enable Email provider
- Optionally enable Google/GitHub OAuth

## 5. Run Database Migrations
Execute the SQL migrations in order:
1. supabase/migrations/001_initial_schema.sql
2. supabase/migrations/002_volunteer_certification_corporate.sql
3. supabase/migrations/003_international_conference_directory.sql

## 6. Update .env.local
Replace the placeholder values in .env.local with your actual Supabase credentials

## 7. Test Connection
Run: npm run dev
Visit: http://localhost:3000/test-database

## Free Tier Limits (Supabase):
- 500MB database
- 50MB file storage
- 2GB bandwidth/month
- 50,000 monthly active users
- All core features included

This is sufficient for development and small production use.
