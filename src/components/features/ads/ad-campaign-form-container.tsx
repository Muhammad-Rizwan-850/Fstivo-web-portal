'use client';

import { AdCampaignForm } from './ad-campaign-form';
import { useRouter } from 'next/navigation';

export function AdCampaignFormContainer() {
  const router = useRouter();

  return (
    <AdCampaignForm
      onSuccess={() => {
        router.push('/dashboard/ads');
      }}
    />
  );
}
