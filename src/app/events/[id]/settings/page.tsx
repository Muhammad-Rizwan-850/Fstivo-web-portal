import { Metadata } from 'next';
import { EventSettings } from '@/components/features/events/event-settings';

export const metadata: Metadata = {
  title: 'Event Settings | FSTIVO',
};

export default async function EventSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Event Settings</h1>
      <EventSettings eventId={id} />
    </div>
  );
}
