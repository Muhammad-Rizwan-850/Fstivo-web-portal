# FSTIVO Platform - Prioritized Implementation & Fixes Plan

**Date Created**: February 3, 2026  
**Total Issues to Address**: 45+  
**Estimated Total Timeline**: 8-12 weeks (with full-time team)  
**Quick Wins Available**: 20+ (can complete in 2-3 days)

---

## 📊 PHASE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: CRITICAL FIXES (Week 1-2) ⚠️                          │
│ • Environment setup for production                              │
│ • Remove ESLint bypass                                          │
│ • Fix type safety issues                                        │
│ Effort: 40 hours | Blocker: Yes | Revenue Impact: High         │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: HIGH-PRIORITY FEATURES (Week 3-4) 🔥                  │
│ • Check-in system                                               │
│ • Payment webhook validation                                    │
│ • Organizer tools APIs                                          │
│ • Complete database queries                                     │
│ Effort: 60 hours | Blocker: Yes | Revenue Impact: High         │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: MEDIUM-PRIORITY FEATURES (Week 5-8) 📋                │
│ • Monetization features                                         │
│ • Email marketing system                                        │
│ • Analytics dashboards                                          │
│ • Social features                                               │
│ • Seating management                                            │
│ Effort: 120 hours | Blocker: No | Revenue Impact: Medium       │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: NICE-TO-HAVE (Week 9-12) ✨                            │
│ • Performance optimization                                      │
│ • CMS system                                                    │
│ • A/B testing                                                   │
│ • Advanced analytics                                            │
│ Effort: 80 hours | Blocker: No | Revenue Impact: Low           │
└─────────────────────────────────────────────────────────────────┘
```

---

# PHASE 1: CRITICAL FIXES (Week 1-2)

## 🎯 Goal
Get production-ready: Replace test credentials, fix linting, ensure type safety

## 1️⃣ CRITICAL FIX #1: Production Environment Setup

**Priority**: 🔴 CRITICAL  
**Effort**: 3-4 hours  
**Impact**: Enables all integrations  
**Blocker**: YES

### What Needs to Be Done
Replace all placeholder environment variables with production credentials from:
- Supabase
- Stripe
- JazzCash & EasyPaisa
- Resend, Twilio
- OpenAI, Mapbox
- Upstash Redis
- Push notification VAPID keys

### Step-by-Step Implementation

```bash
# 1. Create production .env.production file
cp .env.local .env.production

# 2. Update each credential:
# For each service, get real keys from:
# - Supabase: supabase.co > Settings > API
# - Stripe: dashboard.stripe.com > Developers > API Keys
# - JazzCash: jazzcash merchant portal
# - EasyPaisa: easypaisa store dashboard
# - etc.

# 3. Verify all keys are set (none should be "test" or "sk_test_")
grep -E "test|TEST|placeholder|xxx|XXXX" .env.production

# 4. Test Supabase connection
npx supabase status

# 5. Regenerate Supabase types from live database
npm run gen:supabase-types
```

### Files to Update
- `.env.production` (new file)
- `.env.example` (document all required keys)
- `src/types/supabase-generated.d.ts` (regenerate)

### Verification Checklist
- [ ] All credential placeholders replaced
- [ ] No "test" values remain
- [ ] `npm run typecheck` passes
- [ ] Supabase connection works: `npx supabase status`
- [ ] Email service test: `curl -X POST http://localhost:3000/api/emails/send-test`

---

## 2️⃣ CRITICAL FIX #2: Remove ESLint Build Bypass & Fix Linting

**Priority**: 🔴 CRITICAL  
**Effort**: 8-10 hours  
**Impact**: Enables proper code quality checks  
**Blocker**: YES (for production)

### What Needs to Be Done
Remove `eslint.ignoreDuringBuilds: true` and systematically fix ~200 linting errors

### Step-by-Step Implementation

#### Step 1: Identify All Linting Errors
```bash
npm run lint > lint-errors.txt 2>&1
# This will show all ~200 errors

# Group errors by type:
grep "@typescript-eslint/no-explicit-any" lint-errors.txt | wc -l
# Result: ~40 instances

grep "no-unused-vars" lint-errors.txt | wc -l
# Result: ~50 instances

grep "react-hooks" lint-errors.txt | wc -l
# Result: ~30 instances
```

#### Step 2: Fix `@typescript-eslint/no-explicit-any` (40 instances)

**Files Requiring Fixes:**
- `src/lib/supabase/server.ts` (2 instances)
- `src/lib/actions/tickets.ts` (4 instances)
- `src/lib/actions/payments-new.ts` (5 instances)
- `src/lib/actions/event-creation-server.ts` (4 instances)
- `src/lib/monetization/affiliate/*.ts` (8 instances)
- `src/lib/actions/social-actions.ts` (3 instances)
- `src/lib/actions/event-template-actions.ts` (5 instances)
- `src/lib/monetization/ads/budget.ts` (2 instances)

**Approach:**
```typescript
// ❌ BEFORE
const data = await supabase.from('orders').select().eq('id', id) as any;

// ✅ AFTER
interface Order {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  // ... other fields
}

const { data, error } = await supabase
  .from('orders')
  .select()
  .eq('id', id)
  .single() as { data: Order; error: any };
```

**Implementation Steps:**
1. Create TypeScript interface files for each entity:
   - `src/types/models/orders.ts`
   - `src/types/models/tickets.ts`
   - `src/types/models/registrations.ts`
   - etc.

