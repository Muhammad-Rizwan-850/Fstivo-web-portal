# Test Priority Analysis - Quick Reference Guide

## Executive Summary

**Current Coverage:** 3.2% → **Target:** 50% → **Gap:** 46.8%

**Key Finding:** 15 untested database query files (9,500 LOC) + 45 untested action files (8,500 LOC) represent ~34% of src/lib code. These are the highest-priority targets.

**Estimated Effort:** 53 hours across 20 files → **Expected Coverage Gain:** 22-28%

---

## Critical Statistics

| Metric | Value |
|--------|-------|
| Total src/lib files (excluding tests) | 156 |
| Untested database query files | 15/15 (100%) |
| Untested action files | 45/45 (100%) |
| Total untested LOC in priority files | 14,185 |
| Estimated test cases needed | 515 |
| Current unit tests | 19 |
| Estimated new tests needed | ~260-300 |

---

## Top 5 Quick Wins (Highest Impact/Easiest)

### 1. **seating.ts** (1,011 LOC) - Database Queries
- **Impact:** HIGH (2.0%)
- **Difficulty:** MEDIUM
- **Key Functions:** Venue CRUD, seating layout, seat reservation, pricing tiers
- **Test Count:** 40 tests
- **Estimated Hours:** 8-10 hours
- **Why First:** Largest untested file, core business logic, many functions

```typescript
// Key test scenarios:
- GET venue with filters
- RESERVE seat (check availability, conflicts)
- APPLY accessibility requests
- CREATE pricing tiers
- Handle race conditions
```

### 2. **affiliate.ts** (902 LOC) - Database Queries
- **Impact:** HIGH (1.8%)
- **Difficulty:** MEDIUM
- **Key Functions:** Account management, referral tracking, commission calc, payouts
- **Test Count:** 35 tests
- **Estimated Hours:** 7-9 hours
- **Why Second:** Revenue-critical, complex state machine

### 3. **events-server.ts** (884 LOC) - Server Actions
- **Impact:** HIGH (1.7%)
- **Difficulty:** MEDIUM
- **Key Functions:** Search, CRUD, publishing, archiving, stats
- **Test Count:** 30 tests
- **Estimated Hours:** 6-8 hours
- **Why Third:** Core feature, many operations

### 4. **sponsored-ads.ts** (852 LOC) - Database Queries
- **Impact:** HIGH (1.7%)
- **Difficulty:** MEDIUM
- **Key Functions:** Campaign CRUD, inventory, impressions, clicks, metrics
- **Test Count:** 32 tests
- **Estimated Hours:** 6-8 hours

### 5. **email-marketing.ts** (816 LOC) - Database Queries
- **Impact:** HIGH (1.6%)
- **Difficulty:** MEDIUM
- **Key Functions:** List management, subscriber ops, campaigns, templates, metrics
- **Test Count:** 28 tests
- **Estimated Hours:** 5-7 hours

---

## Untested Files by Category

### Database Queries (15 files, 9,500+ LOC) - ALL UNTESTED
**Priority Order:**

| Rank | File | LOC | Functions | Impact |
|------|------|-----|-----------|--------|
| 1 | seating.ts | 1,011 | 25+ | HIGH |
| 2 | affiliate.ts | 902 | 30+ | HIGH |
| 4 | sponsored-ads.ts | 852 | 15+ | HIGH |
| 5 | email-marketing.ts | 816 | 14+ | HIGH |
| 8 | ticketing.ts | 723 | 15+ | HIGH |
| 9 | templates.ts | 698 | 13+ | MED-HIGH |
| 10 | subscriptions.ts | 693 | 15+ | MED-HIGH |
| 14 | analytics.ts | 615 | 11+ | MEDIUM |
| 16 | checkin.ts | 571 | 10+ | MEDIUM |
| 6 | events.ts | 521 | 12+ | HIGH |
| 3 | supabase/queries.ts | 894 | 20+ | HIGH |
| 7 | users.ts | 8,521 | 8+ | MEDIUM |
| 11 | preferences.ts | 11,202 | 10+ | MEDIUM |
| 12 | registrations.ts | 12,444 | 12+ | MEDIUM |
| 13 | social.ts | 11,432 | 10+ | MEDIUM |

### Server Actions (45 files, 8,500+ LOC) - ALL UNTESTED

