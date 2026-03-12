import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { ad_id, user_id, page } = await req.json();

    if (!ad_id) {
      return NextResponse.json({ error: 'Ad ID required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Record click
    await (supabase as any).from('ad_clicks').insert({
      ad_id,
      user_id: user_id || null,
      page,
      timestamp: new Date().toISOString(),
    });

    // Update metrics
    await (supabase as any).rpc('increment_ad_clicks', { ad_id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to record click' },
      { status: 500 }
    );
  }
}
