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

    const { data: commissions, error } = await supabase
      .from('affiliate_commissions')
      .select('*, order:orders(*)')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalEarnings = commissions?.reduce((sum: number, c: any) => sum + c.amount, 0) || 0;
    const pendingEarnings = commissions
      ?.filter((c: any) => c.status === 'pending')
      .reduce((sum: number, c: any) => sum + c.amount, 0) || 0;
    const paidEarnings = commissions
      ?.filter((c: any) => c.status === 'paid')
      .reduce((sum: number, c: any) => sum + c.amount, 0) || 0;

    return NextResponse.json({
      total_earnings: totalEarnings,
      pending_earnings: pendingEarnings,
      paid_earnings: paidEarnings,
      commissions,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}
