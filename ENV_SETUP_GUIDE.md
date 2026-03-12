# 🔧 ENVIRONMENT VARIABLES SETUP GUIDE

**Project**: FSTIVO Event Management Platform
**Current Status**: Ready for configuration
**Time Required**: 30 minutes - 2 hours
**Difficulty**: Easy

---

## 📋 OVERVIEW

This guide will help you configure all required environment variables for FSTIVO to work in production.

### Required Services:
1. **Supabase** (Database & Auth) - 15 minutes
2. **Stripe** (Payments) - 10 minutes
3. **Resend** (Email) - 5 minutes
4. **Security Keys** (CSRF, Encryption) - 1 minute

### Optional Services:
- Twilio (SMS/2FA)
- OpenAI (AI Features)
- Upstash Redis (Caching)
- Pakistani Payment Gateways (JazzCash, EasyPaisa)

---

## 🔴 CRITICAL STEP 0: PREPARATION

### Create your environment file:

```bash
# Navigate to project
cd /home/rizwan/attempt_02

# Copy the example template
cp .env.example .env.local

# Edit the file
nano .env.local
# or
code .env.local
# or
vim .env.local
```

### Check current placeholders:

```bash
# Count placeholders remaining
grep -iE "your_|placeholder|TODO|example\.com|your-project" .env.local | wc -l
```

