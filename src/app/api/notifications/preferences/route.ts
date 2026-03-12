// =====================================================
// API ROUTE: NOTIFICATION PREFERENCES
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/config';
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

    // Get user preferences
    const { data: preferences } = await (supabase as any)
      .rpc('get_user_notification_preferences', { p_user_id: user.id });

    // Group by category
    const groupedPrefs: Record<string, any[]> = {};
    (preferences as any[])?.forEach((pref: any) => {
      if (!groupedPrefs[pref.category]) {
        groupedPrefs[pref.category] = [];
      }
      groupedPrefs[pref.category].push(pref);
    });

    // Get global settings
    const { data: settings } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get verified contacts
    const { data: contacts } = await supabase
      .from('user_contact_verification')
      .select(`
        *,
        notification_channels(name)
      `)
      .eq('user_id', user.id);

    return NextResponse.json({
      preferences: groupedPrefs || {},
      settings: settings || {
        global_enabled: true,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        timezone: 'Asia/Karachi',
      },
      contacts: contacts || [],
    });

  } catch (error) {
    logger.error('Get preferences error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { preferences, settings } = body;

    // Update preferences if provided
    if (preferences && Array.isArray(preferences)) {
      for (const pref of preferences) {
        const { notificationType, channel, enabled } = pref;

        // Get IDs
        const { data: typeData } = await (supabase as any)
          .from('notification_types')
          .select('id')
          .eq('name', notificationType)
          .single();

        const { data: channelData } = await (supabase as any)
          .from('notification_channels')
          .select('id')
          .eq('name', channel)
          .single();

        if (typeData && channelData) {
          await (supabase as any)
            .from('user_notification_preferences')
            .upsert({
              user_id: user.id,
              notification_type_id: typeData.id,
              channel_id: channelData.id,
              is_enabled: enabled,
            }, {
              onConflict: 'user_id,notification_type_id,channel_id'
            });
        }
      }
    }

    // Update global settings if provided
    if (settings) {
      await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        }, {
          onConflict: 'user_id'
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
    });

  } catch (error) {
    logger.error('Update preferences error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
