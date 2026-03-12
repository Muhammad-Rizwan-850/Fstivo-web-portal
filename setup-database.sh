#!/bin/bash

echo "🚀 Fstivo Database Setup Script"
echo "================================"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Please create it with your Supabase credentials."
    exit 1
fi

# Check if Supabase URL is configured
if grep -q "your-project-id" .env.local; then
    echo "❌ Please update .env.local with your actual Supabase credentials first."
    echo "   See DATABASE_SETUP.md for instructions."
    exit 1
fi

echo "✅ Environment variables configured"

# Check if migrations exist
if [ ! -f "supabase/migrations/001_initial_schema.sql" ]; then
    echo "❌ Database migrations not found"
    exit 1
fi

echo "✅ Database migrations found"

echo ""
echo "📋 Next Steps:"
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Copy your project URL and API keys to .env.local"
echo "3. Run the SQL migrations in Supabase SQL Editor:"
echo "   - supabase/migrations/001_initial_schema.sql"
echo "   - supabase/migrations/002_volunteer_certification_corporate.sql"  
echo "   - supabase/migrations/003_international_conference_directory.sql"
echo "4. Test with: npm run dev && visit http://localhost:3000/test-database"

echo ""
echo "🎉 Setup complete! Your Fstivo project is ready to use with Supabase free tier."