2. Update each problematic file:
   - Import proper interface
   - Remove `as any` cast
   - Add proper type annotations

3. Test after each fix:
   ```bash
   npm run typecheck
   npm run lint src/lib/supabase/server.ts
   ```

#### Step 3: Fix Unused Variables (50 instances)

**Quick Wins:**
- Remove unused destructures: `const { unused } = obj; // Remove unused`
- Remove unused imports: `npm run lint -- --fix`
- Remove unused parameters: Add `@typescript-eslint/no-unused-vars` disable comment if intentional

```bash
# Auto-fix most issues
npm run lint -- --fix

# Review remaining manual fixes
npm run lint | grep "no-unused-vars"
```

#### Step 4: Fix React Hooks Dependencies (30 instances)

**Pattern:**
```typescript
// ❌ BEFORE: Missing dependency
useEffect(() => {
  console.log(value);
}, []); // value missing from deps

// ✅ AFTER: Correct dependencies
useEffect(() => {
  console.log(value);
}, [value]);

// OR if value shouldn't change
const value = useMemo(() => computeValue(), []);
useEffect(() => {
  console.log(value);
}, [value]);
```

**Files to Check:**
- `src/lib/realtime/hooks.tsx`
- `src/components/**/*.tsx` (all custom hooks)
- `src/app/**/*.tsx` (useEffect usage)

#### Step 5: Update next.config.js

```javascript
// ❌ REMOVE THIS:
eslint: {
  ignoreDuringBuilds: true,
},

// ✅ AFTER FIXES, BUILD WILL PASS WITH:
// No eslint config needed - default behavior
```

### Files to Update
- `next.config.js` (remove eslint bypass)
- `src/types/models/*.ts` (create ~15 new type files)
- `src/lib/**/*.ts` (40 files need `any` removal)
- `.eslintignore` (update if needed)

### Verification Checklist
- [ ] `npm run lint` shows 0 errors
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds
- [ ] All tests still pass: `npm test`
- [ ] No warnings in build output

---

## 3️⃣ CRITICAL FIX #3: Replace Console Statements with Logger

**Priority**: 🔴 CRITICAL  
**Effort**: 4-5 hours  
**Impact**: Security, performance, debugging  
**Blocker**: YES (for production)

### What Needs to Be Done
Replace 50+ `console.error/log/debug` statements with proper logger

### Step-by-Step Implementation

#### Step 1: Identify All Console Statements
```bash
grep -r "console\." src/app/api src/lib --include="*.ts" --include="*.tsx" | wc -l
# Result: 50+ instances

# Find by severity:
grep "console\.log\|console\.debug" src/ -r | wc -l      # Debug level
grep "console\.error\|console\.warn" src/ -r | wc -l     # Error level
```

#### Step 2: Update Each File

**Files to Update (50+ instances across):**
- `src/lib/notifications/sms.ts` (2 instances)
- `src/app/api/showcase/*.ts` (15 instances)
- `src/app/api/emails/*.ts` (12 instances)
- `src/middleware.ts` (2 instances)
- `src/app/api/notifications/verify/route.ts` (2 debug statements)
- Others in payment, admin, analytics routes

**Pattern:**
```typescript
// ❌ BEFORE
console.error('Error sending SMS:', error);

// ✅ AFTER
import { logger } from '@/lib/utils/logger';

logger.error('Error sending SMS', error, { phoneNumber });
```

**Special Case - Debug Verification Codes:**
```typescript
// ❌ BEFORE (security risk!)
src/app/api/notifications/verify/route.ts:73-74
console.log(`🔐 Verification code for ${channel}: ${code}`);
console.log(`📱 Contact: ${contactValue}`);

// ✅ AFTER (only in development)
if (process.env.NODE_ENV === 'development') {
  logger.debug('Verification code generated', { channel, contactValue });
  // Never log actual code!
}
```

#### Step 3: Verify Logger Configuration
```bash
# Logger exists and exports properly
cat src/lib/utils/logger.ts | head -50

# Test logger in development
npm run dev
# Make a request that triggers logging
curl http://localhost:3000/api/...
# Check terminal for formatted logs
```

### Files to Update
- All 50+ files with console statements (use multi_replace_string_in_file)
- `src/lib/utils/logger.ts` (verify configuration)

### Verification Checklist
- [ ] `grep -r "console\." src/ --include="*.ts"` returns 0 results (except node_modules)
- [ ] Logger is properly initialized in files
- [ ] Development mode still shows useful debug info
- [ ] Production logs are clean (no sensitive data)
- [ ] All tests pass

---

## 4️⃣ CRITICAL FIX #4: Fix Type Safety - Remove `as any` Casts

**Priority**: 🔴 CRITICAL (partially done)  
**Effort**: 6-8 hours  
**Impact**: Full type safety, catch errors at compile time  
**Blocker**: PARTIALLY (some already fixed, 35+ remain)

### What Needs to Be Done
Create proper TypeScript types for all database query results and remove all `as any` casts

### Step-by-Step Implementation

#### Step 1: Create Database Model Types

Create file: `src/types/models/index.ts`

```typescript
// src/types/models/index.ts

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category_id: string;
  start_date: string;
  end_date: string;
  location: string;
  max_attendees?: number;
  created_by: string;
  is_published: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  event_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  order_id: string;
  event_id: string;
  ticket_type_id: string;
  user_id: string;
  qr_code: string;
  checked_in: boolean;
  created_at: string;
}

export interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  ticket_id?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

// ... continue for all 20+ models
```

