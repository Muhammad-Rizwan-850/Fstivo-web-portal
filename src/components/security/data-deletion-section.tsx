'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface DataDeletionSectionProps {
  userId: string;
}

export function DataDeletionSection({ userId }: DataDeletionSectionProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  async function handleRequestDeletion() {
    if (!reason.trim()) {
      alert('Please provide a reason for deletion request');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/privacy/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) throw new Error('Failed to request deletion');

      alert('Deletion request submitted! You will receive a confirmation email.');
      setReason('');
    } catch (error) {
      logger.error('Error requesting deletion:', error);
      alert('Failed to request deletion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="text-sm text-red-900">
            <p className="font-medium mb-1">⚠️ Warning: This action cannot be undone</p>
            <p>
              Once your data is deleted, it cannot be recovered. You will have a 30-day grace period
              to cancel this request.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Reason for deletion (required)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please tell us why you want to delete your data..."
          rows={4}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <button
        onClick={handleRequestDeletion}
        disabled={loading || !reason.trim()}
        className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Request Data Deletion'}
      </button>

      <p className="text-xs text-gray-600 text-center">
        Your request will be reviewed and processed within 30 days. You will receive an email confirmation.
      </p>
    </div>
  );
}
