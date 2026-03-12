// Event Summary Card Component
export interface EventSummaryCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    location: string;
    banner_url: string | null;
    capacity: number;
  };
}

export function EventSummaryCard({ event }: EventSummaryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {event.banner_url && (
        <img
          src={event.banner_url}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{event.title}</h3>
        <p className="text-gray-600 text-sm mt-2">{event.description}</p>
        <div className="mt-4 text-sm text-gray-500">
          <p>📅 {new Date(event.start_date).toLocaleDateString()}</p>
          <p>📍 {event.location}</p>
          <p>👥 Capacity: {event.capacity}</p>
        </div>
      </div>
    </div>
  );
}