#### Step 2: Update Query Files with Proper Types

**File: `src/lib/supabase/server.ts`**
```typescript
// ❌ BEFORE
const createTableClient = (table: string) => {
  return (
    (supabase
      .from(table)
      .select('*') as any) // <-- Remove this
  );
};

// ✅ AFTER
import { User, Event, Order, Ticket, Registration } from '@/types/models';

type TableModels = {
  'profiles': User;
  'events': Event;
  'orders': Order;
  'tickets': Ticket;
  'registrations': Registration;
  // ... other tables
};

const createTableClient = <T extends keyof TableModels>(table: T) => {
  return supabase
    .from(table)
    .select('*') as ReturnType<typeof supabase.from<TableModels[T]>>;
};
```

#### Step 3: Fix Each Problematic File

**File: `src/lib/actions/tickets.ts`**
```typescript
// ❌ BEFORE (line 50)
.from('orders') as any

// ✅ AFTER
.from('orders')
// Type is automatically inferred from database schema
```

Apply same pattern to:
- `src/lib/actions/payments-new.ts` (5 instances)
- `src/lib/actions/event-creation-server.ts` (4 instances)
- `src/lib/monetization/affiliate/commission.ts` (3 instances)
- `src/lib/monetization/affiliate/payouts.ts` (2 instances)
- `src/lib/monetization/ads/budget.ts` (2 instances)
- `src/lib/actions/social-actions.ts` (3 instances)

### Files to Update
- `src/types/models/index.ts` (new file)
- 10+ action files
- `src/lib/supabase/server.ts`
- `src/lib/actions/event-template-actions.ts`

### Verification Checklist
- [ ] `npm run typecheck` shows 0 errors
- [ ] No remaining `as any` in src/ files
- [ ] All tests pass
- [ ] IDE autocomplete works properly
- [ ] Build succeeds

---

## PHASE 1 SUMMARY

| Task | Effort | Status |
|------|--------|--------|
| Production Environment Setup | 3-4h | Ready |
| ESLint Fix & Bypass Removal | 8-10h | Ready |
| Console → Logger Migration | 4-5h | Ready |
| Type Safety (`as any` removal) | 6-8h | Ready |
| **Phase 1 Total** | **~25-30h** | **Ready to Start** |

### Quick Wins in Phase 1
- ✅ Auto-fix unused variables: `npm run lint -- --fix`
- ✅ Generate Supabase types: `npm run gen:supabase-types`
- ✅ Copy env template: `cp .env.local .env.example`

### After Phase 1, You'll Have:
- ✅ Production-ready credentials
- ✅ Zero linting errors
- ✅ Full type safety
- ✅ Secure logging (no sensitive data exposed)
- ✅ Clean, maintainable codebase

---

# PHASE 2: HIGH-PRIORITY FEATURES (Week 3-4)

## 🎯 Goal
Enable core platform operations: check-ins, payments, and organizer tools

## 1️⃣ HIGH-PRIORITY FIX #1: Implement Check-in System

**Priority**: 🔥 HIGH  
**Effort**: 12-15 hours  
**Revenue Impact**: HIGH (enables event operations)  
**Blocker**: YES (core feature)

### What Needs to Be Done
- Implement QR code scanning endpoints
- Create check-in verification logic
- Add check-in statistics APIs
- Build check-in UI components

### Step-by-Step Implementation

#### Step 1: Create Check-in API Routes

**File: `src/app/api/checkin/scan/route.ts`** (New)
```typescript
// POST /api/checkin/scan
// Body: { qr_code: string, event_id: string }
// Returns: { success: boolean, attendee: { name, email }, message: string }

import { createClient } from '@supabase/ssr';
import { validateInput, checkinSchema } from '@/lib/validators';
import { logger } from '@/lib/utils/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateInput(checkinSchema, body);
    if (!validation.success) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const { qr_code, event_id } = validation.data;
    
    // Get ticket from QR code
    const supabase = createClient();
    const { data: ticket, error: ticketError } = await (supabase
      .from('tickets') as any)
      .select('id, user_id, checked_in, created_at')
      .eq('qr_code', qr_code)
      .eq('event_id', event_id)
      .single();

    if (ticketError) {
      logger.error('Check-in ticket lookup failed', ticketError);
      return Response.json({ error: 'Invalid QR code' }, { status: 404 });
    }

    if (ticket.checked_in) {
      return Response.json({ 
        error: 'Already checked in',
        checkedInAt: ticket.checked_in_at
      }, { status: 400 });
    }

    // Get attendee info
    const { data: attendee } = await (supabase
      .from('profiles') as any)
      .select('full_name, email')
      .eq('id', ticket.user_id)
      .single();

    // Mark as checked in
    const { error: updateError } = await (supabase
      .from('tickets') as any)
      .update({ 
        checked_in: true, 
        checked_in_at: new Date().toISOString() 
      })
      .eq('id', ticket.id);

    if (updateError) throw updateError;

    logger.info('Attendee checked in', { ticketId: ticket.id, eventId: event_id });

    return Response.json({
      success: true,
      attendee: {
        name: attendee?.full_name,
        email: attendee?.email,
      },
      message: `Welcome ${attendee?.full_name}!`,
    });
  } catch (error) {
    logger.error('Check-in error', error as Error);
    return Response.json({ error: 'Check-in failed' }, { status: 500 });
  }
}
```

