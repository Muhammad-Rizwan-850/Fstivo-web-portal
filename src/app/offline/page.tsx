'use client';

// =====================================================
// OFFLINE PAGE - PWA FEATURE
// =====================================================
// Shown when user has no internet connection
// =====================================================

import React from 'react';
import { WifiOff, RefreshCw, Home, Calendar, Ticket } from 'lucide-react';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-8">
            <WifiOff className="w-12 h-12 text-white" />
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            You're Offline
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            No worries! You can still browse cached content. Check your internet connection to access all features.
          </p>

          {/* Retry Button */}
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all hover:scale-105 active:scale-95 mb-12"
          >
            <RefreshCw className="w-5 h-5" />
            Retry Connection
          </button>

          {/* Available Offline Features */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Available Offline
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cached Events */}
              <div className="bg-blue-50 rounded-xl p-6 text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Cached Events</h3>
                <p className="text-sm text-gray-600">
                  View events you've recently browsed
                </p>
              </div>

              {/* My Tickets */}
              <div className="bg-purple-50 rounded-xl p-6 text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-lg mb-4">
                  <Ticket className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">My Tickets</h3>
                <p className="text-sm text-gray-600">
                  Access your saved tickets anytime
                </p>
              </div>

              {/* App Navigation */}
              <div className="bg-green-50 rounded-xl p-6 text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-lg mb-4">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">App Navigation</h3>
                <p className="text-sm text-gray-600">
                  Navigate the app interface
                </p>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-gray-50 rounded-xl p-6 text-left">
            <h3 className="font-bold text-gray-900 mb-3">
              What happens when I'm offline?
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Any registrations you make will be saved and synced automatically when you reconnect</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Your tickets are cached and can be accessed offline</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Recently viewed events are available for offline browsing</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>FSTIVO - University Event Platform</p>
          <p className="mt-1">© 2024 All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
