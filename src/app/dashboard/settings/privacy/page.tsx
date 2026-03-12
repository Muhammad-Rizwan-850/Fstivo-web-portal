import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/secure-client';
import { redirect } from 'next/navigation';
import { PrivacySettingsForm } from '@/components/security/privacy-settings-form';
import { DataExportSection } from '@/components/security/data-export-section';
import { DataDeletionSection } from '@/components/security/data-deletion-section';

export const metadata: Metadata = {
  title: 'Privacy Settings | FSTIVO',
  description: 'Manage your privacy settings and data',
};

export default async function PrivacySettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get privacy settings
  const { data: settings } = await supabase
    .from('user_privacy_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Get consent history
  const { data: consentHistory } = await supabase
    .from('consent_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Privacy & Data</h1>
        <p className="text-gray-600">
          Manage your privacy settings and control your personal data
        </p>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Privacy Preferences</h2>
        </div>
        <div className="p-6">
          <PrivacySettingsForm settings={settings} userId={user.id} />
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Download Your Data</h2>
          <p className="text-sm text-gray-600 mt-1">
            Request a copy of your personal data (GDPR Article 20)
          </p>
        </div>
        <div className="p-6">
          <DataExportSection userId={user.id} />
        </div>
      </div>

      {/* Data Deletion */}
      <div className="bg-white rounded-lg shadow border-2 border-red-100">
        <div className="p-6 border-b bg-red-50">
          <h2 className="text-xl font-semibold text-red-900">Delete Your Data</h2>
          <p className="text-sm text-red-700 mt-1">
            Request deletion of your personal data (GDPR Article 17)
          </p>
        </div>
        <div className="p-6">
          <DataDeletionSection userId={user.id} />
        </div>
      </div>

      {/* Consent History */}
      {consentHistory && consentHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow mt-6">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Consent History</h2>
            <p className="text-sm text-gray-600 mt-1">
              View your consent and preference changes
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {consentHistory.map((consent: any) => (
                <div key={consent.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{consent.consent_type}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      consent.action === 'granted' ? 'bg-green-100 text-green-800' :
                      consent.action === 'revoked' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {consent.action}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(consent.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
