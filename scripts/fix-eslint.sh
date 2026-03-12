#!/bin/bash
# =====================================================
# ESLint Auto-Fixer Script
# Automatically fixes ESLint errors
# =====================================================

set -e

echo "🔧 Running ESLint auto-fix..."
npx eslint "**/*.{ts,tsx,js,jsx}" --fix || true

echo "✅ ESLint auto-fix complete"
echo ""
echo "ℹ️  Note: Some issues may require manual fixes"
