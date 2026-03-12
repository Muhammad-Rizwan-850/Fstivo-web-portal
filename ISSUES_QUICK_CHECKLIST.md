# QUICK REFERENCE: ISSUES BY PRIORITY & ACTION

**Last Updated:** February 9, 2026

---

## 🔴 CRITICAL (Blocks Deployment) - 5 Issues

### Must Fix These First - 47-67 hours total

| # | Issue | Effort | Quick Fix |
|---|-------|--------|-----------|
| **C1** | Test Coverage 1.89%→50%+ | 20-30h | Create 20+ test files |
| **C2** | Payment Integration (JazzCash/EasyPaisa) | 10-14h | Implement 2 gateways |
| **C3** | Webhook Payment Processing Empty | 4-6h | Implement webhook handler |
| **C4** | 917 Type `any` Bypasses | 12-16h | Replace with proper types |
| **C5** | Environment Variables Missing | 1h | Fill .env.local |

---

## 🟠 HIGH (Fix Before Launch) - 6 Issues

### Then Fix These - 7-9 hours total

| # | Issue | Effort | Quick Fix |
|---|-------|--------|-----------|
| **H1** | Email Notifications Not Sending | 2h | Implement Resend integration |
| **H2** | useEffect Missing Dependencies (20-30) | 2-3h | Add dependency arrays |
| **H3** | Unused Imports (180+) | 1-2h | npm run lint -- --fix |
| **H4** | Duplicate lib/ Directory | 0.5h | rm -rf lib/ |
| **H5** | Optional Chaining Assertions | 1h | Use ?? instead of ! |
| **H6** | Supabase Types Not Generated | 0.5h | Run type generation command |

---

## 🟡 MEDIUM (Recommended) - 6 Issues

### Nice to Complete - 5.5-7.5 hours total

| # | Issue | Effort | Quick Fix |
|---|-------|--------|-----------|
| **M1** | Network Like Functionality | 2-3h | Implement follow/like logic |
| **M2** | Registration Cancellation | 1-2h | Add refund + email logic |
| **M3** | Dashboard Tab Navigation | 0.5h | Wire up tab routing |
| **M4** | Pricing Rules Info | 0.5h | Add applied rules to response |
| **M5** | Webhook Logging Missing | 0.5h | Add audit trail logging |
| **M6** | Consolidate Payment Files | 1h | Merge 3 files into 1 |

---

## 🟢 LOW (Nice to Have) - 4 Issues

### Polish & Optimize - 5-8 hours total

| # | Issue | Effort | Quick Fix |
|---|-------|--------|-----------|
| **L1** | Metadata Configuration (40 pages) | 2-3h | Run Next.js codemod |
| **L2** | Turbo Configuration Deprecated | 0.25h | Run Turbo codemod |
| **L3** | Test Warnings (backup collision) | 0.25h | Delete backup directory |
| **L4** | Unused Dependencies & Dead Code | 2-2.5h | Run depcheck audit |

---

## 🚀 IMPLEMENTATION SEQUENCE

### Week 1: Critical Path (Make it Production-Ready)

**Monday:**
```bash
# 1h - Set environment variables
cp .env.example .env.local
# Fill: TWILIO_*, JAZZCASH_*, EASYPAISA_*, VAPID_*, CRON_SECRET

# 1h - Fix type safety basics
# - Optional chaining assertions
# - Enable strict TypeScript mode

# 1-2h - Clean up imports
npm run lint -- --fix
```

**Tuesday:**
```bash
# 4-6h - Implement webhook payment processing
# File: src/lib/payments/webhook.ts
# Add verification, order update, logging

# 2-3h - Fix useEffect dependencies
# Use ESLint rule: react-hooks/exhaustive-deps
```

**Wednesday-Friday:**
```bash
# 4-5h - Implement JazzCash gateway
# - API integration
# - Checkout flow
# - Webhook handling

# 4-5h - Implement EasyPaisa gateway
# - API integration  
# - Checkout flow
# - Webhook handling

# 2h - Implement email notifications
# Files: campaigns.ts, admin approve/reject/changes routes
```

**Status Check:**
```bash
npm run typecheck   # Should pass with 0 errors
npm run test        # Should run with minimal failures
npm run build       # Should complete successfully
npm run dev         # Should start on localhost:3000
```

---

