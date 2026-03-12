'use client';

// =====================================================
// PWA INSTALL PROMPT COMPONENT
// =====================================================
// Shows a custom install prompt when PWA can be installed
// =====================================================

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { usePwa } from '@/lib/pwa-utils';

export function PwaInstallPrompt(): React.ReactElement | null {
  const { canInstall, install } = usePwa();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show prompt if user hasn't dismissed it
    const hasDismissed = localStorage.getItem('pwa-install-dismissed');
    let timer: number | undefined;
    if (!hasDismissed && canInstall) {
      // Show prompt after 3 seconds
      timer = window.setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [canInstall]);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || dismissed || !canInstall) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-6 text-white">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Install FSTIVO</h3>
            <p className="text-sm text-white/90 mb-4">
              Install our app for the best experience with offline access and push notifications.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleInstall}
                className="flex-1 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-white/90 transition-colors"
              >
                Install Now
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-white/80 hover:text-white transition-colors text-sm font-semibold"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