**Must Test:**
- `events-server.ts` (884) - Core event ops
- `revenue-actions.ts` (792) - Financial calculations
- `events.ts` (769) - Search/filter
- `email-server.ts` (681) - Email campaigns
- `event-creation-server.ts` (468) - Event wizard
- `payments-server.ts` (554) - Payment processing
- `seating-actions.ts` (476) - Seat selection
- `qr-server.ts` (516) - QR generation/validation

### Core Utilities (10+ files)

| File | LOC | Status | Why Important |
|------|-----|--------|----------------|
| emailService.ts | 663 | **TEST** | Transactional emails, high usage |
| uploadUtils.ts | 651 | PARTIAL | File operations, S3 integration |
| cms.ts | 485 | NO TEST | CMS CRUD operations |
| pwa-utils.ts | 461 | NO TEST | Service worker, offline support |
| feature-flags.ts | 314 | NO TEST | Feature toggling |

### Security/Compliance (10+ files)

| File | LOC | Status | Impact |
|------|-----|--------|--------|
| gdpr-compliance.ts | 570 | NO TEST | Regulatory requirement |
| two-factor-auth.ts | 523 | NO TEST | Auth critical |
| security-fixes.ts | 526 | NO TEST | Security patches |
| auth-middleware.ts | 456 | NO TEST | Request validation |
| rate-limiter.ts | 410 | NO TEST | DDoS protection |

---

## Implementation Roadmap

### Phase 1: Quick Wins (Week 1-2)
**Target Coverage Gain:** 8-12%

```
Priority File | LOC | Tests | Hours
seating.ts        | 1011 | 40   | 8-10
affiliate.ts      | 902  | 35   | 7-9
events-server.ts  | 884  | 30   | 6-8
sponsored-ads.ts  | 852  | 32   | 6-8
```

**Expected Result:** ~3-4% coverage increase

### Phase 2: Core Features (Week 3-5)
**Target Coverage Gain:** 8-10%

```
email-marketing.ts | 816 | 28 | 5-7
revenue-actions.ts | 792 | 25 | 5-7
events.ts          | 769 | 28 | 6-8
ticketing.ts       | 723 | 30 | 6-8
```

**Expected Result:** ~3-4% coverage increase

### Phase 3: Infrastructure & Security (Week 6-8)
**Target Coverage Gain:** 6-8%

```
templates.ts       | 698 | 25 | 5-7
subscriptions.ts   | 693 | 28 | 5-7
emailService.ts    | 663 | 26 | 5-7
gdpr-compliance.ts | 570 | 28 | 5-7
```

**Expected Result:** ~3-4% coverage increase

### Phase 4: Remaining Critical (Week 9+)
- analytics.ts, checkin.ts, redis-config.ts
- More action files
- Utility functions

---

## Test Strategy by Category

### Database Queries (15 files)

**Pattern:** Each file exports 10-30 async functions accessing Supabase

```typescript
// Mock setup (in tests/setup.ts):
jest.mock('@/lib/auth/config', () => ({
  createClient: () => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ data: [...], error: null }),
    update: jest.fn().mockResolvedValue({ data: [...], error: null }),
    delete: jest.fn().mockResolvedValue({ data: null, error: null }),
  })
}))

// Test pattern for each function:
describe('getSeating()', () => {
  it('should fetch venue with filters', async () => {
    const result = await getVenues('user123')
    expect(result).toHaveLength(1)
    expect(result[0].created_by).toBe('user123')
  })
  
  it('should handle not found error', async () => {
    mockClient.eq.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
    const result = await getVenue('invalid')
    expect(result).toBeNull()
  })
})
```

### Server Actions (45 files)

**Pattern:** "use server" with async functions, Supabase + validation

```typescript
// Test pattern:
describe('searchEvents()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('should search with filters', async () => {
    const result = await searchEvents({
      search: 'concert',
      category: 'music',
      limit: 10
    })
    expect(result.events).toBeDefined()
  })
  
  it('should validate date range', async () => {
    await expect(searchEvents({
      start_date: '2026-02-10',
      end_date: '2026-02-01' // Invalid: end before start
    })).rejects.toThrow('Invalid date range')
  })
})
```

### Utilities (emailService, uploadUtils, etc.)

**Pattern:** Single responsibility, multiple methods

```typescript
describe('emailService', () => {
  beforeEach(() => {
    jest.mock('resend', () => ({
      emails: { send: jest.fn() }
    }))
  })
  
  it('should send verification email', async () => {
    const result = await emailService.sendVerificationEmail(
      'user@example.com',
      'token123'
    )
    expect(result.success).toBe(true)
  })
  
  it('should handle missing API key gracefully', async () => {
    // Mock missing key
    const result = await emailService.sendEmail(...)
    expect(result.mock).toBe(true)
  })
})
```

