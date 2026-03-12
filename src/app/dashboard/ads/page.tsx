import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/secure-client';

export const metadata: Metadata = {
  title: 'Ad Campaigns | FSTIVO',
  description: 'Manage your advertising campaigns',
};

export default async function AdsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in to view your campaigns.</div>;
  }

  const { data: campaigns } = await supabase
    .from('ad_campaigns')
    .select(`
      *,
      ad_creatives(count),
      ad_serving(count)
    `)
    .eq('advertiser_user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Advertising Campaigns</h1>
          <p className="text-gray-600 mt-2">Manage and monitor your ad campaigns</p>
        </div>
        <a
          href="/dashboard/ads/create"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Create Campaign
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Campaigns"
          value={campaigns?.length || 0}
          icon="📢"
        />
        <StatCard
          title="Active Campaigns"
          value={campaigns?.filter((c: any) => c.status === 'active').length || 0}
          icon="▶️"
        />
        <StatCard
          title="Total Spend"
          value={`PKR ${campaigns?.reduce((sum: number, c: any) => sum + (c.spent_amount || 0), 0).toLocaleString()}`}
          icon="💰"
        />
        <StatCard
          title="Avg. CTR"
          value="2.4%"
          icon="📊"
        />
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Your Campaigns</h2>
        </div>

        {campaigns && campaigns.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {campaigns.map((campaign: any) => (
              <CampaignRow key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">No campaigns yet</p>
            <a
              href="/dashboard/ads/create"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first campaign →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center gap-4">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface CampaignRowProps {
  campaign: any;
}

function CampaignRow({ campaign }: CampaignRowProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-gray-100 text-gray-800',
    draft: 'bg-blue-100 text-blue-800'
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">{campaign.name}</h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                statusColors[campaign.status as keyof typeof statusColors]
              }`}
            >
              {campaign.status}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-3">{campaign.description}</p>
          <div className="flex gap-6 text-sm text-gray-600">
            <span>Type: {campaign.campaign_type}</span>
            <span>Budget: PKR {campaign.total_budget?.toLocaleString()}</span>
            <span>Spent: PKR {campaign.spent_amount?.toLocaleString()}</span>
            <span>
              {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`/dashboard/ads/campaigns/${campaign.id}`}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            View Details
          </a>
          {campaign.status === 'active' ? (
            <button
              onClick={() => fetch(`/api/ads/${campaign.id}/pause`, { method: 'POST' })}
              className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 text-sm"
            >
              Pause
            </button>
          ) : campaign.status === 'paused' ? (
            <button
              onClick={() => fetch(`/api/ads/${campaign.id}/resume`, { method: 'POST' })}
              className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 text-sm"
            >
              Resume
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
