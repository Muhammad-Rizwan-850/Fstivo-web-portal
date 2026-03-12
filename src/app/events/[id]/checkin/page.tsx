import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CheckInDashboard } from '@/components/features/checkin/checkin-dashboard';

export const metadata: Metadata = {
  title: 'Check-In Dashboard | FSTIVO',
};

export default async function EventCheckInPage({
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
    redirect(`/login?redirect=/events/${id}/checkin`);
  }

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (!event) {
    notFound();
  }

  // Check if user is organizer or volunteer
  if (event.organizer_id !== user.id) {
    const { data: volunteer } = await supabase
      .from('volunteers')
      .select('*')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .single();

    if (!volunteer) {
      redirect('/dashboard?error=not_authorized');
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CheckInDashboard eventId={id} />
    </div>
  );
}
