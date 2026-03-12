// =====================================================
// API ROUTE: NOTIFICATION HISTORY
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/config';
import type { NotificationHistoryEntry } from '@/types/api';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');

    // Build query
    let query = supabase
      .from('notification_log')
      .select(`
        *,
        notification_types(name, display_name, category, icon),
        notification_channels(name, display_name, icon)
      `)
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (channel) {
      query = query.eq('notification_channels.name', channel);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      throw error;
    }

    // Format notifications
    const formatted = notifications?.map((notif: NotificationHistoryEntry) => ({
      id: notif.id,
      type: notif.notification_types?.display_name || notif.notification_types?.name,
      category: notif.notification_types?.category,
      channel: notif.notification_channels?.name,
      channelIcon: notif.notification_channels?.icon,
      recipient: notif.recipient,
      subject: notif.subject,
      body: notif.body,
      status: notif.status,
      sentAt: notif.sent_at,
      deliveredAt: notif.delivered_at,
      openedAt: notif.opened_at,
      clickedAt: notif.clicked_at,
      externalId: notif.external_id,
    }));

    return NextResponse.json({
      notifications: formatted || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    });

  } catch (error) {
    logger.error('Get history error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const beforeDate = searchParams.get('before');

    // Build delete query
    let query = supabase
      .from('notification_log')
      .delete()
      .eq('user_id', user.id);

    if (beforeDate) {
      query = query.lt('sent_at', new Date(beforeDate));
    }

    const { error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Notification history cleared',
    });

  } catch (error) {
    logger.error('Clear history error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