**File: `src/app/api/checkin/stats/route.ts`** (New)
```typescript
// GET /api/checkin/stats?event_id=xxx
// Returns: { total_attendees, checked_in, pending, check_in_rate }

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return Response.json({ error: 'Missing event_id' }, { status: 400 });
    }

    const supabase = createClient();

    // Get all tickets for event
    const { data: allTickets } = await (supabase
      .from('tickets') as any)
      .select('id, checked_in')
      .eq('event_id', eventId);

    const total = allTickets?.length || 0;
    const checkedIn = allTickets?.filter(t => t.checked_in).length || 0;
    const pending = total - checkedIn;
    const checkInRate = total > 0 ? ((checkedIn / total) * 100).toFixed(2) : 0;

    return Response.json({
      total_attendees: total,
      checked_in: checkedIn,
      pending,
      check_in_rate: `${checkInRate}%`,
    });
  } catch (error) {
    logger.error('Check-in stats error', error as Error);
    return Response.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
```

#### Step 2: Add Check-in Validation Schema

**File: `src/lib/validators/index.ts`** (Add to existing file)
```typescript
export const checkinSchema = z.object({
  qr_code: z.string().min(1, 'QR code is required'),
  event_id: z.string().uuid('Invalid event ID'),
});

export type CheckinInput = z.infer<typeof checkinSchema>;
```

#### Step 3: Create QR Scanner Component

**File: `src/components/checkin/qr-scanner.tsx`** (New)
```typescript
'use client';

import { useState, useRef } from 'react';
import QrReader from 'react-qr-reader';
import { toast } from 'sonner';

interface QRScannerProps {
  eventId: string;
  onScanSuccess: (data: any) => void;
}

export function QRScanner({ eventId, onScanSuccess }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(true);

  const handleScan = async (qrCode: string | null) => {
    if (!qrCode) return;

    setIsScanning(false);

    try {
      const response = await fetch('/api/checkin/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code: qrCode, event_id: eventId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`✅ ${data.message}`);
        onScanSuccess(data.attendee);
      } else {
        toast.error(data.error || 'Check-in failed');
      }
    } catch (error) {
      toast.error('Error checking in');
    } finally {
      setIsScanning(true);
    }
  };

  return (
    <div>
      {isScanning && (
        <QrReader
          onResult={(result) => {
            if (result?.text) {
              handleScan(result.text);
            }
          }}
          constraints={{ facingMode: 'environment' }}
        />
      )}
    </div>
  );
}
```

#### Step 4: Create Check-in Page

**File: `src/app/checkin/[eventId]/page.tsx`** (New)
```typescript
'use client';

import { useState } from 'react';
import { QRScanner } from '@/components/checkin/qr-scanner';
import { CheckinStats } from '@/components/checkin/checkin-stats';

export default function CheckinPage({ params }: { params: { eventId: string } }) {
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Event Check-in</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QRScanner 
            eventId={params.eventId}
            onScanSuccess={(attendee) => {
              setRecentCheckIns([attendee, ...recentCheckIns]);
            }}
          />
        </div>
        
        <div>
          <CheckinStats eventId={params.eventId} />
        </div>
      </div>

      {/* Recent Check-ins List */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="font-bold mb-4">Recent Check-ins</h2>
        <div className="space-y-2">
          {recentCheckIns.map((attendee, i) => (
            <div key={i} className="flex justify-between p-2 bg-gray-50 rounded">
              <span>{attendee.name}</span>
              <span className="text-green-600">✓</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Files to Create
- `src/app/api/checkin/scan/route.ts`
- `src/app/api/checkin/stats/route.ts`
- `src/components/checkin/qr-scanner.tsx`
- `src/components/checkin/checkin-stats.tsx`
- `src/app/checkin/[eventId]/page.tsx`

### Database Requirements
Ensure `tickets` table has:
```sql
ALTER TABLE tickets ADD COLUMN checked_in BOOLEAN DEFAULT FALSE;
ALTER TABLE tickets ADD COLUMN checked_in_at TIMESTAMPTZ;
CREATE INDEX idx_tickets_qr ON tickets(qr_code);
CREATE INDEX idx_tickets_event ON tickets(event_id);
```

### Verification Checklist
- [ ] QR codes generated for all tickets
- [ ] Scan endpoint tested: `curl -X POST http://localhost:3000/api/checkin/scan -H "Content-Type: application/json" -d '{"qr_code":"...","event_id":"..."}'`
- [ ] Check-in statistics update in real-time
- [ ] UI component renders properly
- [ ] Tests written for check-in logic

---

## 2️⃣ HIGH-PRIORITY FIX #2: Complete Payment Webhook Validation

**Priority**: 🔥 HIGH  
**Effort**: 10-12 hours  
**Revenue Impact**: CRITICAL (payment integrity)  
**Blocker**: YES

### What Needs to Be Done
- Implement webhook signature verification for Stripe
- Fix JazzCash/EasyPaisa callback validation
- Add amount validation and tampering detection
- Create webhook retry mechanism

### Step-by-Step Implementation

#### Step 1: Fix Stripe Webhook Validation

