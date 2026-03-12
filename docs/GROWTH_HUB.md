# FSTIVO Growth Hub - Marketing & Referral System

## Overview

The **Growth Hub** is a comprehensive marketing and referral system that incentivizes users to invite friends, share events, and engage with the platform. It includes:

- ✅ **Referral Program** - Users earn ₨200 for each friend who signs up and attends an event
- ✅ **Rewards Catalog** - Redeem points for tickets, credits, badges, and more
- ✅ **Campaigns System** - Gamified challenges with milestone rewards
- ✅ **Share & Earn** - Share events on social media to earn bonus points
- ✅ **Analytics Dashboard** - Track referrals, earnings, and progress

---

## Features

### 1. Referral Program

**How It Works:**
1. **Share Your Link** - Each user gets a unique referral code
2. **Friend Signs Up** - Friend uses the code and gets ₨200 instant credit
3. **Both Win** - When friend attends first event, referrer gets ₨200 + 100 points

**Referral Tiers:**
- **Bronze (1-5 referrals)**: 100 points per referral
- **Silver (6-15 referrals)**: 120 points per referral
- **Gold (16-30 referrals)**: 150 points per referral
- **Platinum (30+ referrals)**: 200 points per referral

**Earnings Example:**
- 5 referrals = ₨1,000 + 500 points
- 10 referrals = ₨2,000 + 1,200 points
- 25 referrals = ₨5,000 + 3,750 points

### 2. Rewards Catalog

Users can redeem points for:

| Reward | Points | Category | Availability |
|--------|--------|----------|--------------|
| Free Event Ticket | 500 | Tickets | 100 |
| ₨500 Event Credit | 400 | Credits | 200 |
| Premium Badge | 300 | Badges | 50 |
| Featured Profile | 600 | Promotion | 20 |
| Organizer Pack | 800 | Tools | 30 |
| Coffee Gift Card | 250 | Vouchers | 60 |

### 3. Active Campaigns

Gamified challenges with rewards:

- **Friend Fest 2024** - Invite 5 friends → Free Premium Ticket
- **Social Sharer** - Share 3 events → 200 Points
- **Review Master** - Leave 5 reviews → VIP Badge
- **Event Explorer** - Register for 10 events → 500 Points

### 4. Share & Earn

- **Share Events**: 10 points per share (max 5 per day)
- **Refer FSTIVO**: 50 points per successful referral
- **Social Platforms**: WhatsApp, Facebook, Twitter, LinkedIn, Email

---

## File Structure

```
src/
├── components/features/
│   └── marketing-growth-system.tsx    # Main component
├── lib/actions/
│   └── marketing-server.ts             # Server actions
└── types/
    └── marketing.ts                     # TypeScript types (if needed)

supabase/migrations/
└── 004_referral_rewards_system.sql     # Database schema
```

---

## Database Schema

### Tables Created

#### 1. `referrals`
```sql
- id: UUID (primary key)
- referrer_id: UUID (foreign key → user_profiles)
- referred_email: TEXT
- referred_name: TEXT
- status: 'pending' | 'completed' | 'cancelled'
- points_earned: INTEGER
- created_at: TIMESTAMPTZ
- completed_at: TIMESTAMPTZ
```

#### 2. `rewards_catalog`
```sql
- id: UUID (primary key)
- title: TEXT
- description: TEXT
- points_required: INTEGER
- category: 'tickets' | 'credits' | 'badges' | 'promotion' | 'tools' | 'vouchers'
- icon: TEXT (emoji)
- available: INTEGER
- active: BOOLEAN
- popular: BOOLEAN
```

#### 3. `reward_redemptions`
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key → user_profiles)
- reward_id: UUID (foreign key → rewards_catalog)
- reward_title: TEXT
- points_spent: INTEGER
- status: 'pending' | 'completed' | 'cancelled'
- redeemed_at: TIMESTAMPTZ
- metadata: JSONB
```

#### 4. `campaigns`
```sql
- id: UUID (primary key)
- title: TEXT
- description: TEXT
- type: 'referral' | 'social' | 'engagement' | 'milestone'
- target: INTEGER
- reward_title: TEXT
- reward_type: 'points' | 'ticket' | 'badge' | 'credit'
- reward_value: INTEGER
- start_date: TIMESTAMPTZ
- end_date: TIMESTAMPTZ
- status: 'active' | 'completed' | 'cancelled'
```

#### 5. `campaign_progress`
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key → user_profiles)
- campaign_id: UUID (foreign key → campaigns)
- progress_type: 'referral' | 'share' | 'engagement'
- target_id: TEXT
- created_at: TIMESTAMPTZ
```

