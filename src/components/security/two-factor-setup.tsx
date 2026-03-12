'use client';

import { useState } from 'react';
import { Shield, Smartphone, Mail, Copy, Check } from 'lucide-react';
import { logger } from '@/lib/logger';

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'choose' | 'authenticator' | 'sms' | 'verify' | 'backup'>('choose');
  const [method, setMethod] = useState<'authenticator' | 'sms'>('authenticator');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleChooseMethod(selectedMethod: 'authenticator' | 'sms') {
    setMethod(selectedMethod);
    setLoading(true);

    try {
      if (selectedMethod === 'authenticator') {
        const response = await fetch('/api/auth/2fa/setup-authenticator', {
          method: 'POST'
        });
        const data = await response.json();
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
        setStep('authenticator');
      } else {
        setStep('sms');
      }
    } catch (error) {
      logger.error('Error setting up 2FA:', error);
      alert('Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendSMS() {
    setLoading(true);
    try {
      await fetch('/api/auth/2fa/setup-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      setStep('verify');
    } catch (error) {
      logger.error('Error sending SMS:', error);
      alert('Failed to send verification code');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setLoading(true);
    try {
      const endpoint = method === 'authenticator'
        ? '/api/auth/2fa/verify-authenticator'
        : '/api/auth/2fa/verify-sms';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode })
      });

      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setStep('backup');
    } catch (error) {
      logger.error('Error verifying code:', error);
      alert('Invalid verification code');
    } finally {
      setLoading(false);
    }
  }

  function copySecret() {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  }

  function downloadBackupCodes() {
    const content = `FSTIVO Backup Codes
Generated: ${new Date().toISOString()}

Keep these codes safe! Each code can only be used once.

${backupCodes.join('\n')}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fstivo-backup-codes.txt';
    a.click();
  }

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-2xl mx-auto p-8">
      {/* Choose Method */}
      {step === 'choose' && (
        <div>
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Enable Two-Factor Authentication</h2>
            <p className="text-gray-600">
              Add an extra layer of security to your account
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleChooseMethod('authenticator')}
              disabled={loading}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="flex items-start gap-4">
                <Smartphone className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Authenticator App</h3>
                  <p className="text-sm text-gray-600">
                    Use an app like Google Authenticator, Authy, or 1Password to generate verification codes.
                  </p>
                  <span className="text-sm text-blue-600 font-medium mt-2 inline-block">
                    Recommended →
                  </span>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleChooseMethod('sms')}
              disabled={loading}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="flex items-start gap-4">
                <Mail className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">SMS Verification</h3>
                  <p className="text-sm text-gray-600">
                    Receive verification codes via SMS to your mobile phone.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Authenticator Setup */}
      {step === 'authenticator' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Set Up Authenticator App</h2>

          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-4">Step 1: Scan QR Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Open your authenticator app and scan this QR code:
              </p>
              {qrCodeUrl && (
                <div className="bg-white p-4 inline-block rounded-lg">
                  <QRCodeURL url={qrCodeUrl} />
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-4">Step 2: Or Enter Key Manually</h3>
              <p className="text-sm text-gray-600 mb-4">
                If you can't scan the QR code, enter this key in your app:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-4 py-3 rounded border font-mono text-sm break-all">
                  {secret}
                </code>
                <button
                  onClick={copySecret}
                  className="p-3 bg-white border rounded hover:bg-gray-50"
                >
                  {copiedSecret ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Step 3: Enter Verification Code</h3>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setStep('choose')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      )}

      {/* SMS Setup */}
      {step === 'sms' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Set Up SMS Verification</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full px-4 py-3 border rounded-lg"
              />
              <p className="text-sm text-gray-600 mt-2">
                Include country code (e.g., +92 for Pakistan)
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setStep('choose')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSendSMS}
              disabled={loading || !phoneNumber}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </div>
        </div>
      )}

      {/* Verify */}
      {step === 'verify' && method === 'sms' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Enter Verification Code</h2>

          <p className="text-gray-600 mb-6">
            We've sent a 6-digit code to <strong>{phoneNumber}</strong>
          </p>

          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            maxLength={6}
            className="w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest"
          />

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setStep('sms')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      )}

      {/* Backup Codes */}
      {step === 'backup' && (
        <div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">2FA Enabled Successfully!</h2>
            <p className="text-gray-600">
              Save your backup codes in a safe place
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important</h3>
            <p className="text-sm text-yellow-800">
              Save these backup codes now. You won't be able to see them again!
              Each code can only be used once.
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-3">
              {backupCodes.map((code, index) => (
                <code key={index} className="bg-white px-4 py-2 rounded border text-center font-mono">
                  {code}
                </code>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadBackupCodes}
              className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Download Codes
            </button>
            <button
              onClick={onComplete}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple QR code URL display component
function QRCodeURL({ url }: { url: string }) {
  // For production, use a proper QR code library
  // For now, just display the URL
  return (
    <div className="text-sm">
      <p className="font-mono break-all max-w-xs">{url}</p>
    </div>
  );
}
