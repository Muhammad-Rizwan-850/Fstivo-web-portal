#!/bin/bash

# ============================================================================
# LINTING FIXES SCRIPT - FSTIVO
# ============================================================================
# Fixes ESLint warnings (any types, unused variables)
# ============================================================================

set -e

echo "🔍 FSTIVO LINTING FIXES"
echo "======================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    exit 1
fi

echo "✅ Found package.json"
echo ""

# ============================================================================
# ANALYZE CURRENT LINTING ISSUES
# ============================================================================
echo "📊 Analyzing linting issues..."
echo ""

npm run lint > logs/lint_report_before.txt 2>&1 || true

# Count issues
ANY_TYPES=$(grep -c "@typescript-eslint/no-explicit-any" logs/lint_report_before.txt 2>/dev/null || echo "0")
UNUSED_VARS=$(grep -c "no-unused-vars\|@typescript-eslint/no-unused-vars" logs/lint_report_before.txt 2>/dev/null || echo "0")
TOTAL_ERRORS=$(grep -c "error" logs/lint_report_before.txt 2>/dev/null || echo "0")

echo "Found issues:"
echo "  - 'any' types: $ANY_TYPES"
echo "  - Unused variables: $UNUSED_VARS"
echo "  - Total errors: $TOTAL_ERRORS"
echo ""

# ============================================================================
# RUN AUTO-FIX
# ============================================================================
echo "🔧 Running ESLint auto-fix..."
echo ""

npm run lint -- --fix > logs/lint_autofix.log 2>&1 || true

echo "✅ Auto-fixable issues resolved"
echo ""

# ============================================================================
# COUNT REMAINING ISSUES
# ============================================================================
echo "🔍 Checking remaining issues..."
echo ""

npm run lint > logs/lint_report_after.txt 2>&1 || true

REMAINING_ERRORS=$(grep -c "error" logs/lint_report_after.txt 2>/dev/null || echo "0")

echo ""
echo "============================================================================"
echo "LINTING FIXES COMPLETE!"
echo "============================================================================"
echo ""
echo "📊 RESULTS:"
echo "  - Errors before: $TOTAL_ERRORS"
echo "  - Errors after: $REMAINING_ERRORS"
echo "  - Fixed: $(($TOTAL_ERRORS - $REMAINING_ERRORS)) issues"
echo ""
if [ "$REMAINING_ERRORS" -gt 0 ]; then
    echo "⚠️  $REMAINING_ERRORS errors remain (manual fixes needed)"
    echo ""
    echo "📋 NEXT STEPS:"
    echo "  1. Review logs/lint_report_after.txt"
    echo "  2. Fix 'any' types by adding proper TypeScript types"
    echo "  3. Remove or prefix unused variables with underscore"
    echo "  4. Run: npm run lint -- path/to/file.ts --fix"
else
    echo "✅ All linting issues resolved!"
fi
echo ""
echo "✅ Script completed successfully!"
