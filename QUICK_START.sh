#!/bin/bash

# FSTIVO Event Management Platform - Quick Start Setup
# This script sets up the development environment

echo "🎉 FSTIVO Event Management Platform - Quick Start"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "${BLUE}Checking Node.js version...${NC}"
node_version=$(node -v)
echo "✓ Node.js $node_version"
echo ""

# Check npm version
echo -e "${BLUE}Checking npm version...${NC}"
npm_version=$(npm -v)
echo "✓ npm $npm_version"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Build the project
echo -e "${BLUE}Building production bundle...${NC}"
npm run build
echo ""

# Run TypeScript check
echo -e "${BLUE}Running TypeScript check...${NC}"
npx tsc --noEmit --skipLibCheck
if [ $? -eq 0 ]; then
    echo "✓ TypeScript check passed (0 errors)"
else
    echo "✗ TypeScript check failed"
    exit 1
fi
echo ""

# Display setup instructions
cat << 'EOF'

✅ Setup Complete!

🚀 Next Steps:

1. **Configure Environment Variables:**
   - Copy .env.example to .env.local
   - Update with your Supabase credentials:
     * NEXT_PUBLIC_SUPABASE_URL
     * NEXT_PUBLIC_SUPABASE_ANON_KEY
     * SUPABASE_SERVICE_ROLE_KEY

2. **Start Development Server:**
   npm run dev
   
   The application will be available at:
   - http://localhost:3000 (local)
   - http://172.16.70.154:3000 (network)

3. **Run Tests:**
   npm run test              # Unit tests
   npm run test:e2e         # E2E tests
   npm run test:coverage    # Coverage report

4. **Other Useful Commands:**
   npm run lint             # ESLint check
   npm run format           # Prettier format
   npm run typecheck        # TypeScript check

📚 Documentation:
   - See COMPLETE_DIAGNOSTIC_REPORT.md for detailed analysis
   - Check README.md for project documentation

🔐 Important:
   - Never commit .env.local to version control
   - Keep your API keys and secrets safe
   - Use environment variables for sensitive data

🐛 Troubleshooting:
   - Build failing? Clear .next: rm -rf .next
   - Port 3000 already in use? Change it: PORT=3001 npm run dev
   - Dependencies issue? Clear cache: npm cache clean --force

Need help? Check the documentation or see COMPLETE_DIAGNOSTIC_REPORT.md

EOF

echo ""
echo -e "${GREEN}🎉 Setup complete! Ready to start development.${NC}"
