import { Suspense } from 'react';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { EventSearchForm } from '@/components/features/events/event-search-form';
import { EventGrid } from '@/components/features/events/event-grid';
import { EventFilters } from '@/components/features/events/event-filters';

export const metadata: Metadata = {
  title: 'Search Events | FSTIVO',
  description: 'Find the perfect event in Pakistan',
};

export default async function EventSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; location?: string; date?: string }>;
}) {
  const params = await searchParams;
  const supabase = createClient();

  // Fetch categories
  const categories = [
    { id: '1', name: 'Conferences', slug: 'conference' },
    { id: '2', name: 'Workshops', slug: 'workshop' },
    { id: '3', name: 'Concerts', slug: 'concert' },
    { id: '4', name: 'Sports', slug: 'sports' },
  ];

  // Fetch events based on search params
  let query = supabase
    .from('events')
    .select('id, title, description, banner_url, start_date, location, category')
    .eq('status', 'published');

  if (params.q) {
    query = query.ilike('title', `%${params.q}%`);
  }
  if (params.category) {
    query = query.eq('category', params.category);
  }
  if (params.location) {
    query = query.ilike('location', `%${params.location}%`);
  }

  const { data: events } = await query.order('start_date', { ascending: true });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Search Events</h1>
        <p className="text-muted-foreground">
          Find events that match your interests
        </p>
      </div>

      <EventSearchForm initialParams={params} />

      <div className="mt-8 grid gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <EventFilters categories={categories} />
        </aside>

        <main className="lg:col-span-3">
          <Suspense fallback={<EventGridSkeleton />}>
            <EventGrid events={events || []} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function EventGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-96 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
      ))}
    </div>
  );
}
