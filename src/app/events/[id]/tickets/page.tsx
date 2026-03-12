import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TicketSelector } from '@/components/features/ticketing/ticket-selector';
import { EventSummaryCard } from '@/components/features/events/event-summary-card';

export const metadata: Metadata = {
  title: 'Buy Tickets | FSTIVO',
};

export default async function EventTicketsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createClient();

  const { data: event, error } = await supabase
    .from('events')
    .select('*, organizer:users(*), tiers:ticket_tiers(*)')
    .eq('id', id)
    .single();

  if (error || !event) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="mb-6 text-3xl font-bold">Select Tickets</h1>
          <TicketSelector event={event} tiers={event.tiers} />
        </div>

        <div className="lg:col-span-1">
          <EventSummaryCard event={event} />
        </div>
      </div>
    </div>
  );
}