**File: `src/app/api/payments/webhook/route.ts`** (Update existing)
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20',
});

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  // Verify webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    logger.error('Webhook signature verification failed', error as Error);
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Handle different event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    case 'charge.refunded':
      await handleRefund(event.data.object as Stripe.Charge);
      break;
  }

  return Response.json({ received: true });
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  // Validate amount matches order
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single();

  if (!order) {
    logger.error('Order not found for payment intent', {
      paymentIntentId: paymentIntent.id,
    });
    return;
  }

  // Verify amount matches (within 1% tolerance)
  const tolerance = order.amount * 0.01; // 1%
  if (Math.abs(paymentIntent.amount_received - order.amount * 100) > tolerance) {
    logger.error('Payment amount mismatch', {
      orderId: order.id,
      expected: order.amount,
      received: paymentIntent.amount_received / 100,
    });
    return; // Don't process - potential tampering
  }

  // Update order status
  await supabase
    .from('orders')
    .update({ status: 'completed' })
    .eq('id', order.id);

  logger.info('Payment processed', { orderId: order.id });
}
```

#### Step 2: Implement JazzCash Webhook Validation

**File: `src/app/api/payments/jazzcash/callback/route.ts`** (Update existing)
```typescript
import { validateJazzCashSignature } from '@/lib/security/webhook-verification';

export async function POST(request: Request) {
  const body = await request.json();

  // Validate JazzCash signature
  const isValid = validateJazzCashSignature(
    body,
    request.headers.get('x-jazzcash-signature') || ''
  );

  if (!isValid) {
    logger.error('JazzCash signature verification failed', { body });
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Extract payment data
  const { pp_Amount, pp_TransactionID, pp_ResponseCode, pp_MerchantReference } =
    body;

  // Find order
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('jazzcash_reference', pp_MerchantReference)
    .single();

  if (!order) {
    logger.error('Order not found', { reference: pp_MerchantReference });
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  // Verify amount
  if (Number(pp_Amount) !== order.amount) {
    logger.error('Amount mismatch', {
      orderId: order.id,
      expected: order.amount,
      received: pp_Amount,
    });
    return Response.json({ error: 'Amount mismatch' }, { status: 400 });
  }

  // Process based on response code
  if (pp_ResponseCode === '000000') {
    // Success
    await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        jazzcash_transaction_id: pp_TransactionID,
      })
      .eq('id', order.id);

    logger.info('JazzCash payment processed', { orderId: order.id });
  } else {
    // Failed
    await supabase
      .from('orders')
      .update({ 
        status: 'failed',
        error_message: pp_ResponseCode,
      })
      .eq('id', order.id);
  }

  return Response.json({ success: true });
}
```

#### Step 3: Add Amount Validation Utility

**File: `src/lib/security/webhook-verification.ts`** (New)
```typescript
import crypto from 'crypto';

export function validatePaymentAmount(
  expectedAmount: number,
  receivedAmount: number,
  tolerancePercent: number = 1
): { valid: boolean; message?: string } {
  const tolerance = expectedAmount * (tolerancePercent / 100);
  const difference = Math.abs(receivedAmount - expectedAmount);

  if (difference > tolerance) {
    return {
      valid: false,
      message: `Amount mismatch: expected ${expectedAmount}, received ${receivedAmount}`,
    };
  }

  return { valid: true };
}

export function validateJazzCashSignature(
  payload: Record<string, any>,
  signature: string
): boolean {
  const password = process.env.JAZZCASH_PASSWORD!;
  
  // Reconstruct the signature per JazzCash spec
  const signaturePayload = [
    payload.pp_Amount,
    payload.pp_BillingEmail,
    payload.pp_BillingMobileNumber,
    payload.pp_Language,
    payload.pp_MerchantID,
    payload.pp_Password,
    payload.pp_ReturnURL,
    payload.pp_TxnRefNo,
  ].join('&');

  const hash = crypto
    .createHash('sha256')
    .update(signaturePayload)
    .digest('hex');

  return hash === signature;
}

export function validateEasyPaisaSignature(
  payload: Record<string, any>,
  signature: string
): boolean {
  const secret = process.env.EASYPAISA_SECRET_KEY!;
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(hash, signature);
}
```

#### Step 4: Implement Webhook Retry Mechanism

**File: `src/lib/webhooks/retry-handler.ts`** (New)
```typescript
import { supabase } from '@/lib/supabase/client';

interface WebhookLog {
  id?: string;
  event_type: string;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retry_count: number;
  next_retry_at?: string;
  error_message?: string;
}

export async function logWebhook(log: WebhookLog) {
  await (supabase.from('webhook_logs') as any).insert(log);
}

export async function retryFailedWebhooks() {
  // Find webhooks that failed and are ready for retry
  const { data: failedWebhooks } = await (supabase
    .from('webhook_logs') as any)
    .select('*')
    .eq('status', 'failed')
    .lt('next_retry_at', new Date().toISOString())
    .lt('retry_count', 5); // Max 5 retries

  for (const webhook of failedWebhooks || []) {
    try {
      // Re-process the webhook
      await processWebhook(webhook.event_type, webhook.payload);

      // Mark as completed
      await (supabase.from('webhook_logs') as any)
        .update({ status: 'completed' })
        .eq('id', webhook.id);
    } catch (error) {
      // Schedule next retry (exponential backoff)
      const nextRetry = new Date();
      nextRetry.setMinutes(nextRetry.getMinutes() + 5 * Math.pow(2, webhook.retry_count));

      await (supabase.from('webhook_logs') as any)
        .update({
          retry_count: webhook.retry_count + 1,
          next_retry_at: nextRetry.toISOString(),
          error_message: (error as Error).message,
        })
        .eq('id', webhook.id);
    }
  }
}
```

### Files to Update/Create
- `src/app/api/payments/webhook/route.ts` (update)
- `src/app/api/payments/jazzcash/callback/route.ts` (update)
- `src/app/api/payments/easypaisa/callback/route.ts` (update)
- `src/lib/security/webhook-verification.ts` (new)
- `src/lib/webhooks/retry-handler.ts` (new)

### Database Requirements
Ensure tables have:
```sql
-- Orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS jazzcash_reference TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS jazzcash_transaction_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Webhook logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL,
  retry_count INT DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Verification Checklist
