import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { new_plan_id } = await req.json();

    if (!new_plan_id) {
      return NextResponse.json(
        { error: 'New plan ID required' },
        { status: 400 }
      );
    }

    // Get current subscription
    const { data: current } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!current) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Update to new plan
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        plan_id: new_plan_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', current.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      subscription: data,
      message: 'Plan upgraded successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upgrade plan' },
      { status: 500 }
    );
  }
}
