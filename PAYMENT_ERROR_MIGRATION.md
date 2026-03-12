# Payment Error Migration Guide

**Audit**: "Unclear error handling in several API routes."

---

## Before (current pattern)

```typescript
// src/app/api/payments/jazzcash/create/route.ts
export async function POST(request: Request) {
  try {
    // … logic
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
```

**Problems**:
- Generic "Something went wrong" message
- No machine-readable error code
- Stack trace exposed in dev mode (unsafe)

---

## After (structured errors)

```typescript
import { paymentError, ErrorCodes } from '@/lib/payments/error-responses';

export async function POST(request: Request) {
  try {
    const { orderId, amount } = await request.json();

    if (!orderId || amount <= 0) {
      return paymentError('INVALID_AMOUNT', 'Amount must be positive');
    }

    // … call JazzCash API
    const response = await jazzCashClient.createPayment({ … });

    if (!response.ok) {
      return paymentError('PAYMENT_PROVIDER_DOWN', 'JazzCash is temporarily unavailable', response.error);
    }

    return NextResponse.json({ success: true, data: response.data });
  } catch (err) {
    return paymentError('INTERNAL_ERROR', 'An unexpected error occurred', err);
  }
}
```

**Benefits**:
- Clear user-facing message
- Machine-readable `code` field for client retry logic
- Full stack trace logged server-side
- No secrets leaked to client

---

## Files to Update

Apply this pattern to:

1. `src/app/api/payments/jazzcash/create/route.ts`
2. `src/app/api/payments/easypaisa/create/route.ts`
3. `src/app/api/webhooks/stripe/route.ts`
4. `src/app/api/webhooks/jazzcash/return/route.ts`
5. `src/app/api/webhooks/easypaisa/return/route.ts`

Grep for generic error handling:
```bash
grep -rn "return.*error.*'Something went wrong'" src/app/api/payments/
```

---

**Estimate**: 2-3 hours to update all payment routes.