#### 6. `share_tracking`
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key → user_profiles)
- event_id: UUID (foreign key → events)
- platform: 'whatsapp' | 'facebook' | 'twitter' | 'linkedin' | 'email' | 'other'
- share_url: TEXT
- points_earned: INTEGER
- created_at: TIMESTAMPTZ
```

### Updated `user_profiles` Table

Added columns:
```sql
- referral_code: TEXT (UNIQUE)
- referral_points: INTEGER (DEFAULT 0)
- total_referrals: INTEGER (DEFAULT 0)
```

---

## Server Actions

Located in `src/lib/actions/marketing-server.ts`

### Referral System

```typescript
// Generate referral code for user
generateReferralCode(userId: string)

// Create new referral record
createReferral(data: ReferralData)

// Complete referral and award points
completeReferral(referralId: string)

// Get user's referral stats
getUserReferralStats(userId: string)
```

### Reward System

```typescript
// Redeem reward
redeemReward(redemption: RewardRedemption)

// Get user's redemption history
getUserRedemptions(userId: string)
```

### Campaign System

```typescript
// Track campaign progress
trackCampaignProgress(progress: CampaignProgress)

// Get active campaigns
getActiveCampaigns()

// Get user's campaign progress
getUserCampaignProgress(userId: string)
```

### Share Tracking

```typescript
// Track event share
trackShare(userId: string, eventId: string, platform: string)

// Get user's share stats
getUserShareStats(userId: string)
```

---

## Component Usage

### Basic Usage

```tsx
import { MarketingGrowthSystem } from '@/components/features/marketing-growth-system'

export default function GrowthPage() {
  return (
    <MarketingGrowthSystem userId={user.id} />
  )
}
```

### With Current User (from Supabase)

```tsx
import { MarketingGrowthSystem } from '@/components/features/marketing-growth-system'
import { createClient } from '@/lib/auth/config'

export default async function GrowthPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <MarketingGrowthSystem userId={user?.id} />
  )
}
```

### Standalone Demo Mode

```tsx
// Without userId - shows mock data
<MarketingGrowthSystem />
```

---

## Tabs Overview

### 1. Referral Program Tab

**Features:**
- Unique referral code display
- Copy-to-clipboard functionality
- Social share buttons (WhatsApp, Facebook, Twitter, LinkedIn, Email)
- "How It Works" explanation (3 steps)
- Recent referrals list with status
- Total earnings display

**Social Sharing:**
Opens share dialog with pre-filled message:
```
"Join me on FSTIVO! Use my code {CODE} and get ₨200 credit on your first event. 🎉"
```

### 2. Campaigns Tab

**Features:**
- Active campaigns with progress bars
- Campaign details (target, current, reward)
- End date display
- Completed campaigns section

**Progress Tracking:**
- Visual progress bar
- Target vs current count
- Automatic progress updates

### 3. Rewards Tab

**Features:**
- Rewards catalog with filtering
- Category filters (All, Tickets, Credits, Badges, Vouchers)
- Point cost display
- Availability counter
- Popular badge highlighting
- Redeem button with confirmation modal

**Redemption Flow:**
1. Click "Redeem Now"
2. Confirm in modal
3. Points deducted
4. Redemption record created

### 4. Share & Earn Tab

**Features:**
- Earn points grid (Share Events, Refer FSTIVO)
- Platform selection buttons
- Point earning rates display
- Share stats overview

**Point Earning:**
- Event shares: +10 points (max 5/day)
- FSTIVO referrals: +50 points
- No daily limit on referral points

---

## Setting Up Database

### 1. Run Migration

```bash
# Using Supabase CLI
supabase migration up --file supabase/migrations/004_referral_rewards_system.sql

# Or apply manually in Supabase SQL Editor
# Copy contents of 004_referral_rewards_system.sql
```

### 2. Verify Tables

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('referrals', 'rewards_catalog', 'reward_redemptions', 'campaigns', 'campaign_progress', 'share_tracking');

-- Check columns added to user_profiles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN ('referral_code', 'referral_points', 'total_referrals');
```

### 3. Check Seed Data

```sql
-- View rewards catalog
SELECT * FROM rewards_catalog WHERE active = true;

-- View campaigns
SELECT * FROM campaigns WHERE status = 'active';
```

