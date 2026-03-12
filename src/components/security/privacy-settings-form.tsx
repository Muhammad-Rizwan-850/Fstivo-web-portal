'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

interface PrivacySettingsFormProps {
  settings: any;
  userId: string;
}

export function PrivacySettingsForm({ settings, userId }: PrivacySettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    marketing_emails: settings?.marketing_emails || false,
    analytics_tracking: settings?.analytics_tracking || true,
    personalized_ads: settings?.personalized_ads || false,
    data_sharing: settings?.data_sharing || false,
    profile_visibility: settings?.profile_visibility || 'public',
    show_activity: settings?.show_activity || true,
    show_location: settings?.show_location || false,
    allow_search_indexing: settings?.allow_search_indexing || true
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/privacy/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update settings');

      alert('Privacy settings updated successfully');
      router.refresh();
    } catch (error) {
      logger.error('Error updating settings:', error);
      alert('Failed to update settings');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Communications</h3>
        <div className="space-y-3">
          <ToggleOption
            label="Marketing Emails"
            description="Receive emails about new features, events, and promotions"
            checked={formData.marketing_emails}
            onChange={(checked) => setFormData({ ...formData, marketing_emails: checked })}
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Data Usage</h3>
        <div className="space-y-3">
          <ToggleOption
            label="Analytics Tracking"
            description="Help us improve by allowing anonymous usage data collection"
            checked={formData.analytics_tracking}
            onChange={(checked) => setFormData({ ...formData, analytics_tracking: checked })}
          />
          <ToggleOption
            label="Personalized Ads"
            description="See ads tailored to your interests"
            checked={formData.personalized_ads}
            onChange={(checked) => setFormData({ ...formData, personalized_ads: checked })}
          />
          <ToggleOption
            label="Data Sharing"
            description="Allow sharing anonymized data with partners"
            checked={formData.data_sharing}
            onChange={(checked) => setFormData({ ...formData, data_sharing: checked })}
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Profile Visibility</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">
              Who can see your profile?
            </label>
            <select
              value={formData.profile_visibility}
              onChange={(e) => setFormData({ ...formData, profile_visibility: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="public">Everyone</option>
              <option value="connections">Connections only</option>
              <option value="private">Only me</option>
            </select>
          </div>

          <ToggleOption
            label="Show Activity"
            description="Let others see your event registrations and activity"
            checked={formData.show_activity}
            onChange={(checked) => setFormData({ ...formData, show_activity: checked })}
          />
          <ToggleOption
            label="Show Location"
            description="Display your city/region on your profile"
            checked={formData.show_location}
            onChange={(checked) => setFormData({ ...formData, show_location: checked })}
          />
          <ToggleOption
            label="Allow Search Indexing"
            description="Let search engines find your public profile"
            checked={formData.allow_search_indexing}
            onChange={(checked) => setFormData({ ...formData, allow_search_indexing: checked })}
          />
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

interface ToggleOptionProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleOption({ label, description, checked, onChange }: ToggleOptionProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1"
      />
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
    </div>
  );
}
