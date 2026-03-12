import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/secure-client';
import { requestDataExport } from '@/lib/security/gdpr-compliance';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { exportType = 'full_export' } = body;

    const exportRequest = await requestDataExport(user.id, exportType);

    return NextResponse.json({
      success: true,
      requestId: exportRequest.id,
      message: 'Export request submitted. You will receive an email when it is ready.'
    });
  } catch (error) {
    logger.error('Error requesting export:', error);

    if (error instanceof Error && error.message === 'You already have a pending export request') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to request export' },
      { status: 500 }
    );
  }
}