---

## Integration Examples

### 1. Add Referral Code to Signup

```tsx
// app/signup/page.tsx
import { generateReferralCode } from '@/lib/actions/marketing-server'

const handleSignup = async (email: string, referralCode?: string) => {
  // Create user account...

  // If referred by someone, create referral record
  if (referralCode) {
    const referrer = await getUserByReferralCode(referralCode)
    if (referrer) {
      await createReferral({
        referrer_id: referrer.id,
        referred_email: email,
        status: 'pending'
      })
    }
  }
}
```

### 2. Track Event Shares

```tsx
// components/features/event-details.tsx
import { trackShare } from '@/lib/actions/marketing-server'

const handleShareEvent = async (eventId: string, platform: string) => {
  await trackShare(user.id, eventId, platform)

  // Open share dialog
  const shareUrl = `${window.location.origin}/events/${eventId}`
  window.open(getShareUrl(platform, shareUrl), '_blank')
}
```

### 3. Complete Referral on First Event

```tsx
// lib/actions/registrations.ts
import { completeReferral } from '@/lib/actions/marketing-server'

const handleCheckIn = async (registrationId: string) => {
  // Process check-in...

  // Check if this is first event for referral
  const registration = await getRegistration(registrationId)
  const userEvents = await getUserEventCount(registration.user_id)

  if (userEvents === 1) {
    // Complete referral
    const referral = await getReferralByEmail(registration.user_email)
    if (referral) {
      await completeReferral(referral.id)
    }
  }
}
```

---

## API Endpoints

If you need REST API endpoints instead of server actions:

### Referral Endpoints

```typescript
// GET /api/marketing/referral/stats
// Get user's referral stats

// POST /api/marketing/referral/generate
// Generate new referral code

// POST /api/marketing/referral/create
// Create referral record

// POST /api/marketing/referral/complete/:id
// Complete referral
```

### Reward Endpoints

```typescript
// GET /api/marketing/rewards/catalog
// Get rewards catalog

// POST /api/marketing/rewards/redeem
// Redeem reward

// GET /api/marketing/rewards/history
// Get user's redemption history
```

### Campaign Endpoints

```typescript
// GET /api/marketing/campaigns/active
// Get active campaigns

// GET /api/marketing/campaigns/progress
// Get user's campaign progress

// POST /api/marketing/campaigns/track
// Track campaign progress
```

---

## Analytics & Reporting

### Views Created

#### `referral_analytics`
```sql
SELECT * FROM referral_analytics;
```
- User referral stats
- Completed vs pending referrals
- Points from referrals
- Potential earnings

#### `top_referrers`
```sql
SELECT * FROM top_referrers;
```
- Leaderboard of top referrers
- Last 30 days activity
- Ranking by performance

#### `campaign_analytics`
```sql
SELECT * FROM campaign_analytics;
```
- Campaign participation stats
- Completion rates
- Total actions per campaign

### Custom Queries

**Referral Leaderboard:**
```sql
SELECT
    up.first_name,
    up.last_name,
    up.total_referrals,
    up.referral_points
FROM user_profiles up
ORDER BY up.total_referrals DESC
LIMIT 10;
```

**Reward Redemption Stats:**
```sql
SELECT
    reward_title,
    COUNT(*) as total_redemptions,
    SUM(points_spent) as total_points_spent
FROM reward_redemptions
WHERE status = 'completed'
GROUP BY reward_title
ORDER BY total_redemptions DESC;
```

**Monthly Referral Growth:**
```sql
SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as new_referrals,
    COUNT(*) FILTER (WHERE status = 'completed') as completed
FROM referrals
GROUP BY month
ORDER BY month DESC
LIMIT 12;
```

---

## Customization

### Change Referral Reward

```typescript
// In marketing-server.ts
export async function completeReferral(referralId: string) {
  // Change this value to adjust referral reward
  const REFERRAL_REWARD = 200 // Default ₨200
  const POINTS_REWARD = 100   // Default 100 points

  // ... rest of function
}
```

### Add New Reward Category

```sql
INSERT INTO rewards_catalog (title, description, points_required, category, icon, available)
VALUES ('New Reward', 'Description', 500, 'new_category', '🎁', 100);
```

### Create New Campaign

```sql
INSERT INTO campaigns (title, description, type, target, reward_title, reward_type, reward_value, end_date)
VALUES ('New Campaign', 'Description', 'referral', 10, 'Free Ticket', 'ticket', 500, '2025-12-31');
```

