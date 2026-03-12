import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/secure-client';
import { AdCampaignFormContainer } from '@/components/features/ads/ad-campaign-form-container';

export const metadata: Metadata = {
  title: 'Create Ad Campaign | FSTIVO',
  description: 'Create a new advertising campaign',
};

export default async function CreateCampaignPage() {
  const supabase = await createServerClient();

  // Fetch available placements
  const { data: placements } = await supabase
    .from('ad_placements')
    .select('*')
    .eq('is_active', true)
    .order('base_price', { ascending: false });

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Ad Campaign</h1>
        <p className="text-gray-600 mt-2">Set up your new advertising campaign</p>
      </div>

      <div className="bg-white p-8 rounded-lg border border-gray-200">
        <AdCampaignFormContainer />
      </div>

      {/* Available Placements */}
      {placements && placements.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Available Ad Placements</h2>
          <div className="grid grid-cols-2 gap-4">
            {placements.map((placement: any) => (
              <div
                key={placement.id}
                className="p-4 bg-white border border-gray-200 rounded-lg"
              >
                <h3 className="font-semibold">{placement.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{placement.description}</p>
                <div className="flex justify-between text-sm">
                  <span>Dimensions: {placement.dimensions}</span>
                  <span className="font-semibold">
                    PKR {placement.base_price.toLocaleString()}/{placement.pricing_model}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
