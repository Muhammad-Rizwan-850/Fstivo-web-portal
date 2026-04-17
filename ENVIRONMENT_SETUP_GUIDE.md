# 🚀 FSTIVO Environment Setup Guide

This guide helps you quickly configure all required services for FSTIVO production deployment.

---

## 📋 Quick Reference: Required Services

| Service | Purpose | Free Tier? | Time to Setup |
|---------|---------|------------|---------------|
| **Supabase** | Database & Auth | ✅ Yes | 5 min |
| **Resend** | Transactional Emails | ✅ Yes (3K/day) | 3 min |
| **Stripe** | Payment Processing | ✅ Yes (test mode) | 5 min |
| **Upstash** | Redis Caching | ✅ Yes (10K commands/day) | 3 min |
| **Twilio** | SMS Notifications | ❌ Paid only | 5 min |
| **Vercel** | Hosting | ✅ Yes (Hobby) | 2 min |

---

## 🔧 Step-by-Step Setup

### 1️⃣ Supabase (Database + Auth)

**Required:** ✅ YES

```bash
# 1. Go to https://supabase.com
# 2. Click "Start your project"
# 3. Sign in with GitHub
# 4. Create new organization
# 5. Create new project:
#    - Name: fstivo-prod
#    - Region: Southeast Asia (Singapore) - closest to Pakistan
#    - Wait ~2 minutes for provisioning

# 6. Get credentials:
# Settings → API → Copy the following:

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # Keep this secret!
```

**Run Migrations:**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref xxxx-xxxx

# Push database schema
supabase db push
```

---

### 2️⃣ Resend (Email Service)

**Required:** ✅ YES

```bash
# 1. Go to https://resend.com
# 2. Sign up / Sign in
# 3. Go to API Keys
# 4. Create new API key

RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Configure Domain (for production):**
```bash
# In Resend Dashboard:
# 1. Go to Domains
# 2. Add domain: fstivo.com
# 3. Add DNS records:
#    TXT: resend._domainkey.fstivo.com
#    TXT: _dmarc.fstivo.com
# 4. Verify domain
```

---

### 3️⃣ Stripe (Payments)

**Required:** ✅ YES

```bash
# 1. Go to https://dashboard.stripe.com
# 2. Sign up
# 3. Get API keys from: Developers → API keys

# Test mode (for development):
STRIPE_SECRET_KEY=sk_test_51xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Live mode (for production - complete Stripe verification first):
STRIPE_SECRET_KEY=sk_live_51xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**Configure Webhook:**
```bash
# 1. Developers → Webhooks → Add endpoint
# 2. URL: https://your-domain.com/api/payments/webhook
# 3. Select events to listen for:
#    - payment_intent.succeeded
#    - payment_intent.payment_failed
#    - charge.refunded
#    - invoice.paid
#    - invoice.payment_failed
# 5. Copy webhook signing secret
```

---

### 4️⃣ Upstash Redis (Caching)

**Required:** ⚠️ RECOMMENDED

```bash
# 1. Go to https://upstash.com
# 2. Sign up
# 3. Create database:
#    - Name: fstivo-cache
#    - Region: ap-southeast-1 (Singapore)
# 4. Copy REST API credentials

UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxx...
```

---

### 5️⃣ Twilio (SMS)

**Required:** ⚠️ OPTIONAL

```bash
# 1. Go to https://console.twilio.com
# 2. Sign up
# 3. Get a phone number (Pakistan numbers available)
# 4. Copy credentials

TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+923001234567
```

---

### 6️⃣ Generate VAPID Keys (Push Notifications)

**Required:** ⚠️ OPTIONAL

```bash
# Run this command:
npx web-push generate-vaptcha-keys

# Output:
# Public Key: xxxxxxx
# Private Key: xxxxxxx

NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxxxxx
VAPID_PRIVATE_KEY=xxxxxx
```

---

## 🔐 Security Keys (Generate These)

```bash
# Generate 32-byte secrets for production:
openssl rand -base64 32

# Use for:
CRON_SECRET=xxxxxx
ENCRYPTION_KEY=xxxxxx
```

---

## 📝 Complete .env.production Template

Copy `.env.production` and fill in your values:

```bash
cp .env.production .env.local
# Edit .env.local with your credentials
```

---

## ✅ Pre-Deployment Checklist

Before deploying to Vercel:

```bash
# 1. Test locally first
npm run build
npm start

# 2. Verify database connection
npm run test:database

# 3. Test email service
# Go to http://localhost:3000/test-email

# 4. Test payment flow (test mode)
# Create event → Buy ticket → Test Stripe

# 5. Run all tests
npm test
npm run test:e2e
```

---

## 🚀 Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy to preview (staging)
vercel

# 4. Add environment variables in Vercel Dashboard:
# Settings → Environment Variables → Add each from .env.production

# 5. Deploy to production
vercel --prod
```

---

## 🆘 Troubleshooting

**Issue:** Supabase connection failed
**Fix:** Check `NEXT_PUBLIC_SUPABASE_URL` format (should be `https://xxx.supabase.co`)

**Issue:** Stripe webhook failing
**Fix:** Verify webhook secret matches dashboard endpoint

**Issue:** Emails not sending
**Fix:** Verify Resend API key and domain DNS records

**Issue:** Build fails with missing env var
**Fix:** Add missing variable to `.env.local` and Vercel dashboard

---

## 📞 Support

- **Documentation:** /docs
- **Issues:** GitHub Issues
- **Email:** support@fstivo.com
