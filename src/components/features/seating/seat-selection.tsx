'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SeatSelectionProps {
  eventId: string;
}

export function SeatSelection({ eventId }: SeatSelectionProps) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(amount);
  };

  const totalPrice = selectedSeats.length * 500; // Placeholder price

  const handleProceed = () => {
    if (selectedSeats.length === 0) return;
    // Redirect to checkout with selected seats
    window.location.href = `/events/${eventId}/tickets/checkout?seats=${selectedSeats.join(',')}`;
  };

  return (
    <Card className="p-6 sticky top-4">
      <h2 className="text-xl font-bold mb-4">Your Selection</h2>
      
      {selectedSeats.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Select seats from the chart
        </p>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-sm">Seats Selected</span>
              <Badge variant="secondary">{selectedSeats.length}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Price per Seat</span>
              <span className="text-sm font-medium">{formatCurrency(500)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg">{formatCurrency(totalPrice)}</span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Selected Seats:</p>
            <div className="flex flex-wrap gap-1">
              {selectedSeats.map((seat) => (
                <Badge key={seat} variant="outline">
                  {seat}
                </Badge>
              ))}
            </div>
          </div>

          <Button onClick={handleProceed} className="w-full" size="lg">
            Proceed to Checkout
          </Button>
        </>
      )}
    </Card>
  );
}
