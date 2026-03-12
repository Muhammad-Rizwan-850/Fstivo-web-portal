import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CampaignDetails } from '@/components/features/campaigns/campaign-details';

export const metadata: Metadata = {
  title: 'Campaign Details | FSTIVO',
};

export default async function CampaignDetailsPage({
  params,
}: {
  params: Promise<{ id: string; campaignId: string }>;
}) {
  const supabase = createClient();
  const { id, campaignId } = await params;

  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*, audience:audiences(*)')
    .eq('id', campaignId)
    .eq('event_id', id)
    .single();

  if (!campaign) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CampaignDetails campaignId={campaignId} />
    </div>
  );
}
