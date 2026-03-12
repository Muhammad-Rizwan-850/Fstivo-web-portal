/**
 * GET /api/health/live
 * ────────────────────
 * Kubernetes liveness probe.
 * Returns 200 as long as the Node.js process is running.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ alive: true }, { status: 200 });
}
