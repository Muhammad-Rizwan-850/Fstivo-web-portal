#!/bin/bash

# ============================================================================
# TEST COVERAGE IMPROVEMENT SCRIPT - FSTIVO
# ============================================================================
# Current: 0.73% | Target: 70%+
# This script analyzes coverage and creates improvement plan
# ============================================================================

set -e

echo "📊 FSTIVO TEST COVERAGE ANALYSIS"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    exit 1
fi

echo "✅ Found package.json"
echo ""

# ============================================================================
# ANALYZE COVERAGE
# ============================================================================
echo "🔍 Analyzing test coverage..."
echo ""

npm test -- --coverage --collectCoverageFrom='src/**/*.{ts,tsx}' \
  --collectCoverageFrom='!src/**/*.test.{ts,tsx}' \
  --collectCoverageFrom='!src/**/*.d.ts' \
  --coverageReporters=text --coverageReporters=json-summary \
  --passWithNoTests > logs/coverage_analysis.log 2>&1 || true

echo "Coverage analysis complete"
echo ""

# Extract key metrics if coverage file exists
if [ -f "coverage/coverage-summary.json" ]; then
    STATEMENTS=$(cat coverage/coverage-summary.json | grep -o '"statements":{"total":[0-9]*,"covered":[0-9]*,"skipped":[0-9]*,"pct":[0-9.]*' | grep -o '"pct":[0-9.]*' | cut -d':' -f2 || echo "0")
    BRANCHES=$(cat coverage/coverage-summary.json | grep -o '"branches":{"total":[0-9]*,"covered":[0-9]*,"skipped":[0-9]*,"pct":[0-9.]*' | grep -o '"pct":[0-9.]*' | cut -d':' -f2 || echo "0")
    FUNCTIONS=$(cat coverage/coverage-summary.json | grep -o '"functions":{"total":[0-9]*,"covered":[0-9]*,"skipped":[0-9]*,"pct":[0-9.]*' | grep -o '"pct":[0-9.]*' | cut -d':' -f2 || echo "0")
    LINES=$(cat coverage/coverage-summary.json | grep -o '"lines":{"total":[0-9]*,"covered":[0-9]*,"skipped":[0-9]*,"pct":[0-9.]*' | grep -o '"pct":[0-9.]*' | cut -d':' -f2 || echo "0")

    echo "============================================================================"
    echo "CURRENT COVERAGE METRICS"
    echo "============================================================================"
    echo ""
    echo "  Statements: $STATEMENTS%"
    echo "  Branches:   $BRANCHES%"
    echo "  Functions:  $FUNCTIONS%"
    echo "  Lines:      $LINES%"
    echo ""
    echo "Target: 70%+ for all metrics"
    echo "Gap to fill: 70 - $STATEMENTS% statements"
    echo ""
fi

echo "📋 RECOMMENDED APPROACH:"
echo "  1. Test validators & utilities first (quick wins)"
echo "  2. Test critical API routes"
echo "  3. Test key components"
echo "  4. Add integration tests for user flows"
echo ""
echo "📄 Full report: logs/coverage_analysis.log"
echo "📄 HTML report: coverage/index.html (open in browser)"
echo ""
echo "✅ Script completed successfully!"
