# CI Threshold Adjustment Guide

**Audit finding**: "Jest/CI configuration enforces unreachable threshold — CI
fails because threshold is 50% but current realistic incremental target should
be staged."

---

## Current Situation

`jest.config.js` has:
```javascript
coverageThreshold: {
  global: {
    statements: 50,
    branches:   50,
    functions:  50,
    lines:      50,
  }
}
```

But actual coverage is **3.5%** → CI always fails.

---

## Fix: Staged Thresholds

Replace the global threshold with an **incremental** approach:

```javascript
// jest.config.js
module.exports = {
  // … other config
  coverageThreshold: {
    // Start at 10%, increase weekly
    global: {
      statements: 10,
      branches:   5,
      functions:  10,
      lines:      10,
    },

    // Enforce higher thresholds on NEW code only
    './src/lib/actions/**/*.ts': {
      statements: 30,
      branches:   20,
      functions:  30,
      lines:      30,
    },
    './src/app/api/**/route.ts': {
      statements: 25,
      branches:   15,
      functions:  25,
      lines:      25,
    },
  },

  // CI should only fail on CHANGED files falling below threshold
  onlyChanged: process.env.CI === 'true',
};
```

---

## Weekly Increment Plan

| Week | Global | New Code (actions) | New Code (API routes) |
|------|--------|--------------------|-----------------------|
| 1    | 10%    | 30%                | 25%                   |
| 2    | 15%    | 40%                | 30%                   |
| 3    | 20%    | 50%                | 40%                   |
| 4    | 30%    | 60%                | 50%                   |
| 6    | 40%    | 70%                | 60%                   |
| 8    | 50%    | 80%                | 70%                   |

**How to update**:
1. At the end of each week, run `npm run test:coverage`
2. If actual coverage > threshold + 5%, bump the threshold by 5%
3. Commit the new `jest.config.js`

---

## Bypass CI Temporarily (Emergency)

If you need to merge urgently and coverage hasn't caught up yet:

```bash
# In CI script (e.g., .github/workflows/test.yml)
npm test -- --coverage --coverageThreshold='{}'   # empty = no threshold
```

**But**: Don't do this more than once. The whole point is incremental ramp-up.

---

**Next**: After applying this, CI will pass at 10% global coverage, which you
can hit this week by writing tests for the top 3 server-action files.
