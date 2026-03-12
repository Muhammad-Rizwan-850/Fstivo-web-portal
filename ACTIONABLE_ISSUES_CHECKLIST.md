# 🎯 ACTIONABLE ISSUES & FIXES CHECKLIST

**Last Updated:** January 28, 2026  
**Total Issues:** 20  
**Critical:** 0 | High: 3 | Medium: 8 | Low: 12

---

## 🔴 CRITICAL ISSUES (BLOCKING DEPLOYMENT)
**Count:** 0 ✅

---

## 🟠 HIGH PRIORITY ISSUES (FIX IMMEDIATELY)

### 1. SMS Type Mismatch Error ⚠️ **ACTIVE BUG**
**File:** `src/lib/notifications/sms.ts`  
**Line:** 130  
**Error Code:** TS2307 (Type not assignable)  
**Status:** FAILING

**Problem:**
```typescript
// Current code (line 130)
status: mapTwilioStatus(data.status || 'sent'),
// Error: Type '"sent" | "delivered" | "failed" | "queued" | "sending" | "undelivered"' 
// is not assignable to '"sent" | "delivered" | "failed" | "queued"'
```

**Root Cause:**  
Twilio returns additional status values (`sending`, `undelivered`) that aren't in the SMSStatus type definition.

**Solution:**

```typescript
// Step 1: Update SMSStatus type definition
// File: src/lib/types/notifications.ts (or wherever SMSStatus is defined)

export type SMSStatus = 'sent' | 'delivered' | 'failed' | 'queued' | 'sending' | 'undelivered';

// Step 2: Update mapTwilioStatus function
// File: src/lib/notifications/sms.ts (around line 100-115)

function mapTwilioStatus(twilioStatus: string): SMSStatus {
  const statusMap: Record<string, SMSStatus> = {
    'sent': 'sent',
    'sending': 'sending',      // NEW
    'delivered': 'delivered',
    'undelivered': 'undelivered',  // NEW
    'failed': 'failed',
    'queued': 'queued',
  };
  return statusMap[twilioStatus] || 'sent';
}
```

**Affected Code Flow:**
- Twilio SMS sending → Status tracking → Database → Analytics
- If not fixed: Status updates fail silently

**Time Estimate:** 15 minutes  
**Priority:** HIGH - SMS is critical notification channel

---

### 2. Missing Supabase Test Mocks ⚠️ **ACTIVE BUG**
**Files:** `tests/unit/cms.test.ts`, `tests/setup.ts`  
**Test Status:** FAILING (2/3 tests fail)  
**Error:** `TypeError: supabase.from(...).insert(...).select is not a function`

**Problem:**
Supabase client is not mocked in Jest. When tests run, they try to call real database methods that aren't available in Node.js environment.

**Solution:**

Create/Update `tests/setup.ts`:
```typescript
// tests/setup.ts
import '@testing-library/jest-dom';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: {}, error: null }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  })),
}));

// Also update jest.config.js
// Add to setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
```

**Then update the failing test file:**
```typescript
// tests/unit/cms.test.ts - Update createContent test
import { createClient } from '@supabase/supabase-js';

const mockInsert = jest.fn().mockReturnValue({
  select: jest.fn().mockResolvedValue({
    data: {
      id: '123',
      slug: 'test-page',
      title: 'Test Page',
      content: 'Test content',
      content_type: 'page',
      author_id: 'user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: [],
      status: 'published',
      metadata: {},
    },
    error: null,
  }),
});

jest.mocked(createClient).mockReturnValue({
  from: jest.fn().mockReturnValue({
    insert: mockInsert,
  }),
} as any);
```

**Time Estimate:** 1-2 hours  
**Priority:** HIGH - Tests must pass

---

### 3. Missing Environment Variables ⚠️ **CONFIG ISSUE**
**Files:** `.env.local`  
**Status:** Incomplete configuration  
**Impact:** Features won't work in production

**Problem:**
Multiple required environment variables are missing or set to placeholder values.

