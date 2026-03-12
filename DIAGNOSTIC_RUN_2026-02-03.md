# FSTIVO — Diagnostic Run (2026-02-03)

This file is a concise, actionable diagnostic of the repository state based on code scans, test setup, and existing documentation.

---

**Quick summary**
- Project: Next.js app (Next 15), TypeScript, Supabase backend, Stripe/Resend/Twilio integrations.
- Current blocking items: missing environment variables, occasional failing tests caused by Supabase mocks, and a small type mismatch in Twilio SMS status handling.
- Recommended immediate action: run `./environment_setup_assistant.sh` and then run the test/typecheck suite.

---

## 1) Critical / High-priority Issues (action within 0.5–2 hours)

- Missing/placeholder environment variables (blocks local / CI runs)
  - Required (example names found in docs):
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `STRIPE_SECRET_KEY`
    - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
    - `STRIPE_WEBHOOK_SECRET`
    - `RESEND_API_KEY`
    - `TWILIO_ACCOUNT_SID`
    - `TWILIO_AUTH_TOKEN`
    - `TWILIO_PHONE_NUMBER`
    - `EASYPAISA_SECRET_KEY` / JazzCash keys
    - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
    - `NEXT_PUBLIC_MAPBOX_TOKEN`
    - `NEXT_PUBLIC_GA_MEASUREMENT_ID`
    - `CSRF_SECRET` / `CRON_SECRET`
  - Location: `.env.local` / `.env.example`. Use `./environment_setup_assistant.sh` to populate safely.

- Tests failing due to Supabase mocking
  - Symptom: `TypeError: supabase.from(...).insert(...).select is not a function`
  - Root cause: Some tests expect chainable Supabase query behavior; insufficient or inconsistent mocks were present before fixes. Current `tests/setup.ts` contains comprehensive chainable mocks but a few tests remain flaky per docs.
  - Fix: Ensure `tests/setup.ts` is included via Jest config, unify mocks for `@/lib/supabase/server`, `@/lib/supabase/client`, and `@supabase/ssr` and run tests.

- Twilio SMS status type mismatch
  - Symptom: Twilio returns statuses like `sending` and `undelivered`; type definitions did not include them.
  - Fix: Ensure `mapTwilioStatus()` covers all Twilio statuses (sending, undelivered) or make types tolerant (`| 'unknown'`).

- Webhook secrets not consistently enforced
  - Payment & webhook handlers require `STRIPE_WEBHOOK_SECRET`, Easypaisa/JazzCash secrets. Confirm presence and validate signature checks.

---

## 2) Medium-priority Improvements (1–4 hours)

- Auto-generate Supabase types
  - Use: `npx supabase gen types typescript --linked > src/types/supabase-generated.d.ts` (see `package.json` script `gen:supabase-types`).
  - Benefits: Avoid manual type drift and runtime mismatches.

- Lint warnings & TypeScript checks
  - `next.config.js` currently sets `eslint.ignoreDuringBuilds = true`; prefer fixing lints rather than ignoring them.
  - Run `npm run typecheck` and address remaining type issues.

- Centralize secrets management
  - Add `.env.example` with placeholders (exists). Use `.env.local` for local dev and keep secrets out of repo.
  - Consider a secrets tool (Vault / Vercel environment variables) for production.

- Webhook endpoint docs & test coverage
  - Provide sample webhook payloads and verification unit tests for Stripe/Twilio/Easypaisa.

- Improve CI: add `typecheck` and `test:unit` to CI pipeline before build.

---

## 3) Low-priority / Nice-to-have (days)

- Monitoring & Sentry integration (optional)
- Hardening CSP and review `dangerouslyAllowSVG` usage in `next.config.js`.
- Optimize bundle aliases (verify `'lodash-es': 'lodash'` mapping compatibility).
- Add missing API docs if any endpoints are untracked (most appear documented under `docs/`).

---

## 4) Missing Files / Keys / External Services (found across docs)
- `.env.local` — must be created from `.env.example` (helper script provided).
- External accounts / keys required:
  - Supabase project + service role key
  - Stripe (publishable, secret, webhook secret)
  - Resend API key
  - Twilio (Account SID, Auth Token, phone number)
  - JazzCash / Easypaisa secrets
  - Mapbox token, Google Analytics ID
  - VAPID keys for push subscriptions

---

## 5) API Surface & Integrations
- API routes: many routes under `src/app/api/` (docs state ~53 endpoints). Key groups documented:
  - `/api/auth/*`, `/api/events/*`, `/api/payments/*`, `/api/admin/*`, `/api/email-marketing/*`, `/api/seating/*`, `/api/event-cloning/*`, `/api/showcase/*`, `/api/analytics/*`, `/api/pwa/*`.
- External integrations:
  - Database/Auth: Supabase
  - Payments: Stripe, JazzCash, Easypaisa
  - Email: Resend
  - SMS/WhatsApp: Twilio
  - AI: OpenAI
  - Push: web-push (VAPID)
  - Maps: Mapbox

---

## 6) Tests & CI
- Test framework: Jest (unit & integration), Playwright for E2E.
- `tests/setup.ts` provides mocks and polyfills (Supabase client mocks included).
- Some unit tests and integration tests may still fail until `.env.local` and mocks are consistent.
- `package.json` contains `test`, `test:unit`, `test:integration`, `test:e2e` scripts.

---

## 7) Recommended immediate runbook (copy/paste)
1. From project root:

```bash
# Ensure deps installed
npm install

# Create .env.local safely (helper will copy example and prompt)
./environment_setup_assistant.sh

# Run tests and typecheck
npm run typecheck
npm test

# Run dev server
npm run dev
```

2. If tests fail with Supabase errors, confirm `tests/setup.ts` is loaded by Jest via `jest.config.js` or `package.json` setupFiles.
3. Generate Supabase types (optional but recommended):

```bash
npm run gen:supabase-types
```

---

## 8) Short prioritized checklist (next 0–8 hours)
- [ ] Run `./environment_setup_assistant.sh` and fill `.env.local` (30–120m) — CRITICAL
- [ ] Run `npm run typecheck` and fix type errors (30–90m)
- [ ] Run `npm test` and fix failing tests (1–3h)
- [ ] Generate Supabase types (`npm run gen:supabase-types`) (15–30m)
- [ ] Confirm webhook secret verification for Stripe/Twilio (30–60m)
- [ ] Remove `eslint.ignoreDuringBuilds` after fixing lints (30–90m)

---

If you want, I can now:
- execute the `environment_setup_assistant.sh` wizard interactively (I can run it here, but it will prompt for secrets), or
- run `npm run typecheck` and `npm test` to collect current failure outputs, or
- generate a consolidated issues file and open PRs for the high-priority fixes.

Tell me which of the above you'd like me to run next and I will proceed.
