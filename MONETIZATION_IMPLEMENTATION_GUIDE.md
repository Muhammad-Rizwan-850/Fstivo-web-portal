# 🚀 FSTIVO Missing Features - Implementation Guide

## 📋 Overview

This guide provides step-by-step instructions to implement all missing features identified in the gap analysis. Follow this guide to bring your FSTIVO platform from 60% to 100% completion.

---

## 🎯 Implementation Priority

### Phase 1: Critical Infrastructure (Week 1-2) 🔴
1. Database Migrations
2. Monetization Layer
3. Core API Routes
4. Dashboard Pages

### Phase 2: Enhanced Functionality (Week 3-4) 🟠
5. Components Library
6. Server Actions
7. Type Definitions
8. Event Structure

### Phase 3: Quality & Polish (Week 5-6) 🟡
9. Validators
10. Custom Hooks
11. Testing Suite
12. Documentation

---

## 📦 Installation & Setup

### Step 1: Run the Generator Script

```bash
# Make the script executable
chmod +x generate-missing-features.sh

# Run the generator
./generate-missing-features.sh
```

This will create:
- 120+ directories
- 150+ files with templates
- Proper folder structure

### Step 2: Install Required Dependencies

```bash
# Install new dependencies
npm install stripe @stripe/stripe-js
npm install zod
npm install recharts
npm install date-fns
npm install react-hook-form @hookform/resolvers

# Install dev dependencies
npm install -D @types/node
```

### Step 3: Run Database Migrations

```bash
# In your Supabase project dashboard or CLI:

# 1. Subscription System
psql -f supabase/migrations/20250103_subscription_system.sql

# 2. Sponsored Events & Ads
psql -f supabase/migrations/20250103_sponsored_ads.sql

# 3. Affiliate System
psql -f supabase/migrations/20250103_affiliate_system.sql
```

Or using Supabase CLI:

```bash
supabase db push
```

### Step 4: Update Environment Variables

Add to your `.env.local`:

```bash
# Stripe (for subscriptions)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Feature flags
NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS=true
NEXT_PUBLIC_ENABLE_SPONSORED_EVENTS=true
NEXT_PUBLIC_ENABLE_ADS=true
NEXT_PUBLIC_ENABLE_AFFILIATE=true

# Minimum payout threshold
AFFILIATE_MIN_PAYOUT=1000
```

---

## 🔧 Phase 1: Critical Infrastructure

### 1.1 Implement Monetization Layer

#### Subscription System

**File**: `src/lib/monetization/subscription/features.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';

export async function checkSubscriptionLimit(
  userId: string,
  feature: string,
  increment: number = 1
): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('check_subscription_limit', {
    p_user_id: userId,
    p_metric: feature,
    p_increment: increment
  });

  if (error) {
    console.error('Error checking subscription limit:', error);
    return false;
  }

  return data;
}

export async function incrementUsage(
  userId: string,
  metric: string,
  value: number = 1
): Promise<void> {
  const supabase = createClient();

  await supabase.rpc('increment_subscription_usage', {
    p_user_id: userId,
    p_metric: metric,
    p_value: value
  });
}

export async function getFeatureAccess(userId: string) {
  const supabase = createClient();

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('plan:subscription_plans(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!subscription?.plan) {
    return {
      events_per_year: 5,
      attendees_per_event: 100,
      email_campaigns: 0,
      custom_branding: false,
      api_access: false
    };
  }

  return subscription.plan.limits;
}
```

**File**: `src/lib/monetization/subscription/billing.ts`

