import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/secure-client';
import { saveCookieConsent } from '@/lib/security/gdpr-compliance';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { necessary, functional, analytics, marketing, version } = body;

    // Get session ID if user is not logged in
    let sessionId = null;
    if (!user) {
      sessionId = request.cookies.get('session_id')?.value || null;
    }

    await saveCookieConsent(user?.id || null, sessionId, {
      necessary: necessary ?? true,
      functional: functional ?? false,
      analytics: analytics ?? false,
      marketing: marketing ?? false,
      version: version || '1.0'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error saving cookie consent:', error);
    return NextResponse.json(
      { error: 'Failed to save consent' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const sessionId = request.cookies.get('session_id')?.value || null;

    // For now, just return success
    return NextResponse.json({ consent: null });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch consent' },
      { status: 500 }
    );
  }
}
