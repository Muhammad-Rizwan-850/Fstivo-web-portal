import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { QRCodeSystem } from '@/components/features/qr-code-system';
import { createClient } from '@/lib/supabase/server';

interface QRRegistrationPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: QRRegistrationPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const supabase = createClient();
    const { data: registration } = await supabase
      .from('registrations')
      .select(`
        event:events(title),
        user:user_profiles(full_name)
      `)
      .eq('id', id)
      .single();

    if (!registration) {
      return {
        title: 'Ticket Not Found | FSTIVO',
      };
    }

    return {
      title: `Ticket - ${registration.event?.title} | FSTIVO`,
      description: `Digital ticket for ${registration.user?.full_name} - ${registration.event?.title}`,
    };
  } catch (error) {
    return {
      title: 'Digital Ticket | FSTIVO',
    };
  }
}

export default async function QRRegistrationPage({ params, searchParams }: QRRegistrationPageProps) {
  const { id } = await params;
  const search = await searchParams;
  const tab = (search.tab as string) || 'ticket';

  // Verify the registration exists
  try {
    const supabase = createClient();
    const { data: registration } = await supabase
      .from('registrations')
      .select('id')
      .eq('id', id)
      .single();

    if (!registration) {
      notFound();
    }
  } catch (error) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <QRCodeSystem
          registrationId={id}
          initialTab={tab as 'ticket' | 'scanner' | 'manual'}
        />
      </div>
    </div>
  );
}