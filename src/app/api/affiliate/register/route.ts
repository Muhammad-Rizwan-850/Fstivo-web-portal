import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Check if already registered
    const { data: existing } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Already registered as affiliate' },
        { status: 400 }
      );
    }

    // Generate unique affiliate code
    const affiliateCode = 'AFF' + user.id.substring(0, 8).toUpperCase();

    const { data, error } = await supabase
      .from('affiliates')
      .insert({
        user_id: user.id,
        affiliate_code: affiliateCode,
        status: 'pending',
        ...body,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      affiliate: data,
      message: 'Affiliate application submitted for review',
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to register affiliate' },
      { status: 500 }
    );
  }
}
