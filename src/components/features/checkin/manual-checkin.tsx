'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ManualCheckInProps {
  eventId: string;
}

export function ManualCheckIn({ eventId }: ManualCheckInProps) {
  const [email, setEmail] = useState('');
  const [ticketCode, setTicketCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleCheckIn = async () => {
    if (!email && !ticketCode) {
      setResult({ success: false, message: 'Please enter email or ticket code' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/checkin/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          attendee_email: email,
          ticket_code: ticketCode,
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setEmail('');
        setTicketCode('');
      }
    } catch (error) {
      setResult({ success: false, message: 'Failed to check in attendee' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Manual Check-In</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Attendee Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="attendee@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="text-center text-sm text-muted-foreground">
            OR
          </div>

          <div>
            <Label htmlFor="code">Ticket Code</Label>
            <Input
              id="code"
              placeholder="Enter ticket code"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value)}
            />
          </div>

          <Button onClick={handleCheckIn} disabled={loading} className="w-full">
            {loading ? 'Checking In...' : 'Check In'}
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
          <p className="font-semibold">{result.message}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setResult(null)}
          >
            Clear
          </Button>
        </Card>
      )}
    </div>
  );
}
