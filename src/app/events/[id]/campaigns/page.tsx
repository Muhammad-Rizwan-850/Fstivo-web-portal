import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CampaignList } from '@/components/features/campaigns/campaign-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Email Campaigns | FSTIVO',
};

export default async function EventCampaignsPage({
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
    redirect(`/login?redirect=/events/${id}/campaigns`);
  }

  const { data: campaigns } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('event_id', id)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your event email campaigns
          </p>
        </div>
        <Link href={`/events/${id}/campaigns/create`}>
          <Button>Create Campaign</Button>
        </Link>
      </div>

      <CampaignList campaigns={campaigns || []} />
    </div>
  );
}
