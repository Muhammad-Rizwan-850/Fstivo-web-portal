import { Metadata } from 'next';
import { CampaignForm } from '@/components/features/campaigns/campaign-form';

export const metadata: Metadata = {
  title: 'Create Campaign | FSTIVO',
};

export default async function CreateCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold">Create Email Campaign</h1>
        <CampaignForm eventId={id} />
      </div>
    </div>
  );
}
