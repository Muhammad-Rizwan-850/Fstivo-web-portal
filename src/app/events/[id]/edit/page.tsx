import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EventEditForm } from '@/components/features/events/event-edit-form';

export const metadata: Metadata = {
  title: 'Edit Event | FSTIVO',
};

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/events/${id}/edit`);
  }

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !event) {
    notFound();
  }

  // Check ownership
  if (event.organizer_id !== user.id) {
    redirect('/dashboard?error=not_authorized');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Edit Event</h1>
        <p className="text-muted-foreground">
          Update your event details
        </p>
      </div>

      <EventEditForm eventId={id} />
    </div>
  );
}