**Expected**: Should show > 0 (we'll fix this!)

---

## 🔴 STEP 1: SUPABASE SETUP (15 minutes)

### Why: Required for database, authentication, and file storage

#### 1A. Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub (recommended)
4. Click "New Project"
5. Fill in:
   - **Name**: `fstivo-prod` (or your preferred name)
   - **Database Password**: Generate a strong password (SAVE IT!)
   - **Region**: Choose closest to your users (Southeast Asia for Pakistan)
6. Click "Create new project"
7. Wait 2-3 minutes for project to be ready

#### 1B. Get Your API Credentials

Once project is ready:

1. Go to **Settings** → **API**
2. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon public: eyJhbGc... (long string)
service_role: eyJhbGc... (long string, KEEP SECRET!)
```

#### 1C. Add to .env.local

Replace these lines in your `.env.local`:

```bash
# Database & Authentication
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**⚠️ IMPORTANT**:
- `NEXT_PUBLIC_SUPABASE_URL` - Your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - The "anon/public" key
- `SUPABASE_SERVICE_ROLE_KEY` - The "service_role" key (NEVER commit this!)

#### 1D. Run Database Migrations

```bash
# Using Supabase CLI (recommended)
npx supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Or manually in Supabase dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of supabase/migrations/001_initial_schema.sql
# 3. Paste and run
```

#### 1E. Verify Connection

```bash
# Start dev server
npm run dev

# Open browser to http://localhost:3000
# Try to register/login - should work!
```

**✅ Success Criteria**: Can register/login successfully

---

## 🔴 STEP 2: STRIPE SETUP (10 minutes)

### Why: Required for payment processing

#### 2A. Create Stripe Account

1. Go to https://dashboard.stripe.com/register
2. Sign up (use email for production, or test with existing account)
3. Complete onboarding if prompted

#### 2B. Get API Keys

1. In Stripe dashboard, click **Developers** → **API keys**
2. You'll see two modes: **Test** (for development) and **Live** (for production)

3. For now, use **Test mode** keys:

```
Publishable key: pk_test_...
Secret key: sk_test_...
```

#### 2C. Add to .env.local

```bash
# Payment Processing (Stripe)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### 2D: Set Up Webhook (For Production)

**Skip for development, do for production:**

1. In Stripe dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://your-domain.com/api/payments/webhook`
4. **Events to listen to**: Select all payment events
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - charge.succeeded
   - charge.failed
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_...`)

```bash
# Add webhook secret to .env.local
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 2E: Test Payment (Development)

```bash
# Start dev server
npm run dev

# Create an event with a ticket
# Try to purchase - should redirect to Stripe test page
# Use test card: 4242 4242 4242 4242
# Any future date for expiry
# Any 3 digits for CVC
# Any postal code
```

**✅ Success Criteria**: Test payment completes successfully

---

## 🔴 STEP 3: RESEND EMAIL SETUP (5 minutes)

### Why: Required for sending emails (notifications, password reset, etc.)

#### 3A. Create Resend Account

1. Go to https://resend.com/signup
2. Sign up (use GitHub for quick signup)
3. Verify your email

#### 3B: Get API Key

1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it "FSTIVO Production"
4. Copy the key (starts with `re_...`)

#### 3C: Add to .env.local

```bash
# Email Service (Resend)
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_RESEND_FROM_EMAIL=noreply@fstivo.com
```

**For Development**: Use `onboarding@resend.dev` as from email (free tier)

#### 3D: Send Test Email

```bash
# Start dev server
npm run dev

# Open browser to http://localhost:3000/test-email
# Or use the API endpoint:
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"toEmail": "your-email@example.com"}'
```

**✅ Success Criteria**: Test email arrives in your inbox

---

## 🔴 STEP 4: SECURITY KEYS (1 minute)

### Why: Required for CSRF protection and encryption

### Generate Secure Keys

Run these commands and copy the output:

```bash
# Generate CSRF Secret (32 bytes = 64 hex chars)
echo "CSRF_SECRET=$(openssl rand -hex 32)"

# Generate Encryption Key (32 bytes = 64 hex chars)
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"

# Generate Hash Salt (16 bytes = 32 hex chars)
echo "HASH_SALT=$(openssl rand -hex 16)"
```

### Add to .env.local

```bash
# Security
CSRF_SECRET=64_hex_characters_here
ENCRYPTION_KEY=64_hex_characters_here
HASH_SALT=32_hex_characters_here
```

**✅ Success Criteria**: All three keys are 64/32 character hex strings

---

## 🟡 OPTIONAL SERVICES

### TWILIO (SMS & 2FA)

**Skip for initial deployment, add later if needed**

```bash
# Get from: https://www.twilio.com/console
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### OPENAI (AI Features)

**Skip for initial deployment, add later if needed**

```bash
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...
```

### UPSTASH REDIS (Caching)

**Optional - improves performance**

```bash
# Get from: https://upstash.com
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

### PAKISTANI PAYMENT GATEWAYS

**For local payment methods**

```bash
# JazzCash
JAZZCASH_MERCHANT_ID=your_merchant_id
JAZZCASH_PASSWORD=your_password
JAZZCASH_SALT=your_salt

# EasyPaisa
EASYPAISA_STORE_ID=your_store_id
EASYPAISA_SECRET_KEY=your_secret_key
```

---

## ✅ FINAL VERIFICATION

### Check All Required Variables:

```bash
# Should return 0 if all configured
grep -iE "your_|placeholder|TODO|example\.com|your-project" .env.local | wc -l
```

### Test Build:

```bash
npm run build
```

### Test Development Server:

```bash
npm run dev
```

### Test Critical Features:

1. ✅ **Registration/Login**: Create account, login
2. ✅ **Create Event**: Create a test event
3. ✅ **Purchase Ticket**: Buy a ticket (Stripe test mode)
4. ✅ **Send Email**: Trigger an email notification

---

## 🚨 COMMON ISSUES

### Issue: "Supabase connection failed"

**Solution**:
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct (no typos)
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` matches dashboard
- Check network connectivity

### Issue: "Stripe error: Invalid API key"

**Solution**:
- Verify `STRIPE_SECRET_KEY` is correct (starts with `sk_test_` or `sk_live_`)
- Make sure you're using the right mode (test vs live)

### Issue: "Email not sending"

**Solution**:
- Check `RESEND_API_KEY` is valid
- Verify from email is verified in Resend dashboard
- Check spam folder

### Issue: "Build fails with env var error"

**Solution**:
- Check for spaces around `=` in .env.local
- Should be: `KEY=value` not `KEY = value`
- Restart dev server after changing .env.local

---

## 🔒 SECURITY BEST PRACTICES

### ✅ DO:
- Use different keys for development and production
- Rotate keys periodically (every 90 days)
- Use strong, randomly generated keys
- Keep `.env.local` in `.gitignore` (already done)
- Never commit `.env.local` to git

### ❌ DON'T:
- Don't use example/placeholder values in production
- Don't share service role keys publicly
- Don't use the same key across multiple projects
- Don't hardcode keys in source code

---

## 📋 CHECKLIST

Before deploying to production:

- [ ] Supabase configured (URL, anon key, service role key)
- [ ] Supabase migrations run successfully
- [ ] Stripe configured (secret key, publishable key)
- [ ] Stripe webhook configured (production only)
- [ ] Resend configured (API key, from email)
- [ ] Security keys generated (CSRF, encryption, hash)
- [ ] No placeholder values remaining
- [ ] Build succeeds (`npm run build`)
- [ ] Dev server starts (`npm run dev`)
- [ ] Can register/login
- [ ] Can create event
- [ ] Can purchase ticket (test mode)
- [ ] Can send email

---

## 🎯 NEXT STEPS

After configuration is complete:

1. **Commit changes**: `git add . && git commit -m "Configure environment variables"`
2. **Deploy to Vercel**: `vercel --prod`
3. **Set environment variables in Vercel dashboard**
4. **Test production deployment**
5. **Monitor for 24 hours**

---

## 📞 NEED HELP?

- **Supabase**: https://supabase.com/docs
- **Stripe**: https://stripe.com/docs
- **Resend**: https://resend.com/docs
- **Vercel**: https://vercel.com/docs

---

**Guide Complete**: January 28, 2026
**Estimated Setup Time**: 30 minutes - 2 hours
**Difficulty**: Easy
**Result**: Production-ready FSTIVO platform ✅
