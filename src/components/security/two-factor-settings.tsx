'use client';

import { useState } from 'react';
import { Shield, Smartphone, Check, X } from 'lucide-react';

interface TwoFactorSettingsProps {
  twoFactor: any;
  userId: string;
}

export function TwoFactorSettings({ twoFactor, userId }: TwoFactorSettingsProps) {
  const [showSetup, setShowSetup] = useState(false);

  if (!twoFactor || !twoFactor.is_enabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">2FA is Not Enabled</h3>
            <p className="text-sm text-gray-600">Secure your account by enabling two-factor authentication</p>
          </div>
          <button
            onClick={() => setShowSetup(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Enable 2FA
          </button>
        </div>

        {showSetup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <TwoFactorSetupContent
                onComplete={() => {
                  setShowSetup(false);
                  window.location.reload();
                }}
                onCancel={() => setShowSetup(false)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
        <Shield className="w-6 h-6 text-green-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-green-900">2FA Enabled</h3>
          <p className="text-sm text-green-700">
            Method: {twoFactor.method === 'authenticator' ? 'Authenticator App' : 'SMS'}
          </p>
        </div>
        <Check className="w-6 h-6 text-green-600" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Last Used</p>
          <p className="font-semibold">
            {twoFactor.last_used_at
              ? new Date(twoFactor.last_used_at).toLocaleDateString()
              : 'Never'}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Backup Codes Remaining</p>
          <p className="font-semibold">
            {10 - (twoFactor.backup_codes_used || 0)} / 10
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
          Regenerate Backup Codes
        </button>
        <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm">
          Disable 2FA
        </button>
      </div>
    </div>
  );
}

// Simplified version of TwoFactorSetup for use within this component
function TwoFactorSetupContent({ onComplete, onCancel }: { onComplete?: () => void; onCancel?: () => void }) {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Enable Two-Factor Authentication</h2>
      <p className="text-gray-600 mb-6">Choose your preferred 2FA method</p>

      <div className="space-y-4">
        <button className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 text-left">
          <div className="flex items-center gap-4">
            <Smartphone className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold">Authenticator App</h3>
              <p className="text-sm text-gray-600">Use Google Authenticator or similar</p>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
