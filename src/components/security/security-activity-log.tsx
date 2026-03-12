'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Clock } from 'lucide-react';
import { logger } from '@/lib/logger';

interface SecurityActivityLogProps {
  userId: string;
}

export function SecurityActivityLog({ userId }: SecurityActivityLogProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [userId]);

  async function loadLogs() {
    setLoading(true);
    try {
      const response = await fetch(`/api/audit-logs?userId=${userId}`);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      logger.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading security activity...</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No security activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <Shield className={`w-5 h-5 mt-0.5 ${
            log.status === 'success' ? 'text-green-600' :
            log.status === 'failed' ? 'text-red-600' :
            'text-yellow-600'
          }`} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{formatAction(log.action)}</p>
            <p className="text-xs text-gray-600">{new Date(log.created_at).toLocaleString()}</p>
          </div>
          <div className={`text-xs px-2 py-1 rounded-full ${
            log.status === 'success' ? 'bg-green-100 text-green-800' :
            log.status === 'failed' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {log.status}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatAction(action: string): string {
  return action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
