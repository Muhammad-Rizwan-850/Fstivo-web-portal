import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: affiliate } = await (supabase as any)
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Not registered as affiliate' },
        { status: 404 }
      );
    }

    const resolvedParams = await params;
    const { data, error } = await (supabase as any)
      .from('affiliate_links')
      .select('*, event:events(*), metrics:affiliate_metrics(*)')
      .eq('id', resolvedParams.id)
      .eq('affiliate_id', affiliate.id)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Affiliate link not found' },
      { status: 404 }
    );
  }
}
