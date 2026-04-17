# 🚀 FSTIVO - Vercel Deployment Guide

Complete guide for deploying FSTIVO to Vercel with custom domain and environment configuration.

---

## 📋 Prerequisites

Before deploying, ensure you have:
- [ ] Vercel account (https://vercel.com)
- [ ] GitHub account with FSTIVO repository
- [ ] Supabase project created and credentials ready
- [ ] Environment variables configured
- [ ] Database schema migrated

---

## 🎯 Deployment Architecture

```
                    ┌─────────────────┐
                    │   Vercel Edge   │
                    │   (Global CDN)  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Next.js App    │
                    │  (Serverless)   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐       ┌─────▼──────┐      ┌────▼────┐
    │ Supabase│       │   Stripe   │      │ Resend  │
    │ (DB+Auth)│       │ (Payments) │      │ (Email) │
    └─────────┘       └────────────┘      └─────────┘
```

---

## 🚀 Step 1: Deploy to Vercel (2 minutes)

### Option A: Via Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview (staging)
cd /home/rizwan/attempt_02
vercel

# Follow the prompts:
# - Set up and deploy: Yes
# - Which scope: Select your account
# - Link to existing project: No
# - Project name: fstivo
# - Directory: ./
# - Override settings: No

# Your preview URL will be: https://fstivo-xxx.vercel.app
```

### Option B: Via Dashboard

1. **Go to https://vercel.com**
2. **Click "Add New" → "Project"**
3. **Import Git Repository**
4. **Select: Fstivo-web-portal**
5. **Configure:**
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. **Click "Deploy"**

---

## 🔧 Step 2: Configure Environment Variables (5 minutes)

### Via Vercel Dashboard:

1. **Go to:** Project → Settings → Environment Variables
2. **Add each variable** from your `.env.local`

### Via Vercel CLI:

```bash
# Import all environment variables at once
vercel env pull .env.production

# Or add individually
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... etc
```

### Required Variables (Production):

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://fstivo.com
NEXT_PUBLIC_SITE_URL=https://fstivo.com

# Supabase (CRITICAL)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email (CRITICAL)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@fstivo.com

# Payments (CRITICAL)
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Security
CRON_SECRET=xxx
ENCRYPTION_KEY=xxx

# Optional (but recommended)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

---

## 🌐 Step 3: Configure Custom Domain (5 minutes)

### Via Vercel Dashboard:

1. **Go to:** Project → Settings → Domains
2. **Add Domain:** `fstivo.com`
3. **Choose option:**
   - **Option A:** Use Vercel DNS (recommended)
   - **Option B:** Use your own DNS provider

### Option A: Vercel DNS (Easiest)

1. **Select "Move DNS to Vercel"**
2. **Vercel will automatically configure:**
   - `fstivo.com` (A record)
   - `www.fstivo.com` (CNAME)
   - Email records (MX)
   - SPF/DKIM records

### Option B: Your DNS Provider

Add these records to your DNS:

```
Type    Name    Value
A       @       76.76.21.21
A       @       76.76.21.22
CNAME   www     cname.vercel-dns.com

# For email (if using Resend)
TXT     @       v=spf1 include:resend.com ~all
TXT     _dmarc  v=DMARC1; p=none
TXT     resend._domainkey  (value from Resend dashboard)
```

### Update DNS on Your Provider:

- **Namecheap:** Advanced DNS
- **GoDaddy:** DNS Management
- **Cloudflare:** DNS Records
- **Google Domains:** DNS Settings

---

## 🔐 Step 4: Configure SSL Certificate (Automatic)

Vercel automatically provisions SSL certificates:
- ✅ Automatic HTTPS
- ✅ Certificate renewal
- ✅ HTTP → HTTPS redirect
- ✅ HSTS enabled

**Note:** Certificate provisioning may take 5-30 minutes after DNS propagation.

---

## 📊 Step 5: Configure Webhooks (5 minutes)

### Stripe Webhook:

1. **Go to:** Stripe Dashboard → Developers → Webhooks
2. **Add endpoint:** `https://fstivo.com/api/payments/webhook`
3. **Select events:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `invoice.paid`
   - `invoice.payment_failed`
4. **Copy webhook secret** → Add to Vercel env vars

### JazzCash/Easypaisa Webhooks:

Add these return URLs in your payment provider dashboard:
- Return URL: `https://fstivo.com/api/payments/jazzcash/callback`
- Return URL: `https://fstivo.com/api/payments/easypaisa/callback`

---

## 🔧 Step 6: Vercel Configuration (Optional)

Create `vercel.json` for advanced configuration:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["hkg1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

**Note:** `hkg1` is Hong Kong region - closest to Pakistan.

---

## ✅ Step 7: Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or via CLI with alias
vercel alias set https://fstivo-xxx.vercel.app fstivo.com
```

---

## 🧪 Step 8: Post-Deployment Verification

### Health Checks:

```bash
# Check if site is up
curl https://fstivo.com/api/health

# Expected response:
# {"status":"ok","timestamp":"..."}

# Check database connection
curl https://fstivo.com/api/health/ready

# Expected response:
# {"status":"ready","database":"connected","redis":"connected"}
```

### Manual Testing Checklist:

- [ ] Homepage loads
- [ ] Navigation works
- [ ] Auth flow (sign up/login)
- [ ] Create event (as organizer)
- [ ] Register for event
- [ ] Payment flow (test mode)
- [ ] Email notifications
- [ ] Dashboard loads
- [ ] Mobile responsive

---

## 🔍 Step 9: Configure Monitoring

### Vercel Analytics:

1. **Go to:** Project → Analytics
2. **Enable:** Web Vitals, Sessions
3. **Install:** @vercel/analytics (already in package.json)

### Error Tracking (Sentry):

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure
npx @sentry/wizard -i nextjs
```

### Uptime Monitoring:

Use services like:
- UptimeRobot (free)
- Pingdom
- Better Uptime

---

## 📈 Step 10: Performance Optimization

### Enable Vercel Edge Network:

Already configured via `next.config.js`:

```javascript
module.exports = {
  experimental: {
    serverActions: true,
  },
}
```

### Configure Edge Functions:

```javascript
// app/api/edge/route.ts
export const runtime = 'edge';
export const region = 'hkg1';
```

---

## 🔄 CI/CD Pipeline

Vercel automatically deploys on:
- ✅ Push to `main` branch → Production
- ✅ Push to other branches → Preview deployments
- ✅ Pull requests → Preview deployments

### Configure Protected Branches:

1. **Go to:** Project → Git
2. **Enable:** "Protected Branches"
3. **Set:** `main` or `master` as protected
4. **Require:** Review before deploying

---

## 🆘 Troubleshooting

### Issue: Build fails

**Common causes:**
- Missing environment variables
- TypeScript errors
- Dependency conflicts

**Fix:**
```bash
# Test build locally
npm run build

# Check for errors
npm run typecheck
```

### Issue: Environment variables not working

**Fix:**
- Ensure variables are added to **Production** environment (not Preview)
- Variables with `NEXT_PUBLIC_` prefix are available in browser
- Server-only variables don't have the prefix

### Issue: API routes returning 404

**Fix:**
- Ensure `vercel.json` has correct rewrites
- Check API routes are in `app/api/` directory
- Verify build output includes API routes

### Issue: Database connection fails

**Fix:**
- Check Supabase URL format
- Verify service role key
- Ensure Supabase project is not paused

---

## 📊 Deployment Checklist

- [ ] Vercel project created
- [ ] Environment variables configured
- [ ] Custom domain added
- [ ] DNS configured
- [ ] SSL certificate active
- [ ] Database migrated
- [ ] Payment webhooks configured
- [ ] Email service tested
- [ ] Health checks passing
- [ ] Monitoring enabled
- [ ] Error tracking configured
- [ ] Backup strategy in place

---

## 🎯 Post-Deployment Actions

### 1. Set Up Backups

- **Database:** Enable in Supabase Dashboard
- **Code:** Git repository (already backed up)
- **Assets:** Vercel Blob Storage

### 2. Configure CDN

Vercel Edge Network is automatically configured.

### 3. Set Up Alerts

- Vercel project alerts (deploy failures)
- Sentry error alerts
- Uptime monitoring alerts

### 4. Documentation

- Update API documentation
- Create runbook for common issues
- Document rollback procedure

---

## 🔄 Rollback Procedure

If something goes wrong:

```bash
# Option 1: Via Vercel Dashboard
# Go to: Deployments → Click on previous successful deployment → "Promote to Production"

# Option 2: Via CLI
vercel rollback
```

---

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Status:** https://www.vercel-status.com
- **GitHub Issues:** For project-specific issues

---

**Deployment Status:** ⏳ Ready for deployment
**Last Updated:** 2025-01-17