---

## Testing

### Test Referral Flow

```bash
# 1. Create test user with referral code
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'

# 2. Get referral code
curl http://localhost:3000/api/marketing/referral/stats

# 3. Create referral
curl -X POST http://localhost:3000/api/marketing/referral/create \
  -H "Content-Type: application/json" \
  -d '{"referrer_id": "...", "referred_email": "friend@example.com"}'

# 4. Complete referral
curl -X POST http://localhost:3000/api/marketing/referral/complete/{id}
```

### Test Reward Redemption

```bash
# 1. Check user points
curl http://localhost:3000/api/marketing/referral/stats

# 2. Redeem reward
curl -X POST http://localhost:3000/api/marketing/rewards/redeem \
  -H "Content-Type: application/json" \
  -d '{"user_id": "...", "reward_id": "...", "points_spent": 500}'

# 3. Check redemption history
curl http://localhost:3000/api/marketing/rewards/history
```

---

## Troubleshooting

### Issue: Referral code not generating

**Solution:**
```sql
-- Check trigger exists
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'before_user_profile_insert';

-- Recreate if missing
-- See migration file line: "CREATE TRIGGER before_user_profile_insert"
```

### Issue: Points not being awarded

**Solution:**
```sql
-- Check referral status
SELECT * FROM referrals WHERE referrer_id = 'user_id';

-- Check trigger exists
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'after_registration_insert';

-- Manually complete referral
SELECT complete_referral('referral_id');
```

### Issue: Campaign progress not tracking

**Solution:**
```typescript
// Ensure you're calling trackCampaignProgress
await trackCampaignProgress({
  user_id: userId,
  campaign_id: campaignId,
  progress_type: 'share',
  target_id: eventId
})
```

---

## Security Considerations

### RLS Policies

All tables have Row Level Security enabled:
- ✅ Users can only see their own data
- ✅ Users can only insert their own records
- ✅ Rewards catalog is publicly readable
- ✅ No user can modify rewards or campaigns

### Rate Limiting

Consider adding rate limiting to:
- Referral creation (prevent spam)
- Share tracking (max 5 per day for points)
- Reward redemption (prevent abuse)

### Input Validation

All inputs should be validated:
```typescript
import { z } from 'zod'

const ReferralSchema = z.object({
  referrer_id: z.uuid(),
  referred_email: z.email().optional(),
  referred_name: z.string().optional(),
  status: z.enum(['pending', 'completed', 'cancelled'])
})
```

---

## Performance Optimization

### Indexes Created

- `idx_referrals_referrer_id` - Fast referral lookups
- `idx_referrals_status` - Filter by status
- `idx_rewards_catalog_active` - Get active rewards
- `idx_campaign_progress_user_id` - User progress lookups
- `idx_share_tracking_created_at` - Recent shares

### Query Optimization

```sql
-- Use views for complex queries
SELECT * FROM referral_analytics WHERE user_id = '...';

-- Use materialized views for analytics
CREATE MATERIALIZED VIEW mv_top_referrers AS
SELECT * FROM top_referrers;

-- Refresh periodically
REFRESH MATERIALIZED VIEW mv_top_referrers;
```

---

## Future Enhancements

### Phase 2 Features

- [ ] Multi-level referral program (earn from referrals' referrals)
- [ ] Tier-based rewards (higher tiers get better rewards)
- [ ] Limited-time flash rewards
- [ ] Referral leaderboard with prizes
- [ ] Birthday bonuses
- [ ] Anniversary rewards
- [ ] Social media integration tracking
- [ ] QR code referral cards
- [ ] Referral performance dashboard
- [ ] Automated email notifications for rewards

### Phase 3 Features

- [ ] Cash withdrawals
- [ ] Partner rewards (external brands)
- [ ] Event-specific referral bonuses
- [ ] Geo-targeted campaigns
- [ ] A/B testing for campaigns
- [ ] Predictive analytics for churn prevention
- [ ] Achievement badges system
- [ ] Social sharing contest

---

## Support

For issues or questions:
- Check migration file: `supabase/migrations/004_referral_rewards_system.sql`
- Check server actions: `src/lib/actions/marketing-server.ts`
- Check component: `src/components/features/marketing-growth-system.tsx`

---

**Generated for FSTIVO Platform**
*Marketing & Referral System v1.0*
