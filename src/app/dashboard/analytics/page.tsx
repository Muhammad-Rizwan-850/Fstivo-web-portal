import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Analytics | FSTIVO Dashboard',
  description: 'View your event analytics and insights',
};

export default async function AnalyticsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's events
  const { data: events } = await supabase
    .from('events')
    .select('id, title')
    .eq('organizer_id', user.id)
    .eq('status', 'published')
    .order('start_date', { ascending: false });

  // Get total stats
  const { count: totalEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('organizer_id', user.id);

  const { count: totalTickets } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .in(
      'event_id',
      events?.map((e: any) => e.id) || []
    );

  const { data: revenue } = await supabase
    .from('orders')
    .select('total')
    .in(
      'event_id',
      events?.map((e: any) => e.id) || []
    )
    .eq('status', 'completed');

  const totalRevenue = revenue?.reduce((sum: number, order: any) => sum + order.total, 0) || 0;

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track your event performance and insights
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Total Events</h3>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div className="mt-2 text-2xl font-bold">{totalEvents || 0}</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </div>

        <div className="rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Total Tickets Sold</h3>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="mt-2 text-2xl font-bold">{totalTickets || 0}</div>
          <p className="text-xs text-muted-foreground">Across all events</p>
        </div>

        <div className="rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Total Revenue</h3>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="mt-2 text-2xl font-bold">
            PKR {totalRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Gross revenue</p>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent Events</h2>
        {events && events.length > 0 ? (
          <div className="space-y-2">
            {events.slice(0, 5).map((event: any) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span className="font-medium">{event.title}</span>
                <a
                  href={'/events/' + event.id + '/analytics'}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Analytics →
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            No published events yet
          </p>
        )}
      </div>
    </div>
  );
}
