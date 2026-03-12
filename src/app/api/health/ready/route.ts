/**
 * GET /api/health/ready
 * ─────────────────────
 * Kubernetes readiness probe.
 * Returns 200 only if the app can serve traffic (DB reachable).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    return NextResponse.json({ ready: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ready: false }, { status: 503 });
  }
}