---

## Quick Reference: Exports by File

### seating.ts Exports (25+ functions)
- Venues: `getVenues()`, `getVenue()`, `createVenue()`, `updateVenue()`, `deleteVenue()`
- Layouts: `getSeatingLayouts()`, `createSeatingLayout()`, `updateLayout()`
- Seats: `getSeat()`, `reserveSeat()`, `releaseSeat()`, `getSeatReservations()`
- Pricing: `getSeatPricingTiers()`, `createPricingTier()`, `updatePricingTier()`
- Accessibility: `getAccessibilityRequests()`, `createAccessibilityRequest()`
- Groups: `getGroupSeating()`, `createGroupSeating()`
- Holds: `createSeatHold()`, `releaseSeatHold()`, `expireSeatHolds()`

### affiliate.ts Exports (30+ functions)
- Config: `getAffiliateProgramConfig()`
- Accounts: `getAffiliateAccount()`, `createAffiliateAccount()`, `updateAffiliateAccount()`, `approveAffiliateAccount()`, `suspendAffiliateAccount()`
- Stats: `getAffiliateStats()`, `getAffiliateLinks()`, `getAffiliateLink()`
- Tracking: `recordAffiliateClick()`, `getAffiliateClickByCookie()`
- Conversions: `recordAffiliateConversion()`, `getExpiredClicks()`
- Commissions: `getAffiliateCommissions()`, `createAffiliateCommission()`, `approveAffiliateCommission()`, `payAffiliateCommissions()`
- Payouts: `getAffiliatePayouts()`, `createAffiliatePayout()`, `updatePayoutStatus()`, `getPayoutsReadyForProcessing()`

---

## Dependencies to Mock

### Common Across All Files
```typescript
// @/lib/auth/config
createClient() // Returns Supabase client

// @/lib/logger
logger.info()
logger.error()
logger.warn()

// Environment variables
process.env.RESEND_API_KEY
process.env.STRIPE_API_KEY
process.env.AWS_REGION
```

### External Services
```typescript
// Resend (email)
new Resend(apiKey).emails.send()

// AWS S3
uploadToS3()

// Redis
redis.get(), redis.set()

// Stripe
stripe.charges.create()

// Supabase (main)
supabase.from('table').select()
```

---

## Common Test Fixtures

```typescript
// tests/fixtures/event.ts
export const mockEvent = {
  id: 'event_123',
  title: 'Test Event',
  start_date: '2026-03-15',
  end_date: '2026-03-16',
  capacity: 100,
  price: 29.99
}

// tests/fixtures/user.ts
export const mockUser = {
  id: 'user_123',
  email: 'test@example.com',
  name: 'Test User'
}

// tests/fixtures/affiliate.ts
export const mockAffiliateAccount = {
  id: 'aff_123',
  user_id: 'user_123',
  status: 'approved',
  commission_rate: 0.10
}
```

---

## Success Metrics

### Coverage Target
- **Phase 1 Complete:** 11.2% (3.2% + 8%)
- **Phase 2 Complete:** 19.2% (11.2% + 8%)
- **Phase 3 Complete:** 25.2% (19.2% + 6%)
- **Phase 4 Complete:** 50%+ (25.2% + 25%)

### Quality Metrics
- Minimum 80% branch coverage per file
- All error paths tested
- E2E tests for critical workflows
- Performance tests for query files (< 100ms expected)

---

## Files Not in Top 20 But Still Important

| File | LOC | Reason to Test |
|------|-----|----------------|
| supabase/queries.ts | 894 | Reusable query patterns |
| email-campaign-actions.ts | 9,501 | Email workflow critical |
| event-creation-server.ts | 468 | Complex form validation |
| checkin-actions.ts | 10,753 | On-site operations |
| payments-server.ts | 554 | Financial transactions |

---

## Next Steps

1. **Create test files** for Phase 1 files (4 files, ~12,549 LOC)
2. **Setup shared mocks** (Supabase, logger, external services)
3. **Write fixtures** (events, users, affiliates, orders)
4. **Run tests** and measure coverage improvement
5. **Document patterns** for team to follow
6. **Move to Phase 2** once Phase 1 reaches 80%+ coverage

---

**Last Updated:** February 9, 2026  
**Analysis Tool:** Automated code analysis  
**Confidence Level:** HIGH (based on file analysis and imports)
