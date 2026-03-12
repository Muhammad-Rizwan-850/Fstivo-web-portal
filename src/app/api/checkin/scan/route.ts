import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { qr_code, event_id } = await req.json();

    // Validate ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*, user:users(*)')
      .eq('qr_code', qr_code)
      .eq('event_id', event_id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Invalid ticket', success: false },
        { status: 404 }
      );
    }

    if (ticket.checked_in) {
      return NextResponse.json({
        success: false,
        message: 'Ticket already checked in',
        checked_in_at: ticket.checked_in_at,
      });
    }

    // Check in ticket
    const { data, error } = await supabase
      .from('tickets')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id,
      })
      .eq('id', ticket.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      ticket: data,
      message: 'Check-in successful',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Check-in failed' },
      { status: 500 }
    );
  }
}
