#!/usr/bin/env bash
# ==============================================================================
# FSTIVO - Vercel Deployment Script
# ==============================================================================
# This script automates:
# 1. Pre-deployment checks
# 2. Environment variable validation
# 3. Vercel CLI installation
# 4. Project deployment
# 5. Post-deployment verification
# ==============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 FSTIVO - Vercel Deployment Script                  ║
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
    command -v "$1" &> /dev/null
}

# ============================================================================
# STEP 1: Pre-deployment Checks
# ============================================================================

step "Running pre-deployment checks..."

cd "$PROJECT_ROOT"

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    error "package.json not found. Please run from project root."
    exit 1
fi
success "In correct project directory"

# Check git status
if [[ -n $(git status --porcelain) ]]; then
    warn "You have uncommitted changes:"
    git status --short
    echo ""
    read -p "$(echo -e ${YELLOW}Commit changes before deploying? (y/N): ${NC})" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        step "Committing changes..."
        git add -A
        read -p "Enter commit message: " commit_msg
        git commit -m "${commit_msg:-chore: pre-deployment commit}"
        git push origin master
        success "Changes committed and pushed"
    else
        warn "Proceeding with uncommitted changes (not recommended)"
    fi
else
    success "Git working tree clean"
fi

# Check Node.js
if check_command node; then
    NODE_VERSION=$(node -v)
    success "Node.js: $NODE_VERSION"
else
    error "Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

# ============================================================================
# STEP 2: Build Verification
# ==============================================================================

step "Verifying build..."

if npm run build 2>&1; then
    success "Build successful"
else
    error "Build failed. Please fix errors before deploying."
    exit 1
fi

# ============================================================================
# STEP 3: Type Check
# ==============================================================================

step "Running type check..."

if npm run typecheck 2>&1; then
    success "TypeScript check passed"
else
    warn "TypeScript errors found (non-blocking)"
fi

# ============================================================================
# STEP 4: Environment Variable Validation
# ==============================================================================

step "Validating environment variables..."

if [[ ! -f ".env.local" ]]; then
    error ".env.local not found. Please create it from .env.production:"
    info "  cp .env.production .env.local"
    exit 1
fi

# Source .env.local
set -a
source .env.local
set +a

# Required variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "RESEND_API_KEY"
    "STRIPE_SECRET_KEY"
    "CRON_SECRET"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var:-}" ]] || [[ "${!var}" == *"your-"* ]] || [[ "${!var}" == *"xxxxx"* ]]; then
        MISSING_VARS+=("$var")
    fi
done

