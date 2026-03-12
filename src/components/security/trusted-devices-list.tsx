'use client';

import React, { useState } from 'react';
import { Trash2, Monitor } from 'lucide-react';
import { logger } from '@/lib/logger';

interface TrustedDevicesListProps {
  devices: any[];
  userId: string;
}

export function TrustedDevicesList({ devices, userId }: TrustedDevicesListProps) {
  const [loading, setLoading] = useState(false);

  async function handleRemoveDevice(deviceId: string) {
    if (!confirm('Are you sure you want to remove this trusted device?')) return;

    setLoading(true);
    try {
      await fetch(`/api/auth/devices/${deviceId}`, {
        method: 'DELETE'
      });
      window.location.reload();
    } catch (error) {
      logger.error('Error removing device:', error);
      alert('Failed to remove device');
    } finally {
      setLoading(false);
    }
  }

  if (devices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No trusted devices yet</p>
        <p className="text-sm">Devices you trust will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {devices.map((device) => (
        <div
          key={device.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium">{device.device_name || 'Unknown Device'}</p>
              <p className="text-sm text-gray-600">
                {device.browser} on {device.os}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              <p>Last used: {new Date(device.last_used_at).toLocaleDateString()}</p>
              {device.expires_at && (
                <p>Expires: {new Date(device.expires_at).toLocaleDateString()}</p>
              )}
            </div>
            <button
              onClick={() => handleRemoveDevice(device.device_id)}
              disabled={loading}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
