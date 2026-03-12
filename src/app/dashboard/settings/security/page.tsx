import { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/secure-client';
import { redirect } from 'next/navigation';
import { TwoFactorSettings } from '@/components/security/two-factor-settings';
import { TrustedDevicesList } from '@/components/security/trusted-devices-list';
import { SecurityActivityLog } from '@/components/security/security-activity-log';

export const metadata: Metadata = {
  title: 'Security Settings | FSTIVO',
  description: 'Manage your account security',
};

export default async function SecuritySettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get 2FA status
  const { data: twoFactor } = await supabase
    .from('user_two_factor')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Get trusted devices
  const { data: devices } = await supabase
    .from('trusted_devices')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_trusted', true)
    .order('last_used_at', { ascending: false });

  // Get recent security logs
  const { data: securityLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', user.id)
    .or('action.eq.2fa_enabled,action.eq.2fa_disabled,action.eq.login,action.eq.failed_login,action.eq.password_changed')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Security Settings</h1>
        <p className="text-gray-600">
          Manage your account security and authentication methods
        </p>
      </div>

      {/* Security Score */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg text-white p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Security Score</h3>
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold">{calculateSecurityScore(twoFactor)}%</div>
              <div className="text-sm opacity-90">
                {twoFactor?.is_enabled ? 'Excellent' : 'Good'}
              </div>
            </div>
          </div>
          <div className="text-6xl opacity-20">🛡️</div>
        </div>
        {!twoFactor?.is_enabled && (
          <div className="mt-4 pt-4 border-t border-blue-400">
            <p className="text-sm opacity-90">
              💡 Enable two-factor authentication to increase your security score to 100%
            </p>
          </div>
        )}
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
          <p className="text-sm text-gray-600 mt-1">
            Add an extra layer of security to your account
          </p>
        </div>
        <div className="p-6">
          <TwoFactorSettings twoFactor={twoFactor} userId={user.id} />
        </div>
      </div>

      {/* Trusted Devices */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Trusted Devices</h2>
          <p className="text-sm text-gray-600 mt-1">
            Devices where you won't need 2FA for 30 days
          </p>
        </div>
        <div className="p-6">
          <TrustedDevicesList devices={devices || []} userId={user.id} />
        </div>
      </div>

      {/* Security Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Security Activity</h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitor login attempts and security events
          </p>
        </div>
        <div className="p-6">
          <SecurityActivityLog userId={user.id} />
        </div>
      </div>
    </div>
  );
}

function calculateSecurityScore(twoFactor: any): number {
  let score = 60; // Base score

  if (twoFactor?.is_enabled) {
    score += 40; // 2FA adds 40 points
  }

  return score;
}
