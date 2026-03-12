import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Not registered as affiliate' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('affiliate_links')
      .select('*, event:events(*)')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ links: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch affiliate links' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event_id } = await req.json();

    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Not an active affiliate' },
        { status: 403 }
      );
    }

    // Generate unique tracking code
    const trackingCode = affiliate.affiliate_code + '_' + Date.now();
    const referralUrl = process.env.NEXT_PUBLIC_SITE_URL + '/events/' + event_id + '?ref=' + trackingCode;

    const { data, error } = await supabase
      .from('affiliate_links')
      .insert({
        affiliate_id: affiliate.id,
        event_id,
        tracking_code: trackingCode,
        referral_url: referralUrl,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create affiliate link' },
      { status: 500 }
    );
  }
}
