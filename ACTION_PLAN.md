# 🎯 FESTIVO - PRIORITIZED ACTION PLAN

**Document Type:** Executive Action Plan  
**Total Issues:** 2,248+ TypeScript Errors  
**Critical Blockers:** 5 categories  
**Estimated Resolution Time:** 40-60 hours  
**Target Completion:** 14 days with dedicated developer

---

## 🚨 PHASE 1: CRITICAL BLOCKERS (Days 1-3)

These MUST be fixed before the project can compile and deploy.

### Day 1: Unused Imports & Body Variables

**Task 1.1: Auto-fix Unused Imports** (3-4 hours)
```bash
# Run ESLint auto-fix
npm run lint -- --fix src/

# This will:
# - Remove unused imports automatically
# - Prefix unused parameters with underscore
# - Clean up unused variables
```

**Files Affected:** ~30 component files  
**Expected Result:** 1,380 → 50 errors

**Task 1.2: Fix Missing `body` Variables** (2 hours)

Search for pattern in all API routes:
```bash
grep -r "const { .* } = body" src/app/api/
```

Template fix for each file:
```typescript
// BEFORE
export async function POST(request: Request) {
  const { email, password } = body; // ❌ Error
}

// AFTER
export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;
}
```

**Files to Fix:** 12 API routes
- src/app/api/auth/forgot-password/route.ts
- src/app/api/auth/login/route.ts
- src/app/api/auth/register/route.ts
- src/app/api/auth/resend-verification/route.ts
- src/app/api/auth/reset-password/route.ts
- src/app/api/auth/verify-email/route.ts
- src/app/api/dashboard/events/route.ts
- src/app/api/emails/send/route.ts
- src/app/api/emails/campaign/send/route.ts
- src/app/api/notifications/send/route.ts
- src/app/api/payments/create-intent/route.ts
- src/app/api/analytics/track/route.ts

**Expected Result:** 95 → 0 errors

**Day 1 Summary:**
- Unused imports: FIXED
- Missing body variables: FIXED
- Expected errors remaining: 700+

---

### Day 2: Type Mismatches (Core Types)

**Task 2.1: Fix Interface Extension Conflicts** (3-4 hours)

**Issue 1: `src/lib/types/users.ts`**
```typescript
// BEFORE (Line 5)
interface UserProfile extends User {
  preferences: UserProfilePreferences; // Incompatible - missing properties
}

// AFTER
interface UserProfile extends User {
  preferences: UserProfilePreferences & {
    currency?: string;
    notifications?: NotificationSettings;
    privacy?: PrivacySettings;
    appearance?: AppearanceSettings;
  };
}
```

**Issue 2: `src/lib/types/volunteers.ts`**
```typescript
// BEFORE (Line 3)
interface Volunteer extends User {
  preferences: VolunteerPreferences; // Incompatible
}

// AFTER - Option 1: Full override
interface Volunteer {
  id: string;
  userId: string;
  certifications: Certification[];
  preferences: VolunteerPreferences & UserPreferences;
  // ... other fields
}

// OR Option 2: Extend properly
interface VolunteerPreferences extends UserPreferences {
  // volunteer-specific preferences
}
```

**Issue 3: `src/lib/types/gdpr.ts`**
```typescript
// BEFORE (Line 1400)
type: 'external' | 'internal';
// ... later in interface
type: 'controller' | 'processor' | 'subprocessor';

// AFTER - Use different property names
type: 'external' | 'internal';
entityType: 'controller' | 'processor' | 'subprocessor';
```

**Expected Result:** 8 → 0 errors

**Task 2.2: Fix Email Type Mismatches** (2-3 hours)

Update `src/lib/types/email.ts`:
```typescript
interface EmailSendOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  template?: string;
  variables?: Record<string, any>;
}

interface EmailMessage extends EmailSendOptions {
  id: string;
  from: string;
  sentAt: Date;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
}
```

**Expected Result:** 30 → 0 errors

**Task 2.3: Fix API Response Shapes** (2 hours)

Standardize all API responses:
```typescript
// Pattern for list endpoints
return NextResponse.json({
  data: items,
  total: items.length,
  hasMore: offset + limit < totalCount,
  cursor: offset + limit,
});

// Pattern for single item endpoints
return NextResponse.json({
  data: item,
  success: true,
});

// Pattern for error responses
return NextResponse.json(
  {
    error: {
      message: 'Error message',
      code: 'ERROR_CODE',
      timestamp: new Date().toISOString(),
    },
  },
  { status: 400 }
);
```

