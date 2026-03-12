import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/secure-client';
import { requestDataDeletion } from '@/lib/security/gdpr-compliance';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { deletionType = 'account', reason } = body;

    const deletionRequest = await requestDataDeletion(user.id, deletionType, reason);

    return NextResponse.json({
      success: true,
      requestId: deletionRequest.id,
      scheduledDate: deletionRequest.scheduled_deletion_date,
      message: 'Deletion request submitted. You will receive a confirmation email.'
    });
  } catch (error) {
    logger.error('Error requesting deletion:', error);
    return NextResponse.json(
      { error: 'Failed to request deletion' },
      { status: 500 }
    );
  }
}
