import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticket_id, event_id, attendee_email } = await req.json();

    let ticket;

    if (ticket_id) {
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticket_id)
        .eq('event_id', event_id)
        .single();
      ticket = data;
    } else if (attendee_email) {
      const { data: attendee } = await supabase
        .from('users')
        .select('id')
        .eq('email', attendee_email)
        .single();

      if (attendee) {
        const { data } = await supabase
          .from('tickets')
          .select('*')
          .eq('user_id', attendee.id)
          .eq('event_id', event_id)
          .single();
        ticket = data;
      }
    }

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

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
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Manual check-in failed' },
      { status: 500 }
    );
  }
}