```typescript
'use server';

import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function createSubscription(
  userId: string,
  planId: string,
  billingCycle: 'monthly' | 'yearly'
) {
  const supabase = createClient();

  // Get user email
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not found');

  // Get plan
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (!plan) throw new Error('Plan not found');

  // Create or get Stripe customer
  let customerId = null;
  const { data: existingSub } = await supabase
    .from('user_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (existingSub?.stripe_customer_id) {
    customerId = existingSub.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: userId }
    });
    customerId = customer.id;
  }

  // Create subscription
  const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{
      price_data: {
        currency: 'pkr',
        product_data: {
          name: plan.name,
          description: plan.description
        },
        recurring: {
          interval: billingCycle === 'yearly' ? 'year' : 'month'
        },
        unit_amount: Math.round(price * 100)
      }
    }],
    metadata: {
      user_id: userId,
      plan_id: planId
    }
  });

  // Save to database
  const periodStart = new Date(subscription.current_period_start * 1000);
  const periodEnd = new Date(subscription.current_period_end * 1000);

  await supabase.from('user_subscriptions').insert({
    user_id: userId,
    plan_id: planId,
    status: subscription.status,
    billing_cycle: billingCycle,
    current_period_start: periodStart.toISOString(),
    current_period_end: periodEnd.toISOString(),
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId
  });

  return { subscriptionId: subscription.id };
}

export async function cancelSubscription(userId: string) {
  const supabase = createClient();

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!subscription?.stripe_subscription_id) {
    throw new Error('No active subscription found');
  }

  // Cancel at period end
  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: true
  });

  await supabase
    .from('user_subscriptions')
    .update({
      cancel_at_period_end: true,
      canceled_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.stripe_subscription_id);

  return { success: true };
}
```

#### Affiliate System

**File**: `src/lib/monetization/affiliate/tracking.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function trackAffiliateClick(linkCode: string) {
  const supabase = createClient();
  const cookieStore = cookies();

  // Generate session ID
  let sessionId = cookieStore.get('affiliate_session')?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    cookieStore.set('affiliate_session', sessionId, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
  }

  // Store affiliate link code in cookie
  cookieStore.set('affiliate_ref', linkCode, {
    maxAge: 30 * 24 * 60 * 60,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });

  // Track click in database
  const { data, error } = await supabase.rpc('track_affiliate_click', {
    p_link_code: linkCode,
    p_session_id: sessionId,
    p_user_id: null,
    p_ip_address: null,
    p_user_agent: null,
    p_referrer: null
  });

  if (error) {
    console.error('Error tracking affiliate click:', error);
  }

  return { success: true };
}

export async function recordAffiliateConversion(
  orderId: string,
  orderAmount: number,
  conversionType: 'ticket_purchase' | 'event_creation' | 'subscription'
) {
  const supabase = createClient();
  const cookieStore = cookies();

  const sessionId = cookieStore.get('affiliate_session')?.value;
  if (!sessionId) return null;

  const { data, error } = await supabase.rpc('record_affiliate_conversion', {
    p_session_id: sessionId,
    p_conversion_type: conversionType,
    p_order_id: orderId,
    p_order_amount: orderAmount,
    p_user_id: null
  });

  if (error) {
    console.error('Error recording conversion:', error);
    return null;
  }

  return data;
}
```

### 1.2 Implement Core API Routes

#### Subscription API

**File**: `src/app/api/subscriptions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionPlans } from '@/lib/monetization/subscription/plans';

export async function GET(request: NextRequest) {
  try {
    const plans = await getSubscriptionPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
```

**File**: `src/app/api/subscriptions/subscribe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSubscription } from '@/lib/monetization/subscription/billing';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { planId, billingCycle } = await request.json();

    const result = await createSubscription(user.id, planId, billingCycle);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
```

#### Affiliate API

**File**: `src/app/api/affiliate/register/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Generate affiliate code
    const { data: codeData } = await supabase.rpc('generate_affiliate_code');

    // Create affiliate profile
    const { data, error } = await supabase
      .from('affiliate_profiles')
      .insert({
        user_id: user.id,
        affiliate_code: codeData,
        ...body
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error('Error registering affiliate:', error);
    return NextResponse.json(
      { error: 'Failed to register as affiliate' },
      { status: 500 }
    );
  }
}
```

### 1.3 Implement Dashboard Pages

**File**: `src/app/dashboard/subscription/page.tsx`

```typescript
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserSubscription } from '@/lib/monetization/subscription/plans';

export default async function SubscriptionPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const subscription = await getUserSubscription(user.id);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Subscription</h1>

      {subscription ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Current Plan: {subscription.plan?.name}
          </h2>
          <p className="text-gray-600 mb-4">
            Status: <span className="capitalize">{subscription.status}</span>
          </p>
          <p className="text-gray-600 mb-4">
            Billing Cycle: {subscription.billing_cycle}
          </p>
          <p className="text-gray-600">
            Next billing date: {new Date(subscription.current_period_end).toLocaleDateString()}
          </p>

          <div className="mt-6 space-x-4">
            <a
              href="/dashboard/subscription/plans"
              className="btn btn-primary"
            >
              Change Plan
            </a>
            <button className="btn btn-secondary">
              Cancel Subscription
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="mb-4">You don't have an active subscription.</p>
          <a
            href="/dashboard/subscription/plans"
            className="btn btn-primary"
          >
            View Plans
          </a>
        </div>
      )}
    </div>
  );
}
```

