#!/bin/bash

# ============================================================================
# TEST FIXES SCRIPT - FSTIVO
# ============================================================================
# This script helps fix the failing tests
# Run this in: /home/rizwan/attempt_02
# ============================================================================

set -e

echo "🧪 FSTIVO TEST FIXES"
echo "===================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    exit 1
fi

echo "✅ Found package.json"
echo ""

# ============================================================================
# IDENTIFY FAILING TESTS
# ============================================================================
echo "🔍 Identifying failing tests..."
echo ""

npm test -- --passWithNoTests 2>&1 | tee logs/test_results.log || true

FAILED_TESTS=$(grep -c "FAIL" logs/test_results.log 2>/dev/null || echo "0")
PASSED_TESTS=$(grep -c "PASS" logs/test_results.log 2>/dev/null || echo "0")

echo ""
echo "============================================================================"
echo "TEST ANALYSIS COMPLETE"
echo "============================================================================"
echo ""
echo "Results: Passed: $PASSED_TESTS, Failed: $FAILED_TESTS"
echo ""

if [ "$FAILED_TESTS" -gt 0 ]; then
    echo "⚠️  Some tests are failing"
    echo ""
    echo "Common issues to fix:"
    echo "  1. Logger tests - Console capture issues"
    echo "  2. Component tests - Price formatting mismatches"
    echo "  3. Integration tests - Expected console errors"
    echo ""
    echo "Next steps:"
    echo "  1. Check tests/unit/lib/utils/logger.test.ts"
    echo "  2. Check component tests for price formatting"
    echo "  3. Update jest.setup.ts to suppress expected errors"
    echo ""
else
    echo "✅ All tests passing!"
fi

echo ""
echo "✅ Script completed successfully!"