- [ ] Stripe webhook tests pass
- [ ] JazzCash signature validation working
- [ ] Amount validation catches tampering
- [ ] Webhook logs recorded
- [ ] Retry mechanism tested
- [ ] Failed payments handled correctly

---

## 3️⃣ HIGH-PRIORITY FIX #3: Complete Organizer Tools APIs

**Priority**: 🔥 HIGH  
**Effort**: 8-10 hours  
**Revenue Impact**: HIGH (enables organizer features)  
**Blocker**: MEDIUM

### What Needs to Be Done
- Complete event analytics API
- Implement bulk email API
- Add attendee export API
- Create report generation API

### Step-by-Step Implementation

#### Step 1: Complete Event Analytics API

**File: `src/app/api/organizer/analytics/route.ts`** (Update/Create)
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  const period = searchParams.get('period') || '7days'; // 7days, 30days, all

  // Get user (organizer)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify organizer owns event
  const { data: event } = await (supabase.from('events') as any)
    .select('*')
    .eq('id', eventId)
    .eq('created_by', user.id)
    .single();

  if (!event) {
    return Response.json({ error: 'Event not found' }, { status: 404 });
  }

  // Get analytics data
  const { data: registrations } = await (supabase
    .from('registrations') as any)
    .select('*')
    .eq('event_id', eventId);

  const { data: orders } = await (supabase.from('orders') as any)
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'completed');

  const totalRevenue = orders?.reduce((sum, o) => sum + o.amount, 0) || 0;
  const totalAttendees = registrations?.length || 0;
  const confirmedAttendees = registrations?.filter(
    (r) => r.status === 'confirmed'
  ).length || 0;

  return Response.json({
    event_title: event.title,
    total_registrations: totalAttendees,
    confirmed_attendees: confirmedAttendees,
    pending: totalAttendees - confirmedAttendees,
    total_revenue: totalRevenue,
    average_ticket_price: totalAttendees > 0 ? totalRevenue / totalAttendees : 0,
    attendance_rate: `${((confirmedAttendees / totalAttendees) * 100).toFixed(2)}%`,
    registrations_by_date: aggregateByDate(registrations),
    revenue_by_date: aggregateRevenueByDate(orders),
  });
}

function aggregateByDate(registrations: any[]) {
  // Group registrations by date
  const grouped: Record<string, number> = {};
  registrations?.forEach((reg) => {
    const date = new Date(reg.created_at).toISOString().split('T')[0];
    grouped[date] = (grouped[date] || 0) + 1;
  });
  return grouped;
}

function aggregateRevenueByDate(orders: any[]) {
  const grouped: Record<string, number> = {};
  orders?.forEach((order) => {
    const date = new Date(order.created_at).toISOString().split('T')[0];
    grouped[date] = (grouped[date] || 0) + order.amount;
  });
  return grouped;
}
```

#### Step 2: Implement Bulk Email API

**File: `src/app/api/organizer/bulk-email/route.ts`** (New)
```typescript
export async function POST(request: Request) {
  const body = await request.json();
  const { event_id, audience_filter, template_id, subject, message } = body;

  // Get organizer
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Verify ownership and get registrations
  const { data: registrations } = await (supabase
    .from('registrations') as any)
    .select('user_id')
    .eq('event_id', event_id)
    .eq('status', audience_filter || 'confirmed');

  if (!registrations || registrations.length === 0) {
    return Response.json({ error: 'No recipients found' }, { status: 400 });
  }

  // Get email addresses
  const userIds = registrations.map((r) => r.user_id);
  const { data: profiles } = await (supabase.from('profiles') as any)
    .select('email')
    .in('id', userIds);

  // Send emails in batch (using Resend or similar)
  const emailPromises = profiles?.map((profile) =>
    fetch('/api/emails/send', {
      method: 'POST',
      body: JSON.stringify({
        to: profile.email,
        subject,
        html: message,
      }),
    })
  );

  await Promise.all(emailPromises || []);

  logger.info('Bulk email sent', { eventId: event_id, count: profiles?.length });

  return Response.json({
    success: true,
    recipients_count: profiles?.length,
  });
}
```

#### Step 3: Implement Attendee Export API

**File: `src/app/api/organizer/export-attendees/route.ts`** (New)
```typescript
import { parse } from 'json2csv';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  const format = searchParams.get('format') || 'csv'; // csv or json

  // Get registrations with attendee details
  const { data: registrations } = await (supabase
    .from('registrations') as any)
    .select(`
      *,
      profiles:user_id(full_name, email, phone)
    `)
    .eq('event_id', eventId);

  if (format === 'json') {
    return Response.json(registrations);
  }

  // Convert to CSV
  const csv = parse(registrations);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="attendees-${eventId}.csv"`,
    },
  });
}
```

#### Step 4: Create Report Generation API

