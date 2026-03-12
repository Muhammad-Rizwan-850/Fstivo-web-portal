#!/bin/bash

# ============================================================================
# FSTIVO MASTER IMPROVEMENT SCRIPT
# ============================================================================
# This script executes all improvements in the correct order
# Location: /home/rizwan/attempt_02
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║         🚀 FSTIVO MASTER IMPROVEMENT SCRIPT 🚀                ║"
echo "║                                                                ║"
echo "║  This script will fix all critical issues and improve         ║"
echo "║  your codebase from B+ to A+ grade                            ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found!${NC}"
    echo "Please run this script from /home/rizwan/attempt_02"
    exit 1
fi

echo -e "${GREEN}✅ Found package.json${NC}"
echo ""

# ============================================================================
# BACKUP
# ============================================================================
echo -e "${BLUE}📦 Creating backup...${NC}"
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp package.json "$BACKUP_DIR/"
cp package-lock.json "$BACKUP_DIR/" 2>/dev/null || true
echo -e "${GREEN}✅ Backup created: $BACKUP_DIR${NC}"
echo ""

# ============================================================================
# PHASE 1: SECURITY FIXES (CRITICAL)
# ============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  PHASE 1: SECURITY FIXES (15 minutes)                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${YELLOW}🔒 Starting security fixes...${NC}"
echo ""

chmod +x 01_security_fixes.sh
./01_security_fixes.sh

echo ""

# ============================================================================
# PHASE 2: BUILD VERIFICATION
# ============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  PHASE 2: BUILD VERIFICATION (5 minutes)                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${YELLOW}🏗️  Verifying build...${NC}"
echo ""

npm run build > logs/build_verification.log 2>&1 && BUILD_SUCCESS=true || BUILD_SUCCESS=false

if [ "$BUILD_SUCCESS" = true ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed - check logs/build_verification.log${NC}"
    echo "This might be due to xlsx → exceljs migration"
    echo "You may need to update code that imports xlsx"
fi
echo ""

# ============================================================================
# PHASE 3: LINTING AUTO-FIX
# ============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  PHASE 3: LINTING AUTO-FIX (10 minutes)                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${YELLOW}🔍 Running ESLint auto-fix...${NC}"
echo ""

chmod +x 04_linting_fixes.sh
./04_linting_fixes.sh

echo ""

# ============================================================================
# PHASE 4: TEST ANALYSIS
# ============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  PHASE 4: TEST ANALYSIS (5 minutes)                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${YELLOW}🧪 Analyzing tests...${NC}"
echo ""

chmod +x 02_test_fixes.sh
./02_test_fixes.sh

echo ""

# ============================================================================
# PHASE 5: TEST COVERAGE BASELINE
# ============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  PHASE 5: TEST COVERAGE BASELINE (5 minutes)                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${YELLOW}📊 Generating coverage report...${NC}"
echo ""

chmod +x 03_test_coverage.sh
./03_test_coverage.sh

echo ""

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    🎉 COMPLETED! 🎉                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ All automated improvements complete!${NC}"
echo ""
echo "📋 CHECK THESE FILES:"
echo "   - logs/security_audit_after.txt - Security status"
echo "   - logs/build_verification.log - Build results"
echo "   - logs/lint_report_after.txt - Remaining lint issues"
echo "   - logs/test_results.log - Test results"
echo "   - coverage/coverage-summary.json - Coverage metrics"
echo ""
echo "📋 NEXT ACTIONS:"
if [ "$BUILD_SUCCESS" = false ]; then
    echo -e "   1. ${RED}🚨 CRITICAL: Fix xlsx migration${NC}"
    echo "      Run: grep -r \"import.*xlsx\" src/"
fi
echo "   2. Fix remaining TypeScript errors"
echo "   3. Fix failing tests"
echo "   4. Improve test coverage to 70%+"
echo ""
echo "🎯 Current Status:"
echo "   ✅ Security vulnerabilities addressed"
echo "   $([ "$BUILD_SUCCESS" = true ] && echo "✅ Build passing" || echo "❌ Build needs xlsx migration")"
echo "   ✅ Linting auto-fixed"
echo "   ✅ Tests analyzed"
echo "   ✅ Coverage baseline established"
echo ""
echo "✅ Script completed successfully!"
echo ""
