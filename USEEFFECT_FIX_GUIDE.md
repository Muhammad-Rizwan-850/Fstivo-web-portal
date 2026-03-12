# useEffect Missing Dependencies Fix Guide

**Audit**: Found 20-30 instances of missing dependencies in useEffect hooks.

---

## Pattern to Fix

### ❌ Before (Missing Dependencies)
\`\`\`typescript
const fetchData = async () => {
  const data = await getEvents(filters);
  setEvents(data);
};

useEffect(() => {
  fetchData();
}, []); // ❌ Missing 'fetchData' and 'filters'
\`\`\`

---

## Files to Fix (Top Priority)

Run this command to find all instances:
\`\`\`bash
grep -rn "useEffect" src/app/admin/ --include="*.tsx" | grep -v "eslint-disable"
\`\`\`

### High-Impact Files
1. \`src/app/admin/showcase/page.tsx:55\`
2. \`src/app/admin/showcase-manager/page.tsx:103\`
3. \`src/app/admin/events/page.tsx\`
4. \`src/components/features/attendee-dashboard/\`

---

## Quick Fix Strategy

### Option 1: Add useCallback (Recommended)
\`\`\`typescript
import { useCallback } from 'react';

const fetchData = useCallback(async () => {
  // fetch logic
}, [dependency1, dependency2]);

useEffect(() => {
  fetchData();
}, [fetchData]); // ✅ Correct dependency
\`\`\`

### Option 2: Move Function Inside useEffect
\`\`\`typescript
useEffect(() => {
  const fetchData = async () => {
    // fetch logic
  };
  fetchData();
}, [dependency1, dependency2]);
\`\`\`

### Option 3: Disable Rule (Last Resort)
\`\`\`typescript
useEffect(() => {
  fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
\`\`\`

---

## Automated Fix

\`\`\`bash
# Install React hooks ESLint plugin if not present
npm install --save-dev eslint-plugin-react-hooks

# Run auto-fix (handles some cases)
npx eslint src/ --fix --rule 'react-hooks/exhaustive-deps: error'
\`\`\`

---

**Estimate**: 2 hours to fix all 20-30 instances
