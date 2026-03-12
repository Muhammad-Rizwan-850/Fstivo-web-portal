import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SeatingChartViewer } from '@/components/features/seating/seating-chart-viewer';
import { SeatSelection } from '@/components/features/seating/seat-selection';

export const metadata: Metadata = {
  title: 'Select Seats | FSTIVO',
};

export default async function EventSeatingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createClient();

  const { data: event } = await supabase
    .from('events')
    .select('*, venue:venues(*), chart:seating_charts(*)')
    .eq('id', id)
    .single();

  if (!event || !event.chart) {
    notFound();
  }

  const { data: sections } = await supabase
    .from('seating_sections')
    .select('*, seats(*)')
    .eq('chart_id', event.chart.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Select Your Seats</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SeatingChartViewer
            chart={event.chart}
            sections={sections || []}
          />
        </div>

        <div className="lg:col-span-1">
          <SeatSelection eventId={id} />
        </div>
      </div>
    </div>
  );
}
