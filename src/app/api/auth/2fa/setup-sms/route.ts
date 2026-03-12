import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/secure-client';
import { setupSMS2FA } from '@/lib/security/two-factor-auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber } = body;

    const result = await setupSMS2FA(user.id, phoneNumber);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error setting up SMS 2FA:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to setup SMS 2FA' },
      { status: 400 }
    );
  }
}
