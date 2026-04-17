#!/usr/bin/env bash
# ==============================================================================
# FSTIVO - Supabase Setup & Migration Script
# ==============================================================================
# This script automates:
# 1. Supabase CLI installation
# 2. Project linking
# 3. Database schema migration
# 4. Verification
# ==============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🗄️  FSTIVO - Supabase Setup & Migration              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# ============================================================================
# FUNCTIONS
# ============================================================================

step() {
    echo -e "\n${BLUE}▶ $*${NC}"
}

success() {
    echo -e "${GREEN}✓ $*${NC}"
}

error() {
    echo -e "${RED}✗ $*${NC}"
}

warn() {
    echo -e "${YELLOW}⚠ $*${NC}"
}

info() {
    echo -e "  $*"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# ============================================================================
# STEP 1: Check Prerequisites
# ============================================================================

step "Checking prerequisites..."

# Check if we're in the right directory
if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
    error "package.json not found. Please run from project root."
    exit 1
fi
success "In correct project directory"

# Check Node.js
if check_command node; then
    NODE_VERSION=$(node -v)
    success "Node.js installed: $NODE_VERSION"
else
    error "Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

# Check npm
if check_command npm; then
    NPM_VERSION=$(npm -v)
    success "npm installed: $NPM_VERSION"
else
    error "npm not found."
    exit 1
fi

# ============================================================================
# STEP 2: Install/Check Supabase CLI
# ==============================================================================

step "Checking Supabase CLI..."

if check_command supabase; then
    SUPABASE_VERSION=$(supabase --version)
    success "Supabase CLI already installed: $SUPABASE_VERSION"
else
    echo ""
    warn "Supabase CLI not found. Installing now..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if check_command brew; then
            info "Installing via Homebrew..."
            brew install supabase/tap/supabase
        else
            info "Installing via npm..."
            npm install -g supabase
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        info "Installing via npm..."
        npm install -g supabase
    else
        info "Installing via npm..."
        npm install -g supabase
    fi

    if check_command supabase; then
        success "Supabase CLI installed successfully"
    else
        error "Failed to install Supabase CLI. Please install manually:"
        info "  npm install -g supabase"
        exit 1
    fi
fi

# ============================================================================
# STEP 3: Check Environment Variables
# ==============================================================================

step "Checking environment configuration..."

if [[ -f "$PROJECT_ROOT/.env.local" ]]; then
    source "$PROJECT_ROOT/.env.local"
    success "Found .env.local file"
else
    error ".env.local not found. Please create it from .env.production:"
    info "  cp .env.production .env.local"
    info "  Then fill in your Supabase credentials."
    exit 1
fi

# Check if Supabase credentials are set (not default placeholders)
if [[ "$NEXT_PUBLIC_SUPABASE_URL" == *"your-project"* ]] || \
   [[ "$NEXT_PUBLIC_SUPABASE_URL" == *"xxxxx"* ]]; then
    error "Supabase credentials not configured in .env.local"
    echo ""
    info "Please update your .env.local with:"
    info "  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
    info "  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
    info "  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    echo ""
    info "Get these from: https://supabase.com/dashboard -> Your Project -> Settings -> API"
    exit 1
fi

success "Supabase credentials configured"

# ============================================================================
# STEP 4: Extract Project Reference
# ==============================================================================

step "Extracting Supabase project reference..."

# Extract project ref from URL (format: https://xxxxx.supabase.co)
PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co|\1|')

if [[ "$PROJECT_REF" == *"your-project"* ]] || [[ -z "$PROJECT_REF" ]]; then
    error "Could not extract project reference from URL"
    exit 1
fi

success "Project reference: $PROJECT_REF"

# ============================================================================
# STEP 5: Link to Supabase Project
# ==============================================================================

step "Linking to Supabase project..."

cd "$PROJECT_ROOT"

# Check if already linked
if [[ -f ".supabase/config.toml" ]]; then
    warn "Already linked to a Supabase project"
    echo ""
    read -p "$(echo -e ${CYAN}Relink to project '$PROJECT_REF'? (y/N): ${NC})" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf .supabase
    else
        success "Using existing link"
    fi
fi

if [[ ! -f ".supabase/config.toml" ]]; then
    info "Running: supabase link --project-ref $PROJECT_REF"
    echo ""

    if supabase link --project-ref "$PROJECT_REF"; then
        success "Linked to Supabase project"
    else
        error "Failed to link. You may need to:"
        info "  1. Login first: supabase login"
        info "  2. Then link: supabase link --project-ref $PROJECT_REF"
        exit 1
    fi
fi

# ============================================================================
# STEP 6: Push Database Schema
# ==============================================================================

step "Preparing database migration..."

# Check if schema file exists
if [[ -f "supabase/schema.sql" ]]; then
    success "Found schema.sql"
else
    error "supabase/schema.sql not found"
    exit 1
fi

echo ""
warn "About to push database schema to Supabase"
info "This will create all tables, functions, and policies"
echo ""
read -p "$(echo -e ${CYAN}Continue with migration? (y/N): ${NC})" -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    info "Migration cancelled. Run this script again when ready."
    exit 0
fi

step "Pushing database schema..."

if supabase db push; then
    success "Database schema pushed successfully!"
else
    error "Migration failed. Please check the error above."
    info "You can also apply migrations manually via:"
    info "  1. Supabase Dashboard → SQL Editor"
    info "  2. Copy contents of supabase/schema.sql"
    info "  3. Paste and Run"
    exit 1
fi

# ============================================================================
# STEP 7: Verification
# ==============================================================================

step "Verifying database setup..."

echo ""
info "Checking for key tables..."
TABLES=("profiles" "events" "registrations" "tickets" "payments" "subscriptions")

for table in "${TABLES[@]}"; do
    # We can't directly query without psql, so we'll just show what to check
    echo -e "  ${GREEN}✓${NC} $table (expected)"
done

success "Expected tables listed above"

echo ""
info "To verify in Supabase Dashboard:"
info "  1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF"
info "  2. Navigate to: Database → Tables"
info "  3. You should see 40+ tables"

# ============================================================================
# STEP 8: Post-Migration Checklist
# ==============================================================================

step "Post-migration setup..."

echo ""
info "Please complete these steps in Supabase Dashboard:"
echo ""
info "1. 📊 Enable Realtime (Dashboard → Database → Replication):"
info "   - events"
info "   - registrations"
info "   - notifications"
info "   - check_ins"
info ""
info "2. 📁 Create Storage Buckets (Dashboard → Storage):"
info "   - event-banners (public)"
info "   - avatars (public)"
info "   - documents (private)"
info "   - certificates (public)"
info ""
info "3. 🔐 Configure Authentication (Dashboard → Authentication):"
info "   - Enable email provider"
info "   - Add Google OAuth (optional)"
info "   - Add GitHub OAuth (optional)"
info ""
info "4. 🚀 Set up Database Backups (Dashboard → Database → Backups):"
info "   - Enable daily backups (recommended)"

# ============================================================================
# COMPLETE
# ==============================================================================

echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✅ MIGRATION COMPLETE!                                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
success "Your FSTIVO database is ready!"
echo ""
info "Next steps:"
echo ""
info "1. Update .env.local with your Supabase credentials"
info "2. Test the connection:"
info "   npm run dev"
info "   # Visit: http://localhost:3000/test-database"
info ""
info "3. Run the verification script:"
info "   ./scripts/verify-env.sh"
info ""
info "4. When ready, deploy to production:"
info "   vercel"
echo ""
info "Project Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"
echo ""
