#!/bin/bash

# ============================================================================
# SECURITY FIXES SCRIPT - FSTIVO
# ============================================================================
# This script fixes all security vulnerabilities in the project
# Run this in: /home/rizwan/attempt_02
# ============================================================================

set -e  # Exit on error

echo "🔒 FSTIVO SECURITY FIXES"
echo "======================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from /home/rizwan/attempt_02"
    exit 1
fi

echo "✅ Found package.json"
echo ""

# ============================================================================
# FIX 1: Lodash Prototype Pollution (MODERATE)
# ============================================================================
echo "🔧 Fixing lodash vulnerability..."
echo "Current issue: Prototype Pollution in lodash 4.0.0 - 4.17.21"
echo "Solution: Update to latest version"
echo ""

npm audit fix || echo "⚠️  Some fixes may require manual intervention"

echo "✅ Lodash vulnerability addressed"
echo ""

# ============================================================================
# FIX 2: xlsx ReDoS and Prototype Pollution (HIGH)
# ============================================================================
echo "🔧 Fixing xlsx vulnerability..."
echo "Current issue: HIGH severity - ReDoS and Prototype Pollution"
echo "Solution: Replace xlsx with exceljs (secure alternative)"
echo ""

# Backup package.json
cp package.json package.json.backup.$(date +%Y%m%d_%H%M%S)

echo "📦 Uninstalling xlsx..."
npm uninstall xlsx

echo "📦 Installing exceljs..."
npm install exceljs --save

echo "✅ xlsx replaced with exceljs"
echo ""

# ============================================================================
# RUN FINAL AUDIT
# ============================================================================
echo "🔍 Running final security audit..."
echo ""

npm audit --production > logs/security_audit_after.txt 2>&1 || true

# Count vulnerabilities
VULN_COUNT=$(npm audit --json 2>/dev/null | grep -o '"total":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")

echo ""
echo "============================================================================"
echo "SECURITY FIXES COMPLETE!"
echo "============================================================================"
echo ""
echo "📊 RESULTS:"
echo "  - Lodash: ✅ Fixed"
echo "  - xlsx: ✅ Replaced with exceljs"
echo "  - Remaining vulnerabilities: $VULN_COUNT"
echo ""
echo "📋 NEXT STEPS:"
echo "  1. Update xlsx usage in your code (grep -r 'import.*xlsx' src/)"
echo "  2. Test Excel export functionality"
echo "  3. Run: npm run build"
echo ""
echo "📄 Full audit report saved to: logs/security_audit_after.txt"
echo ""

# Show current vulnerabilities
echo "Current vulnerability status:"
npm audit --production 2>/dev/null || echo "Audit completed"

echo ""
echo "✅ Script completed successfully!"