**File: `src/app/api/organizer/reports/route.ts`** (New)
```typescript
export async function POST(request: Request) {
  const body = await request.json();
  const { event_id, report_type, format = 'pdf' } = body;

  const { data: { user } } = await supabase.auth.getUser();

  // Get event data
  const { data: event } = await (supabase.from('events') as any)
    .select('*')
    .eq('id', event_id)
    .eq('created_by', user.id)
    .single();

  // Generate report content
  let reportContent = '';

  if (report_type === 'attendance') {
    const { data: registrations } = await (supabase
      .from('registrations') as any)
      .select('*')
      .eq('event_id', event_id);

    reportContent = generateAttendanceReport(event, registrations);
  } else if (report_type === 'revenue') {
    const { data: orders } = await (supabase.from('orders') as any)
      .select('*')
      .eq('event_id', event_id);

    reportContent = generateRevenueReport(event, orders);
  } else if (report_type === 'comprehensive') {
    reportContent = await generateComprehensiveReport(event_id);
  }

  // Return as PDF or HTML
  if (format === 'pdf') {
    // Use puppeteer or similar to generate PDF
    const pdf = await generatePDF(reportContent);
    return new Response(pdf, {
      headers: { 'Content-Type': 'application/pdf' },
    });
  }

  return Response.json({ html: reportContent });
}

function generateAttendanceReport(event: any, registrations: any[]): string {
  return `
    <h1>Attendance Report - ${event.title}</h1>
    <p>Event Date: ${event.start_date}</p>
    <p>Total Registrations: ${registrations.length}</p>
    <p>Confirmed: ${registrations.filter(r => r.status === 'confirmed').length}</p>
    <p>Pending: ${registrations.filter(r => r.status === 'pending').length}</p>
    <p>Cancelled: ${registrations.filter(r => r.status === 'cancelled').length}</p>
  `;
}

function generateRevenueReport(event: any, orders: any[]): string {
  const total = orders.reduce((sum, o) => sum + o.amount, 0);
  return `
    <h1>Revenue Report - ${event.title}</h1>
    <p>Total Revenue: $${total}</p>
    <p>Transactions: ${orders.length}</p>
    <p>Average per Transaction: $${(total / orders.length).toFixed(2)}</p>
  `;
}

async function generateComprehensiveReport(eventId: string): Promise<string> {
  // Combine all data
  return `<h1>Comprehensive Event Report</h1>`;
}
```

### Files to Create/Update
- `src/app/api/organizer/analytics/route.ts` (update/create)
- `src/app/api/organizer/bulk-email/route.ts` (new)
- `src/app/api/organizer/export-attendees/route.ts` (new)
- `src/app/api/organizer/reports/route.ts` (new)

### Verification Checklist
- [ ] Analytics endpoint returns correct data
- [ ] Bulk email API sends to all recipients
- [ ] Export generates valid CSV/JSON
- [ ] Reports generate correctly
- [ ] All endpoints require authentication

---

## PHASE 2 SUMMARY

| Task | Effort | Status |
|------|--------|--------|
| Check-in System | 12-15h | Ready |
| Payment Webhook Validation | 10-12h | Ready |
| Organizer Tools APIs | 8-10h | Ready |
| **Phase 2 Total** | **~35-40h** | **Ready to Start** |

### After Phase 2, You'll Have:
- ✅ Full check-in system with QR codes
- ✅ Secure payment processing with validation
- ✅ Complete organizer dashboard data
- ✅ Bulk operations support
- ✅ Comprehensive event reporting

---

# PHASE 3: MEDIUM-PRIORITY FEATURES (Week 5-8)

## Overview
This phase implements revenue-generating and engagement features:

### 1. Monetization Features (16-20 hours)
- ✅ Affiliate system (commission calculations exist, need dashboard)
- ✅ Sponsored ads (budget system exists, need advertiser dashboard)
- 🔄 Subscription system (incomplete)

**Step 1**: Create affiliate dashboard UI showing:
- Commission balance
- Active links
- Click/conversion tracking
- Payout history

**Step 2**: Create advertiser dashboard showing:
- Campaign performance
- Budget usage
- ROI calculations
- A/B test results

**Step 3**: Implement subscription tiers:
- Basic ($9/mo)
- Pro ($29/mo)
- Enterprise ($99/mo)

### 2. Email Marketing System (12-15 hours)
- Campaign CRUD endpoints
- Email template management
- Audience segmentation
- Delivery scheduling
- Performance analytics

### 3. Social Features (14-18 hours)
- User connections/following
- Feed/timeline
- Posts and comments
- Direct messaging
- Notifications

### 4. Seating Management (10-12 hours)
- Seat selection UI
- Venue layout editor
- Seat assignment logic
- Reserved sections

### 5. Analytics Enhancement (8-10 hours)
- Event analytics dashboard
- Revenue tracking
- User engagement metrics
- Platform-wide analytics

---

# PHASE 4: NICE-TO-HAVE (Week 9-12)

## 1. Performance Optimization (12-16 hours)
- Database query optimization
- Redis caching implementation
- Image optimization
- Code splitting

## 2. CMS System (10-12 hours)
- Page management
- Content editor
- Menu builder
- SEO optimization

## 3. A/B Testing Integration (8-10 hours)
- Test creation UI
- Variant assignment
- Results dashboard
- Statistical analysis

## 4. Advanced Analytics (12-16 hours)
- User behavior tracking
- Funnel analysis
- Cohort analysis
- Custom reports

---

# IMPLEMENTATION GUIDANCE

## Quick Start Command

