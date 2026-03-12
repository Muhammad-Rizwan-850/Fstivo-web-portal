# 🚀 FSTIVO Deployment Guide

Complete guide for deploying FSTIVO to production.

## 📋 Pre-Deployment Checklist

### Required Accounts
- [ ] Vercel account (recommended) or alternative hosting
- [ ] Supabase production project
- [ ] Stripe account (live keys)
- [ ] JazzCash merchant account (Pakistan payments)
- [ ] EasyPaisa merchant account (Pakistan payments)
- [ ] Resend account (email)
- [ ] Domain name registered

### Optional Services
- [ ] Twilio account (SMS/WhatsApp)
- [ ] OpenAI API key (AI features)
- [ ] Sentry account (error monitoring)
- [ ] Upstash Redis (caching)

---

## 🔧 Environment Setup

### 1. Supabase Production Project

```bash
# Create new Supabase project
1. Go to https://app.supabase.com
2. Click "New Project"
3. Name: fstivo-production
4. Database Password: Generate strong password
5. Region: Choose closest to Pakistan (Singapore recommended)

# Get credentials
- Project URL: https://your-project.supabase.co
- Anon Key: eyJ... (from Settings > API)
- Service Role Key: eyJ... (from Settings > API)
```

### 2. Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push

# Verify migrations
supabase db diff
```

### 3. Configure Stripe

```bash
# Get live keys from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Create webhook endpoint
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: https://your-domain.com/api/webhooks/stripe
3. Select events:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - checkout.session.completed
4. Copy webhook secret: whsec_...
```

### 4. Configure Payment Providers

#### JazzCash
```bash
# Contact JazzCash for merchant credentials
JAZZCASH_MERCHANT_ID=your_merchant_id
JAZZCASH_PASSWORD=your_password
JAZZCASH_INTEGRITY_SALT=your_salt
JAZZCASH_RETURN_URL=https://your-domain.com/webhooks/jazzcash
```

#### EasyPaisa
```bash
# Contact EasyPaisa for merchant credentials
EASYPAISA_STORE_ID=your_store_id
EASYPAISA_SECRET_KEY=your_secret_key
EASYPAISA_CALLBACK_URL=https://your-domain.com/webhooks/easypaisa
```

---

## 🌐 Vercel Deployment

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Deploy to production
vercel --prod
```

### 3. Configure Environment Variables

```bash
# Add via Vercel dashboard or CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add STRIPE_SECRET_KEY production
# ... add all other variables
```

### 4. Configure Domain

```bash
# Add custom domain
vercel domains add your-domain.com

# Configure DNS
1. Go to your domain registrar
2. Add CNAME record:
   - Name: @ or www
   - Value: cname.vercel-dns.com
3. Wait for DNS propagation (5-30 minutes)
```

---

## 🐳 Docker Deployment (Alternative)

### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Deploy to Docker

```bash
# Build image
docker build -t fstivo:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  fstivo:latest
```

---

## 🔐 Security Configuration

### 1. HTTPS/SSL

Vercel automatically provides SSL. For custom hosting:

```bash
# Use Let's Encrypt with Certbot
sudo certbot --nginx -d your-domain.com
```

### 2. Rate Limiting

Configure Upstash Redis for production rate limiting:

```bash
# Create account at https://console.upstash.com
# Create Redis database
# Copy credentials
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 3. CORS Configuration

Already configured in `next.config.js`. Verify allowed origins.

---

## 📊 Monitoring Setup

### 1. Sentry Error Tracking

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs

# Add to environment
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

### 2. Analytics

```bash
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...

# Vercel Analytics (automatic)
# Already installed via @vercel/analytics
```

---

## ✅ Post-Deployment Verification

### 1. Health Checks

```bash
# Check API health
curl https://your-domain.com/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-08T...",
  "services": {
    "database": "operational",
    "api": "operational"
  }
}
```

### 2. Test Payment Flows

```bash
# Test Stripe
1. Create test event
2. Purchase ticket with test card: 4242 4242 4242 4242
3. Verify order in database

# Test JazzCash
1. Use JazzCash sandbox credentials
2. Complete test transaction
3. Verify webhook received

# Test EasyPaisa
1. Use EasyPaisa test credentials
2. Complete test transaction
3. Verify webhook received
```

### 3. Smoke Tests

```bash
# Run E2E tests against production
PLAYWRIGHT_TEST_BASE_URL=https://your-domain.com npm run test:e2e
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run typecheck
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🚨 Rollback Procedure

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Database Rollback

```bash
# Revert last migration
supabase migration revert

# Or manually in Supabase SQL Editor
-- Run previous migration
```

---

## 📈 Performance Optimization

### 1. Enable Caching

```bash
# Add Redis for caching
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 2. CDN Configuration

Vercel automatically uses CDN. For custom:

```bash
# Cloudflare setup
1. Add site to Cloudflare
2. Update nameservers
3. Enable caching rules
4. Set cache TTL
```

### 3. Image Optimization

Already configured via Next.js Image. Verify:

```typescript
// next.config.js
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200],
  imageSizes: [16, 32, 48, 64, 96],
}
```

---

## 🔍 Monitoring & Alerts

### 1. Uptime Monitoring

```bash
# Use services like:
- UptimeRobot (free)
- Pingdom
- StatusCake

# Monitor endpoints:
- https://your-domain.com
- https://your-domain.com/api/health
```

### 2. Error Alerts

```bash
# Sentry alerts already configured
# Add Slack/email notifications in Sentry dashboard
```

### 3. Performance Monitoring

```bash
# Vercel Analytics (automatic)
# View at: https://vercel.com/dashboard/analytics

# Custom metrics
import { sendMetric } from '@vercel/analytics';
sendMetric('page-view', 1);
```

---

## 💾 Backup Strategy

### Database Backups

```bash
# Supabase automatic backups (daily)
# Manual backup:
pg_dump $DATABASE_URL > backup.sql

# Restore:
psql $DATABASE_URL < backup.sql
```

### Storage Backups

```bash
# Supabase Storage (automatic)
# Or setup AWS S3 sync:
aws s3 sync supabase-bucket s3://backup-bucket
```

---

## 📞 Support & Maintenance

### Health Dashboard

```bash
# Create status page
# Use services like:
- StatusPage.io
- Atlassian Statuspage
- Custom with Vercel

# Display:
- API status
- Database status
- Payment gateway status
```

### Maintenance Mode

```bash
# Create middleware/maintenance.ts
export function middleware(request: NextRequest) {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return new NextResponse('Under maintenance', { status: 503 });
  }
}
```

---

## ✅ Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Payment webhooks verified
- [ ] Email sending tested
- [ ] Error monitoring active
- [ ] Analytics tracking
- [ ] Backups configured
- [ ] CI/CD pipeline active
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated
- [ ] Team trained
- [ ] Support channels ready

---

## 🎉 Launch!

Once all checks pass:

1. Announce maintenance window
2. Deploy to production
3. Monitor logs for 1 hour
4. Test critical user flows
5. Announce launch
6. Monitor for 24 hours

---

For issues during deployment, refer to SECURITY.md for security policies.