**Solution Checklist:**

```bash
# 1. SMS Service (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx        # Get from Twilio console
TWILIO_AUTH_TOKEN=your_actual_token           # Get from Twilio console
TWILIO_PHONE_NUMBER=+92XXXXXXXXX              # Your Twilio phone number

# 2. Payment Gateways (Pakistan)
JAZZCASH_MERCHANT_ID=your_merchant_id         # Get from JazzCash dashboard
JAZZCASH_PASSWORD=your_merchant_password      # Get from JazzCash dashboard
EASYPAISA_STORE_ID=your_store_id              # Get from Easypaisa dashboard
EASYPAISA_SECRET_KEY=your_secret_key          # Get from Easypaisa dashboard

# 3. Web Push Notifications (PWA)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key  # Generate with: web-push generate-vapid-keys
VAPID_PRIVATE_KEY=your_private_key            # Generate with: web-push generate-vapid-keys

# 4. Maps & Analytics
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token        # Get from mapbox.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX    # Get from Google Analytics
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/project  # Optional, for error tracking

# 5. Redis (for caching/queues)
REDIS_URL=redis://host:port
REDIS_TOKEN=your_redis_token

# 6. Security
CRON_SECRET=generate_random_secret             # Use: openssl rand -base64 32
```

**Step-by-step Setup:**

1. **Twilio Setup:**
   ```bash
   # Visit: https://www.twilio.com/console
   # Create account → Verify phone → Get credentials
   # Then update .env.local
   ```

2. **Payment Gateways (Pakistan):**
   - JazzCash: https://sandbox.jazzcash.com.pk/
   - Easypaisa: https://www.easypaisa.com.pk/

3. **Web Push (VAPID Keys):**
   ```bash
   npm install -g web-push
   web-push generate-vapid-keys
   # Copy public/private keys to .env.local
   ```

4. **Mapbox Token:**
   ```bash
   # Visit: https://account.mapbox.com/
   # Create token with appropriate scopes
   ```

5. **Google Analytics:**
   ```bash
   # Visit: https://analytics.google.com/
   # Create property → Get Measurement ID
   ```

6. **Redis (Optional but recommended):**
   ```bash
   # Use Upstash.com for serverless Redis
   # Or self-host Redis
   ```

**Validation Script:**
```bash
#!/bin/bash
# Verify all required env vars are set
required_vars=(
  "TWILIO_ACCOUNT_SID"
  "TWILIO_AUTH_TOKEN"
  "TWILIO_PHONE_NUMBER"
  "JAZZCASH_MERCHANT_ID"
  "EASYPAISA_STORE_ID"
  "VAPID_PRIVATE_KEY"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing: $var"
  else
    echo "✅ $var is set"
  fi
done
```

**Time Estimate:** 30 minutes - 2 hours (depending on account setup)  
**Priority:** HIGH - Blocking production

---

## 🟡 MEDIUM PRIORITY ISSUES (FIX WITHIN 1-2 WEEKS)

### 4. ESLint Warnings - Unused Imports/Variables
**Files:** 30+ components  
**Count:** 300+ warnings  
**Examples:** Unused Lucide icons, unused state setters, unused parameters

**Quick Fix (Auto-fix 70%):**
```bash
npm run lint -- --fix
```

**Manual Fixes (30%):**

**Pattern 1: Unused Icons**
```typescript
// ❌ Before - src/app/admin/page.tsx
import {
  Eye, CheckCircle, XCircle, Clock, AlertTriangle,
  Download, Search, Filter, MoreHorizontal,
  UserCheck, UserX, Crown, ChevronDown, ChevronUp
} from 'lucide-react';

// ✅ After
import { Eye, MoreHorizontal } from 'lucide-react'; // Only used ones
```

**Pattern 2: Unused State**
```typescript
// ❌ Before
const [editingItem, setEditingItem] = useState<any>(null);

// ✅ After (Option 1: Remove if unused)
// Delete the line

// ✅ After (Option 2: Prefix with underscore)
const [_editingItem, _setEditingItem] = useState<any>(null);
```