```bash
# Phase 1 - Start with critical fixes
npm run lint                          # See all linting errors (200+)
npm run lint -- --fix                 # Auto-fix what you can
npm run gen:supabase-types            # Regenerate types
npm run typecheck                     # Verify types
npm test                              # Run all tests
npm run build                         # Test production build
```

## Testing Each Phase

```bash
# After Phase 1
npm run lint                          # Should show 0 errors
npm run typecheck                     # Should show 0 errors
npm run build                         # Should succeed
npm test                              # Should pass

# After Phase 2
curl http://localhost:3000/api/checkin/scan           # Test check-in
curl http://localhost:3000/api/payments/webhook        # Test webhook
curl http://localhost:3000/api/organizer/analytics     # Test analytics

# After Phase 3
npm test                              # Test coverage should increase
npm run build                         # Build should still succeed
```

## Deployment Checklist

```
BEFORE DEPLOYING TO PRODUCTION:

Phase 1 Complete?
- [ ] All env variables set to real values
- [ ] No linting errors (npm run lint returns 0)
- [ ] All types correct (npm run typecheck returns 0)
- [ ] No console statements in production code
- [ ] All tests pass (npm test)
- [ ] Build succeeds (npm run build)
- [ ] No warnings in build output

Phase 2 Complete?
- [ ] Check-in system tested with real QR codes
- [ ] Payment webhooks verified
- [ ] Organizer APIs returning correct data
- [ ] Integration tests pass
- [ ] Load testing done (if high traffic expected)

Phase 3 Complete?
- [ ] Monetization features tested
- [ ] Email templates in database
- [ ] Social features working
- [ ] Seating system functional
- [ ] Analytics dashboards loading

Ready to Deploy?
- [ ] All automated tests pass
- [ ] Manual testing complete
- [ ] Database backups created
- [ ] Monitoring/alerting set up
- [ ] Error tracking enabled (Sentry/similar)
- [ ] Performance baseline measured
```

---

# DEPENDENCIES & SEQUENCING

## Hard Blockers (Must complete Phase 1 before anything else)
- ❌ Can't deploy without real credentials
- ❌ Can't enable CI/CD with ESLint bypass
- ❌ Can't maintain with type safety issues

## Phase Dependencies
```
Phase 1 (Complete) ✅
    ↓
Phase 2 (High Priority) 🔥
    ├→ Check-in System (independent)
    ├→ Payment Webhooks (independent)
    └→ Organizer Tools (independent)
    ↓
Phase 3 (Medium Priority)
    ├→ Monetization (uses affiliate system)
    ├→ Email Marketing (uses email infrastructure)
    ├→ Social Features (independent)
    ├→ Seating (independent)
    └→ Analytics (uses data from other phases)
    ↓
Phase 4 (Nice-to-Have)
    └→ All independent, can do in any order
```

## Parallelization Opportunities
- Phase 2 tasks can be done in parallel (check-in, webhooks, organizer tools)
- Phase 3 tasks can be split among team members
- Phase 4 tasks can be distributed

---

# ESTIMATED TIMELINE

**Solo Developer**:
- Phase 1: 1-2 weeks
- Phase 2: 2-3 weeks
- Phase 3: 4-6 weeks
- Phase 4: 3-4 weeks
- **Total: 10-15 weeks**

**Small Team (3 developers)**:
- Phase 1: 3-5 days (1 person)
- Phase 2: 1-2 weeks (2-3 people in parallel)
- Phase 3: 1-2 weeks (3 people in parallel)
- Phase 4: 1-2 weeks (3 people in parallel)
- **Total: 4-8 weeks**

---

# RESOURCE ALLOCATION

## Recommended Team Structure for Parallel Execution

**Developer 1 (Full-Stack)**
- Phase 1: All critical fixes
- Phase 2: Check-in system
- Phase 3: Analytics

**Developer 2 (Backend/Payments)**
- Phase 2: Payment webhooks
- Phase 3: Monetization features

**Developer 3 (Frontend)**
- Phase 2: Organizer tools UI
- Phase 3: Social features UI, seating UI

---

# SUCCESS METRICS

## Phase 1 Completion
```
✅ npm run lint returns 0 errors
✅ npm run typecheck returns 0 errors
✅ npm run build succeeds
✅ npm test: 292+ tests passing
✅ All integrations functional
✅ No placeholder credentials
```

## Phase 2 Completion
```
✅ Check-in endpoints working (tested with real QR)
✅ Payment webhooks validated (test transactions pass)
✅ Organizer dashboard showing correct data
✅ At least 50% test coverage
✅ 0 production errors in 48-hour test
```

## Phase 3 Completion
```
✅ Monetization generating revenue
✅ Email campaigns sending successfully
✅ Social features at 70%+ feature complete
✅ Seating system supporting events
✅ 70%+ test coverage
```

## Phase 4 Completion
```
✅ Page load times < 2s
✅ Core metrics stored in analytics
✅ CMS pages manageable
✅ 85%+ test coverage
```

---

# NEXT STEPS

1. **Immediately**: Review this plan with your team
2. **This week**: Complete Phase 1 (critical fixes)
3. **Next week**: Start Phase 2 (assign to multiple developers)
4. **Week 3**: Complete Phase 2, start Phase 3
5. **Week 5-8**: Complete Phase 3
6. **Week 9-12**: Complete Phase 4 and optimize

---

**Questions or Need Clarification?** This plan is flexible - adjust based on:
- Team size and availability
- Business priorities
- Customer feedback
- Performance metrics

Good luck with the implementation! 🚀
