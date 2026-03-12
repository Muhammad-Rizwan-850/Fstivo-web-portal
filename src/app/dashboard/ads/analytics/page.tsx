import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/secure-client';

export const metadata: Metadata = {
  title: 'Ad Analytics | FSTIVO',
  description: 'View your advertising performance analytics',
};

export default async function AdsAnalyticsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in to view your analytics.</div>;
  }

  // Get overall analytics for all campaigns
  const { data: campaigns } = await supabase
    .from('ad_campaigns')
    .select('*')
    .eq('advertiser_user_id', user.id);

  // Aggregate stats
  const totalCampaigns = campaigns?.length || 0;
  const activeCampaigns = campaigns?.filter((c: any) => c.status === 'active').length || 0;
  const totalBudget = campaigns?.reduce((sum: number, c: any) => sum + (c.total_budget || 0), 0) || 0;
  const totalSpent = campaigns?.reduce((sum: number, c: any) => sum + (c.spent_amount || 0), 0) || 0;

  // Get top performing campaigns
  const { data: topCampaigns } = await supabase
    .from('ad_campaigns')
    .select(`
      *,
      ad_creatives(*)
    `)
    .eq('advertiser_user_id', user.id)
    .eq('status', 'active')
    .order('spent_amount', { ascending: false })
    .limit(5);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Advertising Analytics</h1>
        <p className="text-gray-600 mt-2">Track your ad performance across all campaigns</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Campaigns"
          value={totalCampaigns}
          icon="📢"
          color="blue"
        />
        <StatCard
          title="Active Now"
          value={activeCampaigns}
          icon="▶️"
          color="green"
        />
        <StatCard
          title="Total Budget"
          value={`PKR ${totalBudget.toLocaleString()}`}
          icon="💰"
          color="purple"
        />
        <StatCard
          title="Total Spent"
          value={`PKR ${totalSpent.toLocaleString()}`}
          icon="💳"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Top Performing Campaigns */}
        <div className="col-span-2 bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Top Performing Campaigns</h2>
          </div>
          <div className="p-6">
            {topCampaigns && topCampaigns.length > 0 ? (
              <div className="space-y-4">
                {topCampaigns.map((campaign: any, index: number) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-gray-600">{campaign.campaign_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">PKR {campaign.spent_amount?.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">
                        {((campaign.spent_amount / campaign.total_budget) * 100).toFixed(1)}% utilized
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No active campaigns yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          <div className="p-6 space-y-3">
            <a
              href="/dashboard/ads/create"
              className="block px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium"
            >
              Create New Campaign
            </a>
            <a
              href="/dashboard/ads"
              className="block px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-center font-medium"
            >
              Manage Campaigns
            </a>
            <a
              href="/api/ads/report"
              target="_blank"
              className="block px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-center font-medium"
            >
              Download Report
            </a>
          </div>
        </div>
      </div>

      {/* Campaign Breakdown */}
      {campaigns && campaigns.length > 0 && (
        <div className="mt-8 bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Campaign Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.map((campaign: any) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <a
                        href={`/dashboard/ads/campaigns/${campaign.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {campaign.name}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">PKR {campaign.total_budget?.toLocaleString()}</td>
                    <td className="px-6 py-4">PKR {campaign.spent_amount?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min((campaign.spent_amount / campaign.total_budget) * 100, 100)}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {((campaign.spent_amount / campaign.total_budget) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200'
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
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
