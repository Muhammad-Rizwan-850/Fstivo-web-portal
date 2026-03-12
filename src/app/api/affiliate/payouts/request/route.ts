import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
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

    // Check minimum payout threshold (PKR 1,000)
    const MIN_PAYOUT = 1000;
    if (affiliate.available_balance < MIN_PAYOUT) {
      return NextResponse.json(
        { error: 'Minimum payout amount is PKR ' + MIN_PAYOUT },
        { status: 400 }
      );
    }

    const { payment_method } = await req.json();

    const { data, error } = await supabase
      .from('affiliate_payouts')
      .insert({
        affiliate_id: affiliate.id,
        amount: affiliate.available_balance,
        payment_method,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Update affiliate balance
    await supabase
      .from('affiliates')
      .update({ available_balance: 0 })
      .eq('id', affiliate.id);

    return NextResponse.json({
      payout: data,
      message: 'Payout request submitted',
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to request payout' },
      { status: 500 }
    );
  }
}
