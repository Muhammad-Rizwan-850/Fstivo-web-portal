import { Metadata } from 'next';
import { QRCodeSystem } from '@/components/features/qr-code-system';

export const metadata: Metadata = {
  title: 'QR Code System | FSTIVO',
  description: 'Digital tickets and QR code check-in system for events',
};

interface QRPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function QRPage({ searchParams }: QRPageProps) {
  const params = await searchParams;
  const tab = (params.tab as string) || 'ticket';
  const registrationId = params.id as string;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Event Check-in System
          </h1>
          <p className="text-gray-600">
            Digital tickets and QR code scanning for seamless event check-ins
          </p>
        </div>

        <QRCodeSystem
          registrationId={registrationId}
          initialTab={tab as 'ticket' | 'scanner' | 'manual'}
        />
      </div>
    </div>
  );
}