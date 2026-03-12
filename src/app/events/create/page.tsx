import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EventCreationWizard } from '@/components/features/event-creation-wizard';

export const metadata: Metadata = {
  title: 'Create Event | FSTIVO',
  description: 'Create a new event',
};

export default async function CreateEventPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/events/create');
  }

  // Check if user is organizer
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'organizer') {
    redirect('/dashboard?error=organizer_only');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Create New Event</h1>
        <p className="text-muted-foreground">
          Fill in the details to create your event
        </p>
      </div>

      <EventCreationWizard />
    </div>
  );
}
