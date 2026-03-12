'use client';

import { useState } from 'react';
import { QrScanner } from '@/components/qr/QrScanner';
import { CheckInResult } from '@/components/qr/CheckInResult';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, QrCode } from 'lucide-react';

interface CheckInData {
  success?: boolean;
  message?: string;
  error?: string;
  registration?: {
    id: string;
    registration_number: string;
    user: {
      full_name: string;
      email: string;
    };
    event: {
      title: string;
    };
    checked_in_at: string;
  };
}

export default function CheckInPage() {
  const [checkInResult, setCheckInResult] = useState<CheckInData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = async (qrCode: string) => {
    setIsProcessing(true);
    setCheckInResult(null);

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_code: qrCode }),
      });

      const data: CheckInData = await response.json();
      setCheckInResult(data);
    } catch (error) {
      setCheckInResult({
        error: 'Failed to process check-in. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCheckIn = () => {
    setCheckInResult(null);
    setShowScanner(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card role="main" aria-labelledby="checkin-title">
          <CardHeader>
            <CardTitle id="checkin-title" className="flex items-center gap-2">
              <QrCode className="h-6 w-6" aria-hidden="true" />
              Event Check-In
            </CardTitle>
            <CardDescription>
              Scan QR codes to check in attendees at your events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showScanner && !checkInResult && (
              <div className="text-center">
                <Button
                  onClick={() => setShowScanner(true)}
                  size="lg"
                  className="w-full sm:w-auto"
                  aria-describedby="start-scanner-desc"
                >
                  <QrCode className="mr-2 h-4 w-4" aria-hidden="true" />
                  Start QR Scanner
                </Button>
                <p id="start-scanner-desc" className="sr-only">
                  Opens the QR code scanner to check in event attendees
                </p>
              </div>
            )}

            {showScanner && !checkInResult && (
              <div className="space-y-4" role="region" aria-label="QR Scanner">
                <QrScanner onScan={handleScan} isProcessing={isProcessing} />
                <Button
                  onClick={() => setShowScanner(false)}
                  variant="outline"
                  className="w-full"
                  aria-describedby="cancel-scanner-desc"
                >
                  Cancel Scanner
                </Button>
                <p id="cancel-scanner-desc" className="sr-only">
                  Closes the QR scanner and returns to the start screen
                </p>
              </div>
            )}

            {checkInResult && (
              <div className="space-y-4" role="region" aria-label="Check-in Result">
                {checkInResult.success ? (
                  <Alert className="border-green-200 bg-green-50" role="alert" aria-live="polite">
                    <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                    <AlertDescription className="text-green-800">
                      {checkInResult.message}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-red-200 bg-red-50" role="alert" aria-live="polite">
                    <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
                    <AlertDescription className="text-red-800">
                      {checkInResult.error}
                    </AlertDescription>
                  </Alert>
                )}

                {checkInResult.registration && (
                  <CheckInResult registration={checkInResult.registration} />
                )}

                <Button
                  onClick={resetCheckIn}
                  className="w-full"
                  aria-describedby="scan-another-desc"
                >
                  Scan Another QR Code
                </Button>
                <p id="scan-another-desc" className="sr-only">
                  Resets the check-in process to scan another attendee's QR code
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}