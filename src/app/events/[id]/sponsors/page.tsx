import { Metadata } from 'next';
import { SponsorManagement } from '@/components/features/sponsors/sponsor-management';

export const metadata: Metadata = {
  title: 'Manage Sponsors | FSTIVO',
};

export default async function EventSponsorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Manage Sponsors</h1>
      <SponsorManagement eventId={id} />
    </div>
  );
}
