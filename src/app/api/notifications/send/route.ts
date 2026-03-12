// =====================================================
// API ROUTE: SEND NOTIFICATION
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/config';
import { notificationService } from '@/lib/notifications/service';
import type { NotificationSendRequest, NotificationChannel } from '@/types/api';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = (await request.json()) as NotificationSendRequest;
    const {
      notificationType,
      channels,
      data,
      priority = 'normal',
      scheduledFor
    } = body;

    // Validate required fields
    if (!notificationType) {
      return NextResponse.json(
        { error: 'Notification type is required' },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Notification data is required' },
        { status: 400 }
      );
    }

    // Send notification via multi-channel helper
    const message =
      typeof data === 'string'
        ? data
        : (data && typeof data === 'object' && 'message' in data)
        ? ((data as { message?: string }).message ?? JSON.stringify(data))
        : JSON.stringify(data);

    const results = await notificationService.sendMultiChannel(
      user.id,
      (channels || []) as NotificationChannel[],
      {
        title: notificationType,
        message,
        data,
      }
    );

    // Determine success if any channel fulfilled
    const hasSuccess = Array.isArray(results.results)
      ? results.results.some((r: PromiseSettledResult<any>) => r.status === 'fulfilled')
      : false;

    return NextResponse.json({
      success: hasSuccess,
      results,
      message: hasSuccess ? 'Notification sent successfully' : 'Failed to send notification',
    }, { status: hasSuccess ? 200 : 500 });

  } catch (error) {
    logger.error('Send notification error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
