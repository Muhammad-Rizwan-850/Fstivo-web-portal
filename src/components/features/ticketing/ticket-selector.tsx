'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Tier {
  id: string;
  name: string;
  description: string;
  price: number;
  available: number;
  quantity: number;
}

interface Event {
  id: string;
}

interface TicketSelectorProps {
  event: Event;
  tiers: Tier[];
}

export function TicketSelector({ event, tiers }: TicketSelectorProps) {
  const [selected, setSelected] = useState<Record<string, number>>({});

  const total = Object.entries(selected).reduce((sum, [tierId, qty]) => {
    const tier = tiers.find((t) => t.id === tierId);
    return sum + (tier?.price || 0) * qty;
  }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(amount);
  };

  const handleCheckout = () => {
    const tierIds = Object.keys(selected).filter((id) => selected[id] > 0);
    if (tierIds.length === 0) return;

    window.location.href = `/events/${event.id}/tickets/checkout?tier=${tierIds[0]}&quantity=${selected[tierIds[0]]}`;
  };

  return (
    <div className="space-y-4">
      {tiers.map((tier) => (
        <Card key={tier.id} className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <p className="text-sm text-muted-foreground">{tier.description}</p>
              <p className="mt-2 text-2xl font-bold">
                {formatCurrency(tier.price)}
              </p>
              <p className="text-sm text-muted-foreground">
                {tier.available}/{tier.quantity} available
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSelected((s) => ({
                    ...s,
                    [tier.id]: Math.max(0, (s[tier.id] || 0) - 1),
                  }))
                }
                disabled={!selected[tier.id]}
              >
                -
              </Button>
              <span className="w-12 text-center">{selected[tier.id] || 0}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSelected((s) => ({
                    ...s,
                    [tier.id]: Math.min(tier.available, (s[tier.id] || 0) + 1),
                  }))
                }
                disabled={tier.available === 0}
              >
                +
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {total > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{formatCurrency(total)}</p>
            </div>
            <Button onClick={handleCheckout} size="lg">
              Continue to Checkout
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
