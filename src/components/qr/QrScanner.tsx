'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Keyboard } from 'lucide-react';
import { logger } from '@/lib/logger';

interface QrScannerProps {
  onScan: (qrCode: string) => void;
  isProcessing: boolean;
}

export function QrScanner({ onScan, isProcessing }: QrScannerProps) {
  const [manualInput, setManualInput] = useState('');
  const [useManualInput, setUseManualInput] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!useManualInput && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [useManualInput]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      logger.error('Error accessing camera:', error);
      setUseManualInput(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Here you would integrate with a QR code scanning library
    // For now, we'll use manual input as fallback
    // In a real implementation, you'd use a library like @zxing/library or qr-scanner
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  return (
    <Card role="region" aria-labelledby="scanner-title">
      <CardHeader>
        <CardTitle id="scanner-title" className="flex items-center gap-2">
          <Camera className="h-5 w-5" aria-hidden="true" />
          QR Code Scanner
        </CardTitle>
        <CardDescription>
          Position the QR code within the camera view or enter manually
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!useManualInput ? (
          <div className="space-y-4">
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden" role="img" aria-label="QR code scanning area">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                aria-label="Camera feed for QR code scanning"
              />
              <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
              <div className="absolute inset-0 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Camera className="h-12 w-12 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm">Position QR code here</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setUseManualInput(true)}
              variant="outline"
              className="w-full"
              disabled={isProcessing}
              aria-describedby="manual-input-desc"
            >
              <Keyboard className="mr-2 h-4 w-4" aria-hidden="true" />
              Enter Manually Instead
            </Button>
            <p id="manual-input-desc" className="sr-only">
              Switch to manual text input if camera scanning is not available
            </p>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4" role="form" aria-labelledby="manual-form-title">
            <h3 id="manual-form-title" className="sr-only">Manual QR Code Entry</h3>
            <div>
              <Label htmlFor="qr-input">QR Code Value</Label>
              <Input
                id="qr-input"
                type="text"
                placeholder="Enter QR code value"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                disabled={isProcessing}
                aria-describedby="qr-input-desc"
                aria-required="true"
              />
              <p id="qr-input-desc" className="text-sm text-gray-500 mt-1">
                Enter the QR code value manually if camera scanning is not available
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={!manualInput.trim() || isProcessing}
                className="flex-1"
                aria-describedby="submit-desc"
              >
                {isProcessing ? 'Processing...' : 'Submit'}
              </Button>
              <p id="submit-desc" className="sr-only">
                Submit the manually entered QR code for check-in processing
              </p>
              <Button
                type="button"
                onClick={() => setUseManualInput(false)}
                variant="outline"
                disabled={isProcessing}
                aria-describedby="camera-desc"
              >
                Use Camera
              </Button>
              <p id="camera-desc" className="sr-only">
                Switch back to camera-based QR code scanning
              </p>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}