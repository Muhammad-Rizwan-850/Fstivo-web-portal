import { Metadata } from 'next';
import { AttendeeList } from '@/components/features/attendees/attendee-list';

export const metadata: Metadata = {
  title: 'Attendees | FSTIVO',
};

export default async function EventAttendeesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Event Attendees</h1>
      <AttendeeList eventId={id} />
    </div>
  );
}
