import { Metadata } from 'next';
import { ManualCheckIn } from '@/components/features/checkin/manual-checkin';

export const metadata: Metadata = {
  title: 'Manual Check-In | FSTIVO',
};

export default async function ManualCheckInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold">Manual Check-In</h1>
        <ManualCheckIn eventId={id} />
      </div>
    </div>
  );
}
