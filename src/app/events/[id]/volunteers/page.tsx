import { Metadata } from 'next';
import { VolunteerManagement } from '@/components/features/volunteers/volunteer-management';

export const metadata: Metadata = {
  title: 'Manage Volunteers | FSTIVO',
};

export default async function EventVolunteersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Manage Volunteers</h1>
      <VolunteerManagement eventId={id} />
    </div>
  );
}