**Pattern 3: Unused Parameters**
```typescript
// ❌ Before
export default function Page({ params }: { params: string }) {
  // params never used
}

// ✅ After
export default function Page({ _params }: { _params: string }) {
  // or
export default function Page() {
```

**Affected Files (Top 10):**
1. `src/app/admin/page.tsx` - 20+ unused imports
2. `src/app/admin/showcase/page.tsx` - 15+ unused imports
3. `src/app/admin/showcase-manager/page.tsx` - 12+ unused imports
4. `src/app/(marketing)/blog/[slug]/page.tsx` - 2+ unused
5. `src/app/analytics/dashboard/page.tsx` - 3+ unused
6. `src/lib/notifications/service.ts` - 10+ unused parameters
7-10. ... other files

**Time Estimate:** 2-3 hours  
**Priority:** MEDIUM (code cleanliness)

---

### 5. Implicit `any` Types in Function Parameters
**Count:** 15-20 instances  
**Severity:** Type safety issue

**Files to Fix:**
- `src/lib/ab-testing.ts` - 5+ instances
- `src/lib/feature-flags.ts` - 2+ instances
- `src/lib/notifications/service.ts` - 8+ instances
- Test files - 5+ instances

**Example Fix:**

```typescript
// ❌ Before - src/lib/ab-testing.ts:65
.map((test) => ({ ...test }))

// ✅ After
.map((test: ABTest) => ({ ...test }))
```

```typescript
// ❌ Before - src/lib/ab-testing.ts:159-162
.reduce((sum, e) => sum + e.value, 0)

// ✅ After
.reduce((sum: number, e: ABTestResult) => sum + (e.value ?? 0), 0)
```

**Time Estimate:** 1-2 hours  
**Priority:** MEDIUM (type safety)

---

### 6. Low Test Coverage (3% → Target 60%)
**Current Status:** 2 tests pass, 1 failing  
**Effort Required:** 20-30 hours of test writing

**Priority Test Coverage (in order):**

**Phase 1: Fix Existing + Quick Wins (5-8 hours)**
1. ✅ Fix failing `cms.test.ts` - 1 hour
2. ✅ Add basic API route tests - 4 hours
   - `POST /api/auth/register` - user registration
   - `GET /api/dashboard/events` - event listing
   - `POST /api/events/create` - event creation

3. ✅ Add notification tests - 2 hours
   - Email sending
   - SMS sending
   - Push notifications

**Phase 2: Payment Integration (8-12 hours)**
1. Stripe payment flow
2. JazzCash integration
3. Easypaisa integration
4. Refund handling

**Phase 3: Authentication (5-8 hours)**
1. Social login (Google, Facebook)
2. 2FA verification
3. Password reset
4. Session management

**Example Test Structure:**
```typescript
// tests/unit/api/auth/register.test.ts
import { POST } from '@/app/api/auth/register/route';

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user', async () => {
    const request = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePass123!',
        fullName: 'Test User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user.email).toBe('test@example.com');
  });
});
```

**Time Estimate:** 20-30 hours total  
**Priority:** MEDIUM (risk mitigation)

---

### 7. Database Type Generation Out of Sync
**Files:** `src/lib/types/users.ts`, `src/lib/types/volunteers.ts`, `src/lib/types/gdpr.ts`  
**Issue:** Manual types don't match Supabase schema exactly

**Solution:**
```bash
# Step 1: Install Supabase CLI
npm install -g supabase

# Step 2: Login to Supabase
supabase login

# Step 3: Link project
supabase link --project-ref your-project-ref

# Step 4: Generate types
supabase gen types typescript --linked > types/supabase.ts

# Step 5: Update imports in code
// OLD: import { User } from '@/lib/types/users';
// NEW: import { User } from '@/types/supabase';
```

**Expected Outcome:**
- All type mismatches resolved
- 200+ TypeScript errors eliminated
- Type-safe database queries

