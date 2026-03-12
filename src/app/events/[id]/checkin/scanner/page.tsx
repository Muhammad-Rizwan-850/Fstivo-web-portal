import { Metadata } from 'next';
import { QRScanner } from '@/components/features/checkin/qr-scanner';

export const metadata: Metadata = {
  title: 'QR Scanner | FSTIVO',
};

export default async function QRScannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold">Scan Tickets</h1>
        <QRScanner eventId={id} />
      </div>
    </div>
  );
}
