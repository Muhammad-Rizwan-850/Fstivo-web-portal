'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { logger } from '@/lib/logger';

export function CookieConsentBanner() {
  const [show, setShow] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  async function handleAcceptAll() {
    const consent = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      version: '1.0',
      timestamp: new Date().toISOString()
    };

    await saveCookieConsent(consent);
    setShow(false);
  }

  async function handleRejectAll() {
    const consent = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      version: '1.0',
      timestamp: new Date().toISOString()
    };

    await saveCookieConsent(consent);
    setShow(false);
  }

  async function handleSavePreferences() {
    const consent = {
      ...preferences,
      version: '1.0',
      timestamp: new Date().toISOString()
    };

    await saveCookieConsent(consent);
    setShow(false);
  }

  async function saveCookieConsent(consent: any) {
    // Save to localStorage
    localStorage.setItem('cookie_consent', JSON.stringify(consent));

    // Save to backend
    try {
      await fetch('/api/privacy/cookie-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consent)
      });
    } catch (error) {
      logger.error('Error saving cookie consent:', error);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 shadow-2xl">
      <div className="container mx-auto px-6 py-6">
        {!showDetails ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">🍪 We use cookies</h3>
              <p className="text-sm text-gray-600">
                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                By clicking "Accept All", you consent to our use of cookies.{' '}
                <a href="/legal/privacy" className="text-blue-600 hover:underline">
                  Read our Privacy Policy
                </a>
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowDetails(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Customize
              </button>
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Cookie Preferences</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <CookieOption
                title="Necessary Cookies"
                description="Required for the website to function. Cannot be disabled."
                checked={preferences.necessary}
                disabled={true}
              />

              <CookieOption
                title="Functional Cookies"
                description="Enable enhanced functionality and personalization."
                checked={preferences.functional}
                onChange={(checked) => setPreferences({ ...preferences, functional: checked })}
              />

              <CookieOption
                title="Analytics Cookies"
                description="Help us understand how visitors interact with our website."
                checked={preferences.analytics}
                onChange={(checked) => setPreferences({ ...preferences, analytics: checked })}
              />

              <CookieOption
                title="Marketing Cookies"
                description="Used to track visitors across websites to display relevant ads."
                checked={preferences.marketing}
                onChange={(checked) => setPreferences({ ...preferences, marketing: checked })}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Reject All
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CookieOptionProps {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

function CookieOption({ title, description, checked, disabled = false, onChange }: CookieOptionProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1"
      />
      <div className="flex-1">
        <div className="font-medium mb-1">{title}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
    </div>
  );
}
