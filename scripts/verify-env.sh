#!/usr/bin/env bash
# ==============================================================================
# FSTIVO Environment Variables Verification Script
# ==============================================================================
# Usage: ./scripts/verify-env.sh
#
# This script checks if all required environment variables are set
# ==============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
REQUIRED_TOTAL=0
REQUIRED_SET=0
OPTIONAL_TOTAL=0
OPTIONAL_SET=0

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  FSTIVO Environment Variables Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

# Function to check if variable is set
check_var() {
    local var_name=$1
    local required=$2
    local description=$3

    if [ -z "${!var_name:-}" ]; then
        if [ "$required" = "true" ]; then
            echo -e "${RED}✗ MISSING${NC}  $var_name"
            echo -e "           $description"
            ((REQUIRED_TOTAL++))
        else
            echo -e "${YELLOW}○ NOT SET${NC}  $var_name (optional)"
            echo -e "           $description"
            ((OPTIONAL_TOTAL++))
        fi
    else
        if [ "$required" = "true" ]; then
            echo -e "${GREEN}✓ SET${NC}      $var_name"
            ((REQUIRED_SET++))
            ((REQUIRED_TOTAL++))
        else
            echo -e "${GREEN}✓ SET${NC}      $var_name (optional)"
            ((OPTIONAL_SET++))
            ((OPTIONAL_TOTAL++))
        fi
    fi
}

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  REQUIRED VARIABLES${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

# Application
check_var "NODE_ENV" "true" "Application environment (development/production)"
check_var "NEXT_PUBLIC_APP_URL" "true" "Base URL of the application"
check_var "NEXT_PUBLIC_SITE_URL" "true" "Site URL for SEO/metadata"

echo ""
# Supabase
check_var "NEXT_PUBLIC_SUPABASE_URL" "true" "Supabase project URL"
check_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "true" "Supabase anonymous key"
check_var "SUPABASE_SERVICE_ROLE_KEY" "true" "Supabase service role key (server-only)"

echo ""
# Email
check_var "RESEND_API_KEY" "true" "Resend API key for transactional emails"

echo ""
# Payments (at least one gateway required)
PAYMENT_GATEWAY=false
if [ -n "${STRIPE_SECRET_KEY:-}" ] || [ -n "${JAZZCASH_MERCHANT_ID:-}" ] || [ -n "${EASYPAISA_STORE_ID:-}" ]; then
    PAYMENT_GATEWAY=true
    echo -e "${GREEN}✓ PAYMENT GATEWAY CONFIGURED${NC}"
    check_var "STRIPE_SECRET_KEY" "false" "Stripe secret key"
    check_var "STRIPE_WEBHOOK_SECRET" "false" "Stripe webhook secret"
    check_var "JAZZCASH_MERCHANT_ID" "false" "JazzCash merchant ID"
    check_var "EASYPAISA_STORE_ID" "false" "Easypaisa store ID"
else
    echo -e "${RED}✗ NO PAYMENT GATEWAY CONFIGURED${NC}"
    echo -e "           At least one payment gateway is required for ticket sales"
    ((REQUIRED_TOTAL++))
fi

echo ""
# Security
check_var "CRON_SECRET" "true" "Secret for cron job verification"
check_var "ENCRYPTION_KEY" "true" "Encryption key for sensitive data"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  OPTIONAL VARIABLES${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

# Caching
check_var "UPSTASH_REDIS_REST_URL" "false" "Upstash Redis URL for caching"

echo ""
# SMS
check_var "TWILIO_ACCOUNT_SID" "false" "Twilio account SID for SMS"
check_var "TWILIO_AUTH_TOKEN" "false" "Twilio auth token"
check_var "TWILIO_PHONE_NUMBER" "false" "Twilio phone number"

echo ""
# Push Notifications
check_var "NEXT_PUBLIC_VAPID_PUBLIC_KEY" "false" "VAPID public key for push notifications"
check_var "VAPID_PRIVATE_KEY" "false" "VAPID private key"

echo ""
# Analytics
check_var "NEXT_PUBLIC_GA_MEASUREMENT_ID" "false" "Google Analytics measurement ID"
check_var "NEXT_PUBLIC_SENTRY_DSN" "false" "Sentry DSN for error tracking"

echo ""
# AI
check_var "OPENAI_API_KEY" "false" "OpenAI API key for AI features"

echo ""
# Maps
check_var "NEXT_PUBLIC_MAPBOX_TOKEN" "false" "Mapbox token for maps"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

# Calculate percentage
if [ $REQUIRED_TOTAL -gt 0 ]; then
    PERCENT=$((REQUIRED_SET * 100 / REQUIRED_TOTAL))
    echo -e "Required: ${GREEN}$REQUIRED_SET${NC}/$REQUIRED_TOTAL ($PERCENT%)"
else
    echo -e "Required: ${GREEN}0/0${NC}"
fi

echo -e "Optional: ${GREEN}$OPTIONAL_SET${NC}/$OPTIONAL_TOTAL"

echo ""

if [ $REQUIRED_SET -eq $REQUIRED_TOTAL ]; then
    echo -e "${GREEN}✓ All required environment variables are set!${NC}"
    echo -e "${GREEN}  You're ready to deploy to production.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some required environment variables are missing.${NC}"
    echo -e "${YELLOW}  Please set them before deploying to production.${NC}"
    echo ""
    echo -e "Run: ${BLUE}cat .env.production${NC} to see the complete list"
    exit 1
fi
