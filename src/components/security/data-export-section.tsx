'use client';

import { useState } from 'react';
import { Download, FileText, Clock } from 'lucide-react';
import { logger } from '@/lib/logger';

interface DataExportSectionProps {
  userId: string;
}

export function DataExportSection({ userId }: DataExportSectionProps) {
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState<'full_export' | 'personal_data' | 'activity_logs' | 'transactions'>('full_export');

  async function handleRequestExport() {
    setLoading(true);

    try {
      const response = await fetch('/api/privacy/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exportType })
      });

      if (!response.ok) throw new Error('Failed to request export');

      alert('Export requested! You will receive an email when it\'s ready.');
    } catch (error) {
      logger.error('Error requesting export:', error);
      alert('Failed to request export');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          What would you like to export?
        </label>
        <select
          value={exportType}
          onChange={(e) => setExportType(e.target.value as any)}
          className="w-full px-4 py-2 border rounded-lg"
        >
          <option value="full_export">Everything (Full Export)</option>
          <option value="personal_data">Personal Data Only</option>
          <option value="activity_logs">Activity Logs</option>
          <option value="transactions">Transactions</option>
        </select>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Export includes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Profile information</li>
              <li>Event registrations</li>
              <li>Payment history</li>
              <li>Activity logs</li>
              <li>Privacy settings</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        onClick={handleRequestExport}
        disabled={loading}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Clock className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Request Export
          </>
        )}
      </button>

      <p className="text-xs text-gray-600 text-center">
        Processing may take a few minutes. Download link will be emailed to you and expires in 7 days.
      </p>
    </div>
  );
}
