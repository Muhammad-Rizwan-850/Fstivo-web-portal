import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/secure-client';
import { PerformanceDashboard } from '@/components/features/ads/performance-dashboard';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: campaign } = await supabase
    .from('ad_campaigns')
    .select('name')
    .eq('id', id)
    .single();

  return {
    title: `${campaign?.name || 'Campaign'} | FSTIVO`,
    description: 'Campaign details and analytics',
  };
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: campaign } = await supabase
    .from('ad_campaigns')
    .select(`
      *,
      ad_creatives(*),
      ad_serving(*, placement:ad_placements(*))
    `)
    .eq('id', id)
    .single();

  if (!campaign) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-800 mb-2">Campaign Not Found</h1>
          <p className="text-red-600">The requested campaign does not exist.</p>
          <a
            href="/dashboard/ads"
            className="inline-block mt-4 text-blue-600 hover:text-blue-700"
          >
            ← Back to Campaigns
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{campaign.name}</h1>
          <p className="text-gray-600">{campaign.description}</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/dashboard/ads"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back to List
          </a>
          {campaign.status === 'active' && (
            <button
              onClick={() => fetch(`/api/ads/${id}/pause`, { method: 'POST' })}
              className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
            >
              Pause Campaign
            </button>
          )}
        </div>
      </div>

      {/* Campaign Info */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <InfoCard
          title="Status"
          value={campaign.status}
          icon="📊"
        />
        <InfoCard
          title="Budget"
          value={`PKR ${campaign.total_budget?.toLocaleString()}`}
          icon="💰"
        />
        <InfoCard
          title="Spent"
          value={`PKR ${campaign.spent_amount?.toLocaleString()}`}
          icon="💳"
        />
        <InfoCard
          title="Start Date"
          value={new Date(campaign.start_date).toLocaleDateString()}
          icon="📅"
        />
        <InfoCard
          title="End Date"
          value={new Date(campaign.end_date).toLocaleDateString()}
          icon="📅"
        />
        <InfoCard
          title="Type"
          value={campaign.campaign_type}
          icon="🎯"
        />
      </div>

      {/* Performance Dashboard */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Performance Analytics</h2>
        <PerformanceDashboard campaignId={id} />
      </div>

      {/* Creatives */}
      {campaign.ad_creatives && campaign.ad_creatives.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Ad Creatives</h2>
          <div className="grid grid-cols-2 gap-4">
            {campaign.ad_creatives.map((creative: any) => (
              <div
                key={creative.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h3 className="font-semibold mb-2">{creative.name}</h3>
                <p className="text-sm text-gray-600 mb-2">Type: {creative.type}</p>
                {creative.cta_text && (
                  <p className="text-sm">CTA: {creative.cta_text}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Placements */}
      {campaign.ad_serving && campaign.ad_serving.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Active Placements</h2>
          <div className="space-y-3">
            {campaign.ad_serving.map((serving: any) => (
              <div
                key={serving.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <div>
                  <h3 className="font-semibold">{serving.placement.name}</h3>
                  <p className="text-sm text-gray-600">{serving.placement.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Priority: {serving.priority}</p>
                  <p className="text-sm text-gray-600">{serving.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface InfoCardProps {
  title: string;
  value: string;
  icon: string;
}

function InfoCard({ title, value, icon }: InfoCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}
