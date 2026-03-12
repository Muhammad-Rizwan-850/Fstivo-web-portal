'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface QRScannerProps {
  eventId: string;
}

export function QRScanner({ eventId }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    attendee?: { full_name: string; email: string };
  } | null>(null);

  const handleScan = async (code: string) => {
    try {
      const res = await fetch('/api/checkin/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code: code, event_id: eventId }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to process QR code',
      });
    }
  };

  const handleManualInput = (code: string) => {
    handleScan(code);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div
          className={`aspect-video rounded-lg flex items-center justify-center ${
            scanning
              ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
              : 'bg-gray-100 dark:bg-gray-800'
          }`}
        >
          {scanning ? (
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-sm font-medium">Scanning...</p>
              <p className="text-xs text-muted-foreground mt-1">Position QR code in frame</p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <svg
                className="h-16 w-16 mx-auto mb-2 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              <p>Camera Off</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => setScanning(!scanning)}
            className="flex-1"
            variant={scanning ? 'destructive' : 'default'}
          >
            {scanning ? 'Stop Scanning' : 'Start Scanning'}
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Manual Check-In</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter ticket code or email"
            className="flex-1 px-3 py-2 border rounded-md text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleManualInput(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <Button
            onClick={() => {
              const input = document.querySelector('input') as HTMLInputElement;
              if (input?.value) {
                handleManualInput(input.value);
                input.value = '';
              }
            }}
          >
            Check In
          </Button>
        </div>
      </Card>

      {result && (
        <Card
          className={`p-4 border-2 ${
            result.success
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-red-500 bg-red-50 dark:bg-red-900/20'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${
              result.success ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {result.success ? (
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{result.message}</p>
              {result.attendee && (
                <div className="mt-2 text-sm">
                  <p>{result.attendee.full_name}</p>
                  <p className="text-muted-foreground">{result.attendee.email}</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setResult(null)}
            >
              Clear
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