---

## 📚 Complete Implementation Checklist

### Database & Backend ✅

- [x] Run subscription migration
- [x] Run sponsored/ads migration
- [x] Run affiliate migration
- [ ] Test all database functions
- [ ] Verify RLS policies work
- [ ] Check indexes performance

### Monetization Layer ✅

- [x] Subscription plans logic
- [x] Feature gating system
- [x] Billing integration (Stripe)
- [x] Usage tracking
- [x] Affiliate tracking system
- [ ] Ad serving system
- [ ] Sponsored placement logic

### API Routes (78 routes)

#### Subscriptions (8 routes)
- [x] GET /api/subscriptions
- [x] POST /api/subscriptions/subscribe
- [ ] POST /api/subscriptions/cancel
- [ ] POST /api/subscriptions/upgrade
- [ ] GET /api/subscriptions/usage
- [ ] GET /api/subscriptions/invoices

#### Affiliate (10 routes)
- [x] POST /api/affiliate/register
- [ ] GET /api/affiliate/links
- [ ] POST /api/affiliate/links
- [ ] GET /api/affiliate/earnings
- [ ] GET /api/affiliate/payouts
- [ ] POST /api/affiliate/payouts/request
- [ ] GET /api/affiliate/leaderboard

#### Ads (8 routes)
- [ ] GET /api/ads
- [ ] POST /api/ads
- [ ] GET /api/ads/[id]
- [ ] POST /api/ads/[id]/pause
- [ ] POST /api/ads/[id]/resume
- [ ] POST /api/ads/impression
- [ ] POST /api/ads/click

... (Continue for all 78 routes)

### Dashboard Pages (25+ pages)

- [x] Subscription management
- [ ] Campaign manager
- [ ] Template system
- [ ] Venue management
- [ ] Sponsored events
- [ ] Ads dashboard
- [ ] Affiliate dashboard
- [ ] Network pages
- [ ] Settings pages

### Components (50+ components)

- [ ] Ticketing components (10)
- [ ] Seating components (6)
- [ ] Social components (8)
- [ ] Campaign components (7)
- [ ] Subscription components (5)
- [ ] Affiliate components (6)

### Testing

- [ ] Unit tests (100+)
- [ ] Integration tests (50+)
- [ ] E2E tests (30+)

---

## 🎓 Best Practices

1. **Always check authentication** before any operation
2. **Use server actions** for data mutations
3. **Implement proper error handling** with try-catch
4. **Add loading states** for better UX
5. **Use TypeScript** for type safety
6. **Follow the existing code patterns**
7. **Test each feature** before moving to next
8. **Document complex logic** with comments

---

## 🚨 Common Issues & Solutions

### Issue: RLS policies blocking queries
**Solution**: Use service role key for admin operations

### Issue: Stripe webhooks not working
**Solution**: Use `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Issue: Affiliate tracking not working
**Solution**: Check cookies are being set correctly

---

## 📊 Progress Tracking

Use this to track your implementation progress:

```
Total Features: 150+
Completed: ___
Remaining: ___
Progress: ___%
```

---

## 🎉 Completion Criteria

Your platform is 100% complete when:

1. ✅ All 3 database migrations run successfully
2. ✅ All 12 monetization files implemented
3. ✅ All 78 API routes functional
4. ✅ All 25+ dashboard pages working
5. ✅ All 50+ components built
6. ✅ Subscription system fully functional
7. ✅ Affiliate program operational
8. ✅ Ad system serving ads
9. ✅ All tests passing (78% coverage)
10. ✅ Documentation updated

---

## 📞 Support

If you encounter issues:

1. Check the error logs in Supabase dashboard
2. Review the database migration files
3. Test API endpoints with Postman
4. Verify environment variables are set
5. Check RLS policies in Supabase

---

**Ready to begin?** Start with Phase 1, Step 1: Run the generator script!
