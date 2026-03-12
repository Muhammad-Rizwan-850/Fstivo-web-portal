import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/secure-client';
import { verifyAndEnableAuthenticator } from '@/lib/security/two-factor-auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    const result = await verifyAndEnableAuthenticator(user.id, code);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error verifying 2FA:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify' },
      { status: 400 }
    );
  }
}