**Time Estimate:** 1-2 hours  
**Priority:** MEDIUM (type safety)

---

### 8. React Hook Dependencies Missing
**Files:** 
- `src/app/admin/showcase/page.tsx` - Line 55
- `src/app/admin/showcase-manager/page.tsx` - Line 103

**Problem:**
```typescript
// ❌ Before
useEffect(() => {
  fetchData();
}, []); // Missing fetchData dependency!

// ✅ After
useEffect(() => {
  fetchData();
}, [fetchData]);
```

**Why It Matters:**
- Stale closures - using old function references
- Infinite loops - function gets recreated each render
- Missing updates - data might not refresh

**Fix:**
```typescript
// Solution: Memoize the function
const fetchData = useCallback(async () => {
  // ... fetch logic
}, [/* dependencies */]);

useEffect(() => {
  fetchData();
}, [fetchData]);

// OR: Move outside component if pure function
async function fetchDataStatic() { ... }
```

**Time Estimate:** 30 minutes  
**Priority:** MEDIUM (correctness)

---

## 🟢 LOW PRIORITY ISSUES (NICE TO FIX)

### 9-20. Low Priority Items

**9. Deprecated `next lint` Command**
- Action: `npx @next/codemod@canary next-lint-to-eslint-cli .`
- Time: 15 minutes

**10-14. Code Cleanup Issues** (Unused variables, console.logs, etc.)
- Remove unused state variables (5-8 instances)
- Replace `console.log` with structured logger (20-30 instances)
- Add `<Image>` optimization (15-20 instances)
- Time: 2-3 hours total

**15-20. Documentation & Type Improvements**
- Add JSDoc comments to complex functions
- Add type guards for `unknown` types
- Update API documentation
- Time: 3-5 hours

---

## 📋 QUICK REFERENCE: COMMANDS

### Immediate Fixes
```bash
# 1. Auto-fix linting issues
npm run lint -- --fix

# 2. Check TypeScript errors
npm run typecheck 2>&1 | head -50

# 3. Run tests
npm run test

# 4. Run specific test file
npm run test tests/unit/cms.test.ts
```

### Database & Types
```bash
# Generate types from Supabase
supabase gen types typescript --linked > types/supabase.ts

# Run database migrations
npm run db:migrate
```

### Validation
```bash
# Verify env vars
grep "TWILIO_ACCOUNT_SID\|JAZZCASH\|VAPID" .env.local

# Check bundle size
npm run analyze
```

---

## 🎯 IMPLEMENTATION TIMELINE

### Week 1 (Critical)
- [ ] Day 1: Configure missing environment variables (2 hours)
- [ ] Day 2: Fix SMS type mismatch (1 hour)
- [ ] Day 3: Fix Supabase test mocks (2 hours)
- [ ] Day 4-5: ESLint cleanup & auto-fix (3 hours)

### Week 2 (High Priority)
- [ ] Day 6-7: Implicit any types (2 hours)
- [ ] Day 8-10: Core API tests (8 hours)

### Week 3-4 (Medium Priority)
- [ ] Database type generation sync (1 hour)
- [ ] React hook dependencies fix (30 min)
- [ ] Payment integration tests (8 hours)
- [ ] Authentication tests (8 hours)

### Week 5+ (Low Priority)
- [ ] Code cleanup & documentation (5-10 hours)
- [ ] Additional test coverage (10+ hours)
- [ ] Performance optimization (5+ hours)

---

## ✅ SUCCESS CRITERIA

- [ ] All TypeScript compilation errors fixed (0 errors)
- [ ] All ESLint warnings below 50 (90%+ fixed)
- [ ] All tests passing (cms.test.ts, validators.test.ts + new tests)
- [ ] Test coverage ≥ 60%
- [ ] All environment variables configured
- [ ] Database types synchronized
- [ ] React hook dependencies correct
- [ ] Code ready for production deployment

---

**Generated:** January 28, 2026  
**Status:** Ready for implementation  
**Total Effort:** ~80-100 hours to completion