### Week 2: Type Safety & Features (Stabilize)

**Monday-Tuesday:**
```bash
# 12-16h - Reduce type `any` usage
# Highest priority files:
# - src/lib/monetization/* (60+ instances)
# - src/lib/performance/* (40+ instances)
# - src/app/api/showcase/* (80+ instances)

# Strategy:
# 1. Identify patterns
# 2. Create type definitions
# 3. Replace gradually
# 4. Test thoroughly
```

**Wednesday-Friday:**
```bash
# 1-2h - Implement registration cancellation
# File: src/components/.../registrations-list.tsx
# Add: confirmation, refund calculation, email

# 2-3h - Implement network like functionality
# File: src/app/network/page.tsx
# Add: follow, like, feed generation

# 1h - Consolidate payment files
# Merge: payments.ts, payments-server.ts, payments-new.ts

# 0.5h - Add webhook logging
# File: src/lib/security/webhook-verification.ts
```

---

### Week 3: Test Coverage (Reliability)

```bash
# 20-30h - Build comprehensive test suite
# Target: 50%+ coverage

# Test files to create:
tests/unit/monetization/        # 6-8h
tests/unit/security/            # 4-5h
tests/integration/notifications/ # 4-5h
tests/components/               # 4-5h
tests/api/                       # 4-5h

# Run tests
npm run test:coverage
```

---

### Week 4: Polish & Deploy (Ready for Production)

```bash
# 2-3h - Fix metadata configuration
npx @next/codemod@latest migrate-next-metadata-to-viewport .

# 0.5h - Update Turbo configuration
npx @next/codemod@latest next-experimental-turbo-to-turbopack .

# 1-2h - Audit and optimize
npm run analyze          # Check bundle size
npm run test:e2e         # End-to-end tests
npm run build            # Final production build
```

---

## ⏱️ EFFORT SUMMARY

```
Critical (C1-C5):    47-67h  Week 1-2
High (H1-H6):         7-9h   Week 2
Medium (M1-M6):    5.5-7.5h  Week 2-3
Low (L1-L4):        5-8h    Week 4

TOTAL:            64-91.5h (2-4 weeks)
```

---

## ✅ DEPLOYMENT CHECKLIST

### Before Going to Production

**Critical Fixes (All must be ✓):**
- [ ] C1: Test coverage ≥ 50%
- [ ] C2: Payment gateways implemented & tested
- [ ] C3: Webhook payment processing working
- [ ] C4: Dangerous `any` types reduced
- [ ] C5: All environment variables configured

**High Priority (Should be ✓):**
- [ ] H1: Email notifications sending
- [ ] H2: useEffect dependencies fixed
- [ ] H3: No unused imports (ESLint clean)
- [ ] H4: Single lib/ directory
- [ ] H5: No unsafe assertions
- [ ] H6: Supabase types generated

**Pre-Deployment (All must be ✓):**
- [ ] `npm run typecheck` passes (0 errors)
- [ ] `npm run test` passes (>50% coverage)
- [ ] `npm run build` succeeds
- [ ] `npm start` runs without errors
- [ ] `npm run test:e2e` passes critical paths
- [ ] All API endpoints tested
- [ ] Security audit completed
- [ ] Performance acceptable (Lighthouse 90+)
- [ ] Error handling tested
- [ ] Database migrations run successfully
- [ ] Monitoring/logging configured
- [ ] Backup strategy in place

---

## 🔧 COMMAND REFERENCE

### Quick Fixes
```bash
# Clean up imports
npm run lint -- --fix

# Generate types
npm run gen:supabase-types

# Type check
npm run typecheck

# Run tests
npm run test
npm run test:coverage
npm run test:e2e

# Build & start
npm run build
npm start
npm run dev
```

### Diagnostics
```bash
# Check for unused deps
npx depcheck

# Analyze bundle
npm run analyze

# Find unused vars
eslint src --no-eslintrc --rule "no-unused-vars: error"

# Git status
git status
git diff --stat
```

---

## 📞 NEED DETAILED INFO?

See [COMPREHENSIVE_ISSUES_PRIORITY_REPORT.md](./COMPREHENSIVE_ISSUES_PRIORITY_REPORT.md) for:
- Detailed problem descriptions
- Code examples for each issue
- Complete fix implementations
- Success criteria
- Estimated timelines

