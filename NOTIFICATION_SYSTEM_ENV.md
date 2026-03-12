# =====================================================
# FSTIVO NOTIFICATION SYSTEM - ENVIRONMENT VARIABLES
# =====================================================
# Add these to your .env.local file
# =====================================================

# =====================================================
# SUPABASE
# =====================================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# =====================================================
# RESEND (Email)
# =====================================================
# Get your API key from: https://resend.com
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# =====================================================
# TWILIO (SMS & WhatsApp) - Optional
# =====================================================
# Get credentials from: https://www.twilio.com/console
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# =====================================================
# WEB PUSH NOTIFICATIONS (VAPID) - Optional
# =====================================================
# Generate VAPID keys using web-push library:
# npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib37gp9NgWmLHn...
VAPID_PRIVATE_KEY=UUxI4O8-FbRouAevSmBQ6o8l5-g-p...
VAPID_SUBJECT=mailto:admin@fstivo.com

# =====================================================
# APP CONFIGURATION
# =====================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
# For production: https://fstivo.com

# =====================================================
# DEVELOPMENT MODE
# =====================================================
# Set to 'true' to log notifications instead of sending them
DEV_LOG_NOTIFICATIONS=false
