# AS_ANY Next Steps

Summary:
- Total `as any` occurrences previously identified: ~400-900 (see AS_ANY_FIX_GUIDE.md)
- Prioritize high-impact files (top counts):
  - `src/lib/actions/revenue-actions.ts` (76)
  - `src/lib/database/queries/affiliate.ts` (48)
  - `src/lib/database/queries/seating.ts` (39)
  - `src/lib/database/queries/email-marketing.ts` (34)
  - `src/lib/performance/lazy-loading.tsx` (30)

Plan:
1. Triage top 20 files: add type definitions for DB results (Supabase types) and replace `as any` with proper `zod` parsing or typed interfaces.
2. Create `types/supabase/` small shared types for `registrations`, `events`, `profiles`, `tickets`.
3. Replace `as any` in helper utilities (e.g., lazy-loading) with `unknown` + explicit casts where safe or generic typing for loaders.
4. Introduce small helper `cast<T>(v: unknown): T` for targeted places and audit after each file.
5. Add CI check that reports remaining `as any` count (fail if increases unexpectedly).

Immediate next actions I can perform now (pick one):
- Implement typed fixes for top 3 files (`revenue-actions`, `affiliate queries`, `seating queries`) and run tests.
- Create `types/supabase` minimal set and update a few key DB query files to use them.
- Only produce patch diffs for review instead of applying changes.

