# 🔧 Additional Services Configuration Guide

Complete setup for Resend email, payment webhooks, and other integrations.

---

## 📧 1. Resend Email Setup

### Step 1: Create Resend Account

1. **Go to:** https://resend.com
2. **Sign up** (free tier: 3,000 emails/day)
3. **Get API Key:** Settings → API Keys → Create API Key

### Step 2: Configure Domain

1. **Go to:** Domains → Add Domain
2. **Add:** `your-domain.com`
3. **Add DNS Records:**

```
Type: TXT
Name: resend._domainkey.your-domain.com
Value: (from Resend dashboard)

Type: TXT
Name: _dmarc.your-domain.com
Value: v=DMARC1; p=none

Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all
```

### Step 3: Update .env.local

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@your-domain.com
SUPPORT_EMAIL=support@your-domain.com
```

### Dashboard Links

- **API Keys:** https://resend.com/api-keys
- **Domains:** https://resend.com/domains
- **Emails:** https://resend.com/emails

---

## 💳 2. Stripe Payment Setup

### Step 1: Configure Stripe Account

1. **Go to:** https://dashboard.stripe.com
2. **Get API Keys:** Developers → API Keys

**Test Keys (start with):**
- Publishable: `pk_test_...`
- Secret: `sk_test_...`

**Live Keys (start with):**
- Publishable: `pk_live_...`
- Secret: `sk_live_...`

### Step 2: Create Webhook Endpoint

1. **Go to:** Developers → Webhooks → Add endpoint
2. **Endpoint URL:**
   - Development: `http://localhost:3000/api/payments/webhook`
   - Production: `https://your-domain.com/api/payments/webhook`
3. **Select Events:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `invoice.paid`
   - `invoice.payment_failed`

4. **Copy Webhook Secret** → Add to .env.local

### Dashboard Links

- **API Keys:** https://dashboard.stripe.com/apikeys
- **Webhooks:** https://dashboard.stripe.com/webhooks
- **Products:** https://dashboard.stripe.com/products

---

## 🇵🇰 3. JazzCash Payment Setup

### Step 1: Get JazzCash Credentials

1. **Go to:** https://jazzcash.com
2. **Apply for merchant account**
3. **Get credentials from dashboard**

### Required Environment Variables

```bash
JAZZCASH_MERCHANT_ID=your_merchant_id
JAZZCASH_PASSWORD=your_password
JAZZCASH_INTEGRITY_SALT=your_integrity_salt
```

### Webhook URL

```
https://your-domain.com/api/payments/jazzcash/callback
```

---

## 🇵🇰 4. Easypaisa Payment Setup

### Step 1: Get Easypaisa Credentials

1. **Go to:** https://easypaisa.com.pk
2. **Apply for merchant account**
3. **Get credentials from dashboard**

### Required Environment Variables

```bash
EASYPAISA_STORE_ID=your_store_id
EASYPAISA_SECRET_KEY=your_secret_key
```

### Webhook URL

```
https://your-domain.com/api/payments/easypaisa/callback
```

---

## 📱 5. Twilio SMS Setup (Optional)

### Step 1: Create Twilio Account

1. **Go to:** https://www.twilio.com
2. **Get a phone number**
3. **Get credentials from console**

### Required Environment Variables

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+923001234567
```

### Dashboard Links

- **Console:** https://console.twilio.com
- **Phone Numbers:** https://console.twilio.com/us1/phone-numbers

---

## 🔔 6. Push Notifications Setup

### Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

### Required Environment Variables

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:support@your-domain.com
```

---

## 📊 7. Upstash Redis Setup (Recommended)

### Step 1: Create Upstash Account

1. **Go to:** https://upstash.com
2. **Create database:**
   - Region: `ap-southeast-1` (Singapore)
   - Name: `fstivo-cache`

### Required Environment Variables

```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

### Dashboard Links

- **Dashboard:** https://upstash.com/dashboard
- **Redis Console:** https://upstash.com/redis

---

## 🎯 8. Google Analytics Setup

### Step 1: Create GA4 Property

1. **Go to:** https://analytics.google.com
2. **Create Account** → Property
3. **Get Measurement ID**

### Required Environment Variables

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Dashboard Links

- **Admin:** https://analytics.google.com/admin
- **Reports:** https://analytics.google.com/reports

---

## 🐛 9. Sentry Error Tracking Setup

### Step 1: Create Sentry Project

1. **Go to:** https://sentry.io
2. **Create project** → Next.js
3. **Get DSN**

### Required Environment Variables

```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=your_auth_token
```

### Dashboard Links

- **Projects:** https://sentry.io/projects
- **Settings:** https://sentry.io/settings

---

## ✅ Configuration Checklist

- [ ] Resend API key configured
- [ ] Resend domain verified (DNS)
- [ ] Stripe webhook endpoint created
- [ ] Stripe webhook secret added
- [ ] JazzCash credentials configured (optional)
- [ ] Easypaisa credentials configured (optional)
- [ ] Twilio configured (optional)
- [ ] VAPID keys generated
- [ ] Upstash Redis configured (recommended)
- [ ] Google Analytics configured
- [ ] Sentry error tracking configured

---

## 🧪 Testing Checklist

- [ ] Send test email (Resend)
- [ ] Create test payment (Stripe)
- [ ] Send test SMS (Twilio)
- [ ] Test push notification
- [ ] Verify Redis connection
- [ ] Check analytics tracking
- [ ] Trigger error for Sentry

---

## 📞 Service Quick Links

| Service | Dashboard |
|---------|-----------|
| Resend | https://resend.com/dashboard |
| Stripe | https://dashboard.stripe.com |
| JazzCash | https://jazzcash.com |
| Easypaisa | https://easypaisa.com.pk |
| Twilio | https://console.twilio.com |
| Upstash | https://upstash.com/dashboard |
| Google Analytics | https://analytics.google.com |
| Sentry | https://sentry.io |

---

**Last Updated:** 2025-01-17
