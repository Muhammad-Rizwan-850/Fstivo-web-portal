// Event Grid Component - Displays events in a grid layout
import { EventCard } from './event-card';

export interface EventGridProps {
  events: Array<{
    id: string;
    title: string;
    description: string;
    banner_url: string | null;
    start_date: string;
    location: string;
    category: string;
  }>;
  loading?: boolean;
}

export function EventGrid({ events, loading }: EventGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No events found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
