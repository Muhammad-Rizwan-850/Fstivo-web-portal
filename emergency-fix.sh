#!/bin/bash

# ============================================================
# FSTIVO EMERGENCY FIX SCRIPT
# Fixes 380+ TypeScript compilation errors
# ============================================================

echo "🚨 FSTIVO EMERGENCY FIX SCRIPT 🚨"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
TOTAL_FIXES=0

echo "${YELLOW}Step 1: Backing up files...${NC}"
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r src/lib/actions "$BACKUP_DIR/"
echo "${GREEN}✓ Backup created in $BACKUP_DIR${NC}"
echo ""

echo "${YELLOW}Step 2: Fixing escaped characters in action files...${NC}"

# List of affected files
ACTION_FILES=(
  "src/lib/actions/admin.ts"
  "src/lib/actions/ads.ts"
  "src/lib/actions/affiliate.ts"
  "src/lib/actions/analytics.ts"
  "src/lib/actions/auth.ts"
  "src/lib/actions/campaigns.ts"
  "src/lib/actions/checkin.ts"
  "src/lib/actions/events.ts"
  "src/lib/actions/notifications.ts"
  "src/lib/actions/payments.ts"
  "src/lib/actions/seating.ts"
  "src/lib/actions/social.ts"
  "src/lib/actions/sponsored.ts"
  "src/lib/actions/subscriptions.ts"
  "src/lib/actions/templates.ts"
  "src/lib/actions/tickets.ts"
)

for file in "${ACTION_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  Processing: $file"

    # Count occurrences before
    BEFORE=$(grep -c '\!' "$file" 2>/dev/null || echo "0")

    # Fix \! → !
    sed -i 's/\\!/!/g' "$file"

    # Fix \!== → !==
    sed -i 's/\\!==/!=/g' "$file"

    # Fix \!= → !=
    sed -i 's/\\!=/!=/g' "$file"

    # Count occurrences after
    AFTER=$(grep -c '\!' "$file" 2>/dev/null || echo "0")

    FIXED=$((BEFORE - AFTER))
    TOTAL_FIXES=$((TOTAL_FIXES + FIXED))

    echo "${GREEN}    ✓ Fixed $FIXED occurrences${NC}"
  else
    echo "${RED}    ✗ File not found: $file${NC}"
  fi
done

echo ""
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${GREEN}✓ Total fixes applied: $TOTAL_FIXES${NC}"
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "${YELLOW}Step 3: Verifying TypeScript compilation...${NC}"
npm run typecheck 2>&1 | tee typecheck.log

# Check if compilation succeeded
if grep -q "error TS" typecheck.log; then
  ERRORS=$(grep -c "error TS" typecheck.log)
  echo "${RED}✗ Still has $ERRORS TypeScript errors${NC}"
  echo "${YELLOW}Check typecheck.log for details${NC}"
else
  echo "${GREEN}✓ TypeScript compilation successful!${NC}"
fi

echo ""
echo "${YELLOW}Step 4: Running build test...${NC}"
npm run build 2>&1 | tail -20

echo ""
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${GREEN}Emergency fixes complete!${NC}"
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo "1. Review typecheck.log for any remaining errors"
echo "2. Set up Supabase project (see setup guide)"
echo "3. Configure .env.local with real credentials"
echo "4. Run database migrations"
echo ""
echo "Backup location: $BACKUP_DIR"
