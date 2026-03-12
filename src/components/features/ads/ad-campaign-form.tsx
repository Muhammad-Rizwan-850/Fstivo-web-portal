'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

interface AdCampaignFormProps {
  campaign?: any;
  onSuccess?: () => void;
}

export function AdCampaignForm({ campaign, onSuccess }: AdCampaignFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    description: campaign?.description || '',
    campaign_type: campaign?.campaign_type || 'banner',
    start_date: campaign?.start_date?.split('T')[0] || '',
    end_date: campaign?.end_date?.split('T')[0] || '',
    total_budget: campaign?.total_budget || '',
    daily_budget: campaign?.daily_budget || '',
    targeting: campaign?.targeting || {
      locations: [],
      categories: [],
      devices: []
    }
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = campaign ? `/api/ads/${campaign.id}` : '/api/ads';
      const method = campaign ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save campaign');
      }

      const data = await response.json();
      onSuccess?.();
      router.push(`/dashboard/ads/campaigns/${data.campaign.id}`);
    } catch (error) {
      logger.error('Error saving campaign:', error);
      alert('Failed to save campaign');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <label className="block text-sm font-medium mb-2">
          Campaign Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Summer Sale Campaign"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Campaign description..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Campaign Type *
        </label>
        <select
          required
          value={formData.campaign_type}
          onChange={(e) => setFormData({ ...formData, campaign_type: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="banner">Banner Ads</option>
          <option value="sponsored_event">Sponsored Event</option>
          <option value="newsletter">Newsletter</option>
          <option value="social">Social Media</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Start Date *
          </label>
          <input
            type="date"
            required
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            End Date *
          </label>
          <input
            type="date"
            required
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Total Budget (PKR) *
          </label>
          <input
            type="number"
            required
            min="1000"
            value={formData.total_budget}
            onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="10000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Daily Budget (PKR)
          </label>
          <input
            type="number"
            min="100"
            value={formData.daily_budget}
            onChange={(e) => setFormData({ ...formData, daily_budget: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="500"
          />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Targeting Options</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">
              Target Locations
            </label>
            <input
              type="text"
              placeholder="Lahore, Karachi, Islamabad..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Event Categories
            </label>
            <input
              type="text"
              placeholder="Music, Sports, Tech..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Devices
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Desktop
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Mobile
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Tablet
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
