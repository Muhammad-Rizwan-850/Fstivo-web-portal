import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/secure-client';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      campaign_id,
      name,
      type,
      content,
      destination_url,
      cta_text
    } = body;

    // Verify user owns the campaign
    const { data: campaign } = await supabase
      .from('ad_campaigns')
      .select('advertiser_user_id')
      .eq('id', campaign_id)
      .single();

    if (!campaign || campaign.advertiser_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Create creative
    const { data: creative, error } = await supabase
      .from('ad_creatives')
      .insert({
        campaign_id,
        name,
        type,
        content,
        destination_url,
        cta_text
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ creative }, { status: 201 });
  } catch (error) {
    logger.error('Error creating creative:', error);
    return NextResponse.json(
      { error: 'Failed to create creative' },
      { status: 500 }
    );
  }
}