if [[ ${#MISSING_VARS[@]} -gt 0 ]]; then
    error "Missing or invalid environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        info "  - $var"
    done
    echo ""
    error "Please configure these in .env.local before deploying."
    exit 1
fi

success "All required environment variables set"

# ============================================================================
# STEP 5: Install/Check Vercel CLI
# ==============================================================================

step "Checking Vercel CLI..."

if check_command vercel; then
    VERCEL_VERSION=$(vercel --version)
    success "Vercel CLI installed: $VERCEL_VERSION"
else
    echo ""
    warn "Vercel CLI not found. Installing now..."

    npm i -g vercel

    if check_command vercel; then
        success "Vercel CLI installed successfully"
    else
        error "Failed to install Vercel CLI. Please install manually:"
        info "  npm i -g vercel"
        exit 1
    fi
fi

# ============================================================================
# STEP 6: Login to Vercel
# ==============================================================================

step "Checking Vercel authentication..."

# Check if already logged in
if vercel whoami &> /dev/null; then
    VERCEL_USER=$(vercel whoami)
    success "Already logged in as: $VERCEL_USER"
else
    echo ""
    info "Please log in to Vercel..."
    if vercel login; then
        success "Logged in to Vercel"
    else
        error "Failed to log in to Vercel."
        exit 1
    fi
fi

# ============================================================================
# STEP 7: Check for Existing Project
# ==============================================================================

step "Checking for existing Vercel project..."

if [[ -f ".vercel/project.json" ]]; then
    success "Existing Vercel project found"
    PROJECT_NAME=$(jq -r '.name' .vercel/project.json 2>/dev/null || echo "fstivo")
    info "Project: $PROJECT_NAME"
else
    info "No existing project found. Will create new project."
fi

# ============================================================================
# STEP 8: Deployment Mode Selection
# ==============================================================================

echo ""
echo -e "${MAGENTA}Select deployment mode:${NC}"
echo ""
echo "  1) Preview deployment (staging)"
echo "  2) Production deployment"
echo ""
read -p "$(echo -e ${CYAN}Choose [1-2]: ${NC})" -n 1 -r
echo ""

DEPLOYMENT_MODE="preview"
if [[ $REPLY == "2" ]]; then
    DEPLOYMENT_MODE="production"
fi

if [[ "$DEPLOYMENT_MODE" == "production" ]]; then
    warn "You are about to deploy to PRODUCTION"
    echo ""
    read -p "$(echo -e ${RED}Are you sure? (yes/no): ${NC})" -r
    echo ""
    if [[ ! $REPLY == "yes" ]]; then
        info "Deployment cancelled."
        exit 0
    fi
fi

# ============================================================================
# STEP 9: Deploy
# ==============================================================================

step "Deploying to Vercel ($DEPLOYMENT_MODE)..."

echo ""
info "This may take 2-5 minutes..."
echo ""

if [[ "$DEPLOYMENT_MODE" == "production" ]]; then
    if vercel --prod; then
        success "Production deployment successful!"
    else
        error "Production deployment failed. Check errors above."
        exit 1
    fi
else
    if vercel; then
        success "Preview deployment successful!"
    else
        error "Preview deployment failed. Check errors above."
        exit 1
    fi
fi

# ============================================================================
# STEP 10: Post-Deployment Verification
# ==============================================================================

step "Post-deployment verification..."

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls 2>/dev/null | head -2 | tail -1 | awk '{print $2}' || echo "")

if [[ -n "$DEPLOYMENT_URL" ]]; then
    success "Deployment URL: https://$DEPLOYMENT_URL"

    echo ""
    info "Waiting for deployment to be ready..."
    sleep 5

    # Check health endpoint
    if curl -s "https://$DEPLOYMENT_URL/api/health" > /dev/null 2>&1; then
        success "Health check passed"
    else
        warn "Health check not available (may still be provisioning)"
    fi
fi

# ============================================================================
# COMPLETE
# ==============================================================================

echo ""
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✅ DEPLOYMENT COMPLETE!                                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
success "Your FSTIVO app is deployed!"
echo ""

if [[ "$DEPLOYMENT_MODE" == "production" ]]; then
    info "Next steps:"
    echo ""
    info "1. Configure custom domain in Vercel Dashboard:"
    info "   https://vercel.com/dashboard"
    info ""
    info "2. Update DNS records for fstivo.com"
    info ""
    info "3. Configure payment webhooks:"
    info "   - Stripe: https://fstivo.com/api/payments/webhook"
    info "   - JazzCash: https://fstivo.com/api/payments/jazzcash/callback"
    info "   - Easypaisa: https://fstivo.com/api/payments/easypaisa/callback"
    info ""
    info "4. Enable SSL (automatic via Vercel)"
    info ""
    info "5. Test the application:"
    info "   - Sign up flow"
    info "   - Create event"
    info "   - Payment flow"
else
    info "Preview deployment created!"
    echo ""
    info "Next steps:"
    echo ""
    info "1. Test your preview deployment"
    info "2. Fix any issues"
    info "3. When ready, deploy to production:"
    info "   ./scripts/deploy-vercel.sh"
    echo ""
    info "Or via Vercel Dashboard → Promote to Production"
fi

echo ""
info "Deployment URL: ${CYAN}https://$DEPLOYMENT_URL${NC}"
echo ""