**Files to Review:** src/app/api/dashboard/*, src/app/api/emails/*

**Expected Result:** 20 → 0 errors

**Day 2 Summary:**
- Interface conflicts: FIXED
- Email types: FIXED
- Response shapes: STANDARDIZED
- Expected errors remaining: 500+

---

### Day 3: Missing Functions & Variables

**Task 3.1: Create Rate Limit Middleware** (1.5 hours)

Create `src/lib/middleware/rate-limit.ts`:
```typescript
import { RateLimiter } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const apiLimiter = new RateLimiter({
  redis,
  limiter: RateLimiter.slidingWindow(100, '1 h'),
});

const authLimiter = new RateLimiter({
  redis,
  limiter: RateLimiter.slidingWindow(5, '15 m'),
});

export function withApiRateLimit(
  handler: (req: Request) => Promise<Response>
) {
  return async (request: Request) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { success } = await apiLimiter.limit(ip);

    if (!success) {
      return new Response('Rate limit exceeded', { status: 429 });
    }

    return handler(request);
  };
}

export function withAuthRateLimit(
  handler: (req: Request) => Promise<Response>
) {
  return async (request: Request) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { success } = await authLimiter.limit(`auth:${ip}`);

    if (!success) {
      return new Response('Too many attempts', { status: 429 });
    }

    return handler(request);
  };
}
```

**Expected Result:** 20 → 0 errors

**Task 3.2: Add Missing Service Methods** (2 hours)

**File: `src/lib/services/email-service.ts`**
```typescript
async getEmailStats() {
  const { data, error } = await supabase
    .from('email_logs')
    .select('status, count() as count')
    .groupBy('status');

  if (error) throw error;
  return data;
}

async getEmailCampaigns() {
  const { data, error } = await supabase
    .from('email_campaigns')
    .select('*');

  if (error) throw error;
  return data;
}
```

**File: `src/lib/services/analytics-service.ts`**
```typescript
export interface OrganizerDashboard {
  totalEvents: number;
  totalAttendees: number;
  totalRevenue: number;
  upcomingEvents: Event[];
  recentActivity: Activity[];
}

export interface AdminDashboard {
  totalUsers: number;
  totalEvents: number;
  totalRevenue: number;
  platformMetrics: Metrics;
}

export interface VolunteerDashboard {
  totalHours: number;
  completedTasks: number;
  upcomingVolunteerOpportunities: Opportunity[];
}

export interface SponsorDashboard {
  sponsoredEvents: Event[];
  totalSpent: number;
  roi: number;
}
```

**Expected Result:** 30 → 0 errors

**Task 3.3: Create JWT Utilities** (1.5 hours)

Create `src/lib/auth/jwt.ts`:
```typescript
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET!;

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function createJWT(payload: JWTPayload): string {
  return jwt.sign(payload, SECRET, {
    expiresIn: '24h',
  });
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}
```

**Expected Result:** 15 → 0 errors

**Day 3 Summary:**
- Rate limit functions: CREATED
- Service methods: ADDED
- JWT utilities: CREATED
- Expected errors remaining: 200+

---

## 🟡 PHASE 2: MISSING COMPONENTS (Days 4-6)

### Day 4: Gallery & Schedule Components

**Task 4.1: Create Gallery Components** (3 hours)

**`src/components/gallery/PhotoGallery.tsx`:**
```typescript
import React from 'react';
import Image from 'next/image';
import { useState } from 'react';

interface Photo {
  id: string;
  url: string;
  caption: string;
  uploadedAt: Date;
}

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  return (
    <div className="grid grid-cols-3 gap-4">
      {photos.map(photo => (
        <div
          key={photo.id}
          className="relative h-48 cursor-pointer"
          onClick={() => setSelectedPhoto(photo)}
        >
          <Image
            src={photo.url}
            alt={photo.caption}
            fill
            className="object-cover rounded-lg"
          />
        </div>
      ))}
      
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <Image
            src={selectedPhoto.url}
            alt={selectedPhoto.caption}
            width={800}
            height={600}
            className="max-w-2xl"
          />
        </div>
      )}
    </div>
  );
}
```

**`src/components/gallery/GalleryFilters.tsx`:**
```typescript
export function GalleryFilters({ 
  onFilter 
}: { 
  onFilter: (filters: any) => void 
}) {
  return (
    <div className="flex gap-4">
      <input
        type="date"
        onChange={e => onFilter({ date: e.target.value })}
      />
      <select onChange={e => onFilter({ type: e.target.value })}>
        <option value="">All Types</option>
        <option value="event">Event</option>
        <option value="workshop">Workshop</option>
      </select>
    </div>
  );
}
```

**`src/components/gallery/EventMemories.tsx`:**
```typescript
export function EventMemories({ eventId }: { eventId: string }) {
  const [memories, setMemories] = React.useState([]);

  React.useEffect(() => {
    // Fetch memories for event
  }, [eventId]);

  return (
    <div>
      <h2>Event Memories</h2>
      <PhotoGallery photos={memories} />
    </div>
  );
}
```

**Expected Result:** 3 components, 9 errors → 0 errors

**Task 4.2: Create Schedule Components** (3 hours)

Similar pattern for:
- `src/components/schedule/Calendar.tsx`
- `src/components/schedule/ScheduleFilters.tsx`
- `src/components/schedule/TimelineView.tsx`
- `src/components/schedule/ScheduleStats.tsx`

**Day 4 Summary:**
- Gallery module: COMPLETE
- Schedule module: COMPLETE
- Expected errors remaining: 100+

---

### Day 5-6: Remaining Components

**Task 5.1: Create Testimonials Module** (2 hours)

**Task 5.2: Create Venues Module** (2 hours)

**Task 5.3: Create Database Mock** (1.5 hours)

Create `src/__mocks__/database.ts`:
```typescript
export const mockDatabase = {
  query: jest.fn(),
  execute: jest.fn(),
  transaction: jest.fn(),
};
```

**Days 5-6 Summary:**
- All missing components: CREATED
- All mocks: CREATED
- Expected errors remaining: 30+

---

## 🔵 PHASE 3: FINAL POLISH (Days 7-8)

### Day 7: Type & Error Handling

**Task 7.1: Fix SMS Status Type** (30 minutes)

**Task 7.2: Fix Test Infrastructure** (2 hours)

Update test files:
- Fix import paths
- Replace invalid test variables (x → expect)
- Fix mock type mismatches

**Task 7.3: Add Type Guards** (1.5 hours)

```typescript
// Example: Safe error handling
catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  } else if (typeof error === 'string') {
    console.error(error);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Day 8: Final Testing

**Task 8.1: Run Full Type Check**
```bash
npm run typecheck
```

**Task 8.2: Build Project**
```bash
npm run build
```

**Task 8.3: Run Tests**
```bash
npm test
```

**Task 8.4: Lint Check**
```bash
npm run lint
```

---

## ✅ VERIFICATION CHECKLIST

### After Phase 1:
- [ ] Project compiles (`npm run build`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] ESLint passes (`npm run lint`)

### After Phase 2:
- [ ] All components exist
- [ ] All modules created
- [ ] All mocks in place

### After Phase 3:
- [ ] Tests pass (`npm test`)
- [ ] Security audit passes (`npm audit`)
- [ ] Load test passes (1000 concurrent users)

---

## 📊 TIMELINE SUMMARY

| Phase | Duration | Tasks | Status |
|-------|----------|-------|--------|
| Phase 1: Critical Fixes | 3 days | 10 tasks | ⏳ |
| Phase 2: Missing Components | 3 days | 8 tasks | ⏳ |
| Phase 3: Polish & Testing | 2 days | 4 tasks | ⏳ |
| **Total** | **8 days** | **22 tasks** | **⏳** |

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] All TypeScript errors fixed
- [ ] All tests passing
- [ ] Code coverage > 80%
- [ ] Security audit clean
- [ ] Lighthouse score > 95
- [ ] Load test passed
- [ ] Database migrations tested
- [ ] Payment processing verified
- [ ] Email sending tested
- [ ] Notifications working
- [ ] QR code scanning verified
- [ ] Analytics tracking validated
- [ ] Admin panel functional
- [ ] File uploads tested
- [ ] Rate limiting working

---

## 💡 TIPS FOR EFFICIENT COMPLETION

1. **Use `npm run lint -- --fix`** - Solves ~60% of issues automatically
2. **Work in groups** - Fix similar issues together (all type mismatches, then all missing imports)
3. **Test frequently** - Run `npm run typecheck` after every 5 fixes
4. **Create templates** - Save time by creating component templates
5. **Parallel work** - Different developers can work on different modules simultaneously
6. **Use IDE help** - VSCode's "Quick Fix" feature can auto-generate many components

---

**Created:** January 8, 2026  
**Next Review:** After Phase 1 completion  
**Contact:** Development Team
